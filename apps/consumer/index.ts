import { xReadGroup, xAck, xAckBulk } from "@uply/redis/client";
import { prisma } from "store/client";
import axios from "axios";
import { createServer } from "http";


const REGION_NAME = process.env.REGION_NAME || "india";
const WORKER_ID = process.env.WORKER_ID || "0";
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || "3001");

let lastProcessedTime = Date.now();
let totalProcessed = 0;
let totalErrors = 0;


if (!REGION_NAME) {
    throw new Error('REGION_NAME is not set');
}

if (!WORKER_ID) {
    throw new Error('WORKER_ID is not set');
}

// Get or create region
async function getOrCreateRegion(regionName: string) {
    let region = await prisma.region.findUnique({
        where: { name: regionName }
    });
    
    if (!region) {
        region = await prisma.region.create({
            data: { name: regionName }
        });
    }
    
    return region;
}


async function main() {
    const region = await getOrCreateRegion(REGION_NAME);
    
    while (true) {
        try {
            const response = await xReadGroup(REGION_NAME, WORKER_ID);

            if (!response || !Array.isArray(response) || response.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            const promises: Promise<void>[] = response.map((item: any) => {
                const streamData = item[1]; // Redis stream format: [streamName, [[id, [field, value, ...]]]]
                if (streamData && streamData.length > 0) {
                    const [messageId, fields] = streamData[0];
                    const message = parseRedisMessage(fields);
                    return fetchWebsite(message.url, message.id, region.id, messageId);
                }
                return Promise.resolve();
            });
            
            await Promise.all(promises);
            console.log(`Processed ${promises.length} messages`);
            totalProcessed += promises.length;
            lastProcessedTime = Date.now();

            // Acknowledge processed messages
            const messageIds = response
                .filter((item: any) => item[1] && item[1].length > 0)
                .map((item: any) => item[1][0][0]); // Extract message IDs
                
            if (messageIds.length > 0) {
                await xAckBulk(REGION_NAME, messageIds);
            }
        } catch (error) {
            console.error('Error in main loop:', error);
            totalErrors++;
            await new Promise(resolve => setTimeout(resolve, 5000)); 
        }
    }
}

function parseRedisMessage(fields: string[]): { url: string; id: string } {
    const message: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
        const key = fields[i];
        const value = fields[i + 1];
        if (key && value !== undefined) {
            message[key] = value;
        }
    }
    return {
        url: message.url || '',
        id: message.id || ''
    };
}



async function fetchWebsite(url: string, websiteId: string, regionId: string, messageId: string): Promise<void> {
    try {
        const startTime = Date.now();

        try {
            const response = await axios.get(url, { 
                timeout: 10000, 
                headers: {
                    'User-Agent': 'Uply-Monitor/1.0'
                }
            });
            
            const endTime = Date.now();
            await prisma.websiteTick.create({
                data: {
                    website_id: websiteId,
                    region_id: regionId,
                    response_time_ms: endTime - startTime,
                    status: 'UP'
                }
            });
            
            console.log(`✓ ${url} is UP (${endTime - startTime}ms)`);
        } catch (httpError) {
            const endTime = Date.now();
            await prisma.websiteTick.create({
                data: {
                    website_id: websiteId,
                    region_id: regionId,
                    response_time_ms: endTime - startTime,
                    status: 'DOWN'
                }
            });
            
            console.log(`✗ ${url} is DOWN (${endTime - startTime}ms)`);
        }
    } catch (dbError) {
        console.error(`Database error for ${url}:`, dbError);
        throw dbError;
    }
}

const healthServer = createServer((req, res) => {
    if (req.url === '/health') {
        const healthData = {
            status: 'healthy',
            region: REGION_NAME,
            workerId: WORKER_ID,
            uptime: process.uptime(),
            lastProcessed: new Date(lastProcessedTime).toISOString(),
            totalProcessed,
            totalErrors,
            timeSinceLastProcessed: Date.now() - lastProcessedTime
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(healthData, null, 2));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

healthServer.listen(HEALTH_PORT, () => {
    console.log(`Health check server running on port ${HEALTH_PORT}`);
});


main().catch(console.error);