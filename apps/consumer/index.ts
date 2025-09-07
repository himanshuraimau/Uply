import { xReadGroup, xAckBulk } from "@uply/redis/client";
import { prisma } from "store/client";
import axios, { AxiosError } from "axios";
import { createServer } from "node:http";


const REGION_NAME = process.env.REGION_NAME || "india";
const WORKER_ID = process.env.WORKER_ID || "0";
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || "3002", 10);

let lastProcessedTime = Date.now();
let totalProcessed = 0;
let totalErrors = 0;
let redisConnectionStatus = 'disconnected';
let lastRedisError: string | null = null;


if (!REGION_NAME) {
    throw new Error('REGION_NAME is not set');
}

if (!WORKER_ID) {
    throw new Error('WORKER_ID is not set');
}

// Get or create region
async function getOrCreateRegion(regionName: string) {
    try {
        let region = await prisma.region.findUnique({
            where: { name: regionName }
        });
        
        if (!region) {
            region = await prisma.region.create({
                data: { name: regionName }
            });
            console.log(`✓ Created new region: ${region.name} (ID: ${region.id})`);
        }
        
        return region;
    } catch (error) {
        console.error(`❌ Database error getting/creating region ${regionName}:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}


async function main() {
    console.log(`🚀 Consumer starting - Region: ${REGION_NAME}, Worker: ${WORKER_ID}`);
    
    const region = await getOrCreateRegion(REGION_NAME);
    console.log(`✓ Region initialized: ${region.name} (ID: ${region.id})`);
    
    while (true) {
        try {
            console.log('📡 Reading from Redis stream...');
            const response = await xReadGroup(REGION_NAME, WORKER_ID);
            
            // Update Redis connection status
            redisConnectionStatus = 'connected';
            lastRedisError = null;

            if (!response || !Array.isArray(response) || response.length === 0) {
                console.log('⏳ No messages in stream, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            console.log(`📨 Received ${response.length} stream entries`);
            
            const messagePromises: Promise<{ messageId: string; success: boolean }>[] = [];
            
            // Redis xReadGroup returns array of stream entries
            // Each entry has: { name: string, messages: Array<{ id: string, message: Record<string, string> }> }
            for (const streamEntry of response) {
                if (!streamEntry || typeof streamEntry !== 'object' || !('name' in streamEntry) || !('messages' in streamEntry)) {
                    console.warn(`⚠️ Invalid stream entry format:`, streamEntry);
                    continue;
                }
                
                const streamName = streamEntry.name;
                const messages = streamEntry.messages;
                
                if (!messages || !Array.isArray(messages)) {
                    console.warn(`⚠️ No messages in stream entry:`, streamEntry);
                    continue;
                }
                
                console.log(`📋 Processing stream: ${streamName} with ${messages.length} messages`);
                
                // Process each message in the stream entry
                for (const messageData of messages) {
                    if (!messageData || typeof messageData !== 'object' || !('id' in messageData) || !('message' in messageData)) {
                        console.warn(`⚠️ Invalid message format:`, messageData);
                        continue;
                    }
                    
                    const messageId = String(messageData.id);
                    const messageContent = messageData.message;
                    
                    if (!messageId || !messageContent || typeof messageContent !== 'object') {
                        console.warn(`⚠️ Missing message ID or content:`, messageData);
                        continue;
                    }
                    
                    console.log(`🔍 Processing message ID: ${messageId}`);
                    
                    try {
                        // Extract url and id from message content
                        const url = 'url' in messageContent ? String(messageContent.url) : '';
                        const websiteId = 'id' in messageContent ? String(messageContent.id) : '';
                        
                        console.log(`📝 Parsed message:`, { url, websiteId, messageId });
                        
                        if (!url || !websiteId) {
                            console.warn(`⚠️ Invalid message format - missing url or id:`, { url, websiteId, messageId });
                            totalErrors++;
                            continue;
                        }
                        
                        messagePromises.push(
                            fetchWebsite(url, websiteId, region.id, messageId)
                                .then(() => ({ messageId, success: true }))
                                .catch((error) => {
                                    console.error(`❌ Failed to process message ${messageId}:`, {
                                        error: error instanceof Error ? error.message : String(error),
                                        url,
                                        websiteId
                                    });
                                    return { messageId, success: false };
                                })
                        );
                    } catch (parseError) {
                        console.error(`❌ Failed to parse message ${messageId}:`, {
                            error: parseError instanceof Error ? parseError.message : String(parseError),
                            messageContent
                        });
                        totalErrors++;
                    }
                }
            }
            
            if (messagePromises.length === 0) {
                console.log('⚠️ No valid messages to process');
                continue;
            }
            
            console.log(`⚡ Processing ${messagePromises.length} website checks...`);
            const results = await Promise.allSettled(messagePromises);
            
            // Collect successful message IDs for acknowledgment
            const successfulMessageIds: string[] = [];
            let successCount = 0;
            let failureCount = 0;
            
            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    if (result.value.success) {
                        successfulMessageIds.push(result.value.messageId);
                        successCount++;
                    } else {
                        failureCount++;
                    }
                } else {
                    console.error(`❌ Promise rejected for message:`, result.reason);
                    failureCount++;
                }
            });
            
            console.log(`📊 Processing complete - Success: ${successCount}, Failures: ${failureCount}`);
            
            // Acknowledge successfully processed messages
            if (successfulMessageIds.length > 0) {
                try {
                    console.log(`✅ Acknowledging ${successfulMessageIds.length} successful messages`);
                    await xAckBulk(REGION_NAME, successfulMessageIds);
                    console.log(`✓ Successfully acknowledged ${successfulMessageIds.length} messages`);
                } catch (ackError) {
                    console.error('❌ Failed to acknowledge messages:', {
                        error: ackError instanceof Error ? ackError.message : String(ackError),
                        messageIds: successfulMessageIds.slice(0, 5), // Log first 5 for debugging
                        totalCount: successfulMessageIds.length
                    });
                    totalErrors++;
                }
            }
            
            totalProcessed += successCount;
            totalErrors += failureCount;
            lastProcessedTime = Date.now();
            
        } catch (error) {
            console.error('❌ Error in main processing loop:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                region: REGION_NAME,
                workerId: WORKER_ID
            });
            redisConnectionStatus = 'error';
            lastRedisError = error instanceof Error ? error.message : String(error);
            totalErrors++;
            
            // Exponential backoff for Redis connection errors
            const backoffTime = Math.min(5000 * (2 ** Math.min(totalErrors, 5)), 30000);
            console.log(`⏳ Waiting ${backoffTime}ms before retry (attempt ${totalErrors})`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
    }
}





async function fetchWebsite(url: string, websiteId: string, regionId: string, messageId: string): Promise<void> {
    console.log(`🌐 Checking website: ${url} (ID: ${websiteId}, Message: ${messageId})`);
    
    const startTime = Date.now();
    let status: 'UP' | 'DOWN' = 'DOWN';
    let errorDetails: string | null = null;
    let responseTime = 0;

    try {
        // Perform HTTP request with comprehensive error handling
        try {
            const response = await axios.get(url, { 
                timeout: 10000, // 10 second timeout
                headers: {
                    'User-Agent': 'Uply-Monitor/1.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                validateStatus: (statusCode) => statusCode < 500, // Accept 4xx as UP, only 5xx as DOWN
                maxRedirects: 5, // Follow up to 5 redirects
                decompress: true // Handle compressed responses
            });
            
            responseTime = Date.now() - startTime;
            status = 'UP';
            console.log(`✅ ${url} is UP - Status: ${response.status} (${responseTime}ms)`);
            
        } catch (httpError) {
            responseTime = Date.now() - startTime;
            status = 'DOWN';
            
            if (axios.isAxiosError(httpError)) {
                const axiosError = httpError as AxiosError;
                
                if (axiosError.code === 'ECONNABORTED') {
                    errorDetails = 'Request timeout after 10 seconds';
                } else if (axiosError.code === 'ENOTFOUND') {
                    errorDetails = 'DNS resolution failed - domain not found';
                } else if (axiosError.code === 'ECONNREFUSED') {
                    errorDetails = 'Connection refused - server not responding';
                } else if (axiosError.code === 'ECONNRESET') {
                    errorDetails = 'Connection reset by server';
                } else if (axiosError.code === 'ETIMEDOUT') {
                    errorDetails = 'Connection timeout';
                } else if (axiosError.code === 'EHOSTUNREACH') {
                    errorDetails = 'Host unreachable';
                } else if (axiosError.code === 'ENETUNREACH') {
                    errorDetails = 'Network unreachable';
                } else if (axiosError.response) {
                    // Server responded with 5xx error
                    errorDetails = `HTTP ${axiosError.response.status} - ${axiosError.response.statusText}`;
                } else if (axiosError.request) {
                    // Request was made but no response received
                    errorDetails = 'No response received from server';
                } else {
                    // Something else happened
                    errorDetails = axiosError.message || 'Unknown HTTP error';
                }
            } else {
                errorDetails = httpError instanceof Error ? httpError.message : String(httpError);
            }
            
            console.log(`❌ ${url} is DOWN - Error: ${errorDetails} (${responseTime}ms)`);
        }

        // Store the result in database with comprehensive error handling
        try {
            const tickData = {
                website_id: websiteId,
                region_id: regionId,
                response_time_ms: responseTime,
                status: status
            };
            
            console.log(`💾 Storing tick for ${url}:`, tickData);
            
            await prisma.websiteTick.create({
                data: tickData
            });
            
            console.log(`✅ Successfully stored tick for ${url}: ${status} (${responseTime}ms)`);
            
        } catch (dbError) {
            const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
            const errorCode = dbError && typeof dbError === 'object' && 'code' in dbError ? dbError.code : 'UNKNOWN';
            
            console.error(`❌ Database error storing tick for ${url}:`, {
                error: errorMessage,
                code: errorCode,
                websiteId,
                regionId,
                status,
                responseTime,
                messageId,
                stack: dbError instanceof Error ? dbError.stack : undefined
            });
            
            // Check for specific database errors
            if (errorMessage.includes('Foreign key constraint')) {
                throw new Error(`Database constraint error: Website ID ${websiteId} or Region ID ${regionId} not found`);
            } else if (errorMessage.includes('Connection')) {
                throw new Error(`Database connection error: ${errorMessage}`);
            } else {
                throw new Error(`Database operation failed: ${errorMessage}`);
            }
        }
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Critical error processing ${url}:`, {
            error: errorMessage,
            websiteId,
            regionId,
            messageId,
            responseTime,
            status,
            errorDetails,
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

const healthServer = createServer((req, res) => {
    if (req.url === '/health') {
        const timeSinceLastProcessed = Date.now() - lastProcessedTime;
        const isHealthy = timeSinceLastProcessed < 60000 && redisConnectionStatus === 'connected'; // Healthy if processed within last minute
        
        const healthData = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            region: REGION_NAME,
            workerId: WORKER_ID,
            uptime: process.uptime(),
            lastProcessed: new Date(lastProcessedTime).toISOString(),
            totalProcessed,
            totalErrors,
            timeSinceLastProcessed,
            redisConnectionStatus,
            lastRedisError,
            errorRate: totalProcessed > 0 ? `${(totalErrors / (totalProcessed + totalErrors) * 100).toFixed(2)}%` : '0%'
        };
        
        const statusCode = isHealthy ? 200 : 503;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(healthData, null, 2));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

healthServer.listen(HEALTH_PORT, () => {
    console.log(`🏥 Consumer health check server running on port ${HEALTH_PORT}`);
    console.log(`📍 Region: ${REGION_NAME}, Worker: ${WORKER_ID}`);
});


main().catch(console.error);