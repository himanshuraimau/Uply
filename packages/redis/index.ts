import { createClient, type RedisClientType } from "redis";

const STREAM_NAME = 'uply:website';
const PUBSUB_CHANNEL = 'uply:website:ticks';

// Redis clients - initialized lazily
let client: RedisClientType | null = null;
let publisher: RedisClientType | null = null;
let subscriber: RedisClientType | null = null;

// Connection status tracking
let clientConnected = false;
let publisherConnected = false;
let subscriberConnected = false;

// Initialize main client for streams
async function getClient() {
    if (!client) {
        client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        client.on('error', (err: Error) => {
            console.error('❌ Redis Client Error:', err);
            clientConnected = false;
        });
        
        client.on('connect', () => {
            console.log('✅ Redis client connected');
            clientConnected = true;
        });
        
        client.on('disconnect', () => {
            console.log('🔌 Redis client disconnected');
            clientConnected = false;
        });
    }
    
    if (!clientConnected) {
        await client.connect();
    }
    
    return client;
}

// Initialize publisher client
async function getPublisher() {
    if (!publisher) {
        publisher = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        publisher.on('error', (err: Error) => {
            console.error('❌ Redis Publisher Error:', err);
            publisherConnected = false;
        });
        
        publisher.on('connect', () => {
            console.log('✅ Redis publisher connected');
            publisherConnected = true;
        });
        
        publisher.on('disconnect', () => {
            console.log('🔌 Redis publisher disconnected');
            publisherConnected = false;
        });
    }
    
    if (!publisherConnected) {
        await publisher.connect();
    }
    
    return publisher;
}

// Initialize subscriber client
async function getSubscriber() {
    if (!subscriber) {
        subscriber = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        subscriber.on('error', (err: Error) => {
            console.error('❌ Redis Subscriber Error:', err);
            subscriberConnected = false;
        });
        
        subscriber.on('connect', () => {
            console.log('✅ Redis subscriber connected');
            subscriberConnected = true;
        });
        
        subscriber.on('disconnect', () => {
            console.log('🔌 Redis subscriber disconnected');
            subscriberConnected = false;
        });
    }
    
    if (!subscriberConnected) {
        await subscriber.connect();
    }
    
    return subscriber;
}

type WebsiteEvent = {
    url: string;
    id: string;
}

export async function xAddBulk(websites: WebsiteEvent[]) {
    if (websites.length === 0) return;
    
    const redisClient = await getClient();
    const pipeline = redisClient.multi();
    for (const { url, id } of websites) {
        pipeline.xAdd(STREAM_NAME, '*', { url, id });
    }
    await pipeline.exec();
}

export async function xReadGroup(consumerGroup: string, workerId: string) {
    try {
        const redisClient = await getClient();
        
        // Ensure consumer group exists
        try {
            await redisClient.xGroupCreate(STREAM_NAME, consumerGroup, '0', {
                MKSTREAM: true
            });
            console.log(`✅ Consumer group created: ${consumerGroup}`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage.includes('BUSYGROUP')) {
                // Consumer group already exists, this is normal
            } else {
                console.error(`❌ Failed to create consumer group ${consumerGroup}:`, errorMessage);
                throw err;
            }
        }
        
        const response = await redisClient.xReadGroup(
            consumerGroup, workerId,
            { key: STREAM_NAME, id: '>' },
            { COUNT: 10, BLOCK: 1000 } 
        );
        
        return response;
    } catch (error) {
        console.error('❌ Error in xReadGroup:', {
            error: error instanceof Error ? error.message : String(error),
            consumerGroup,
            workerId,
            streamName: STREAM_NAME
        });
        throw error;
    }
}

export async function xAck(consumerGroup: string, eventId: string) {
    try {
        const redisClient = await getClient();
        const response = await redisClient.xAck(
            STREAM_NAME, consumerGroup, eventId
        );
        return response;
    } catch (error) {
        console.error(`❌ Error acknowledging message ${eventId}:`, error);
        return 0;
    }
}

export async function xAckBulk(consumerGroup: string, eventIds: string[]) {
    if (eventIds.length === 0) return 0;
    
    try {
        const redisClient = await getClient();
        const response = await redisClient.xAck(
            STREAM_NAME, consumerGroup, eventIds
        );
        console.log(`✅ Acknowledged ${response}/${eventIds.length} messages`);
        return response;
    } catch (error) {
        console.error('❌ Error bulk acknowledging messages:', {
            error: error instanceof Error ? error.message : String(error),
            consumerGroup,
            eventIds: eventIds.slice(0, 5),
            totalCount: eventIds.length
        });
        throw error;
    }
}

// ============= Pub/Sub for Real-Time Updates =============

export interface WebsiteTickEvent {
    websiteId: string;
    userId: string;
    status: 'UP' | 'DOWN';
    responseTime: number;
    checkedAt: string;
    region: string;
}

// Publish a website tick event
export async function publishWebsiteTick(data: WebsiteTickEvent): Promise<void> {
    try {
        const redisPublisher = await getPublisher();
        await redisPublisher.publish(PUBSUB_CHANNEL, JSON.stringify(data));
        console.log(`📡 Published tick for website ${data.websiteId}`);
    } catch (error) {
        console.error('❌ Failed to publish tick:', error);
        throw error;
    }
}

// Subscribe to website tick events
export async function subscribeToWebsiteTicks(
    callback: (data: WebsiteTickEvent) => void
): Promise<void> {
    try {
        const redisSubscriber = await getSubscriber();
        await redisSubscriber.subscribe(PUBSUB_CHANNEL, (message) => {
            try {
                const data = JSON.parse(message) as WebsiteTickEvent;
                callback(data);
            } catch (error) {
                console.error('❌ Failed to parse tick message:', error);
            }
        });
        console.log(`✅ Subscribed to ${PUBSUB_CHANNEL}`);
    } catch (error) {
        console.error('❌ Failed to subscribe:', error);
        throw error;
    }
}

// Health check function
export async function checkRedisHealth(): Promise<{ 
    client: boolean; 
    publisher: boolean; 
    subscriber: boolean;
    details: string[];
}> {
    const details: string[] = [];
    
    try {
        if (clientConnected) {
            await client?.ping();
            details.push('Client: Connected and responsive');
        } else {
            details.push('Client: Not connected');
        }
    } catch (error) {
        details.push(`Client: Error - ${error}`);
    }
    
    try {
        if (publisherConnected) {
            await publisher?.ping();
            details.push('Publisher: Connected and responsive');
        } else {
            details.push('Publisher: Not connected');
        }
    } catch (error) {
        details.push(`Publisher: Error - ${error}`);
    }
    
    try {
        if (subscriberConnected) {
            await subscriber?.ping();
            details.push('Subscriber: Connected and responsive');
        } else {
            details.push('Subscriber: Not connected');
        }
    } catch (error) {
        details.push(`Subscriber: Error - ${error}`);
    }
    
    return {
        client: clientConnected,
        publisher: publisherConnected,
        subscriber: subscriberConnected,
        details
    };
}

// Cleanup function for graceful shutdown
export async function closeRedisConnections(): Promise<void> {
    console.log('🔌 Closing Redis connections...');
    const promises = [];
    
    if (client && clientConnected) {
        promises.push(client.quit().catch(console.error));
    }
    if (publisher && publisherConnected) {
        promises.push(publisher.quit().catch(console.error));
    }
    if (subscriber && subscriberConnected) {
        promises.push(subscriber.quit().catch(console.error));
    }
    
    await Promise.all(promises);
    
    // Reset connection states
    clientConnected = false;
    publisherConnected = false;
    subscriberConnected = false;
    
    console.log('✅ Redis connections closed');
}

// Export clients for advanced usage (optional)
export { client, publisher, subscriber };