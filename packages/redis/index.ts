import { createClient } from "redis";


const STREAM_NAME = 'uply:website';
const PUBSUB_CHANNEL = 'uply:website:ticks';

// Main client for streams
const client = await createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
})
    .on('error', (err) => {
        console.log('Redis Client Error', err);
    })
    .connect();

// Separate clients for pub/sub (Redis requires separate connections)
const publisher = await createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
})
    .on('error', (err) => {
        console.error('❌ Redis Publisher Error:', err);
    })
    .connect();

const subscriber = await createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
})
    .on('error', (err) => {
        console.error('❌ Redis Subscriber Error:', err);
    })
    .connect();

console.log('✅ Redis clients connected (stream, pub, sub)');

type WebsiteEvent = {
    url: string;
    id: string;
}

async function xAdd({ url, id }: WebsiteEvent) {
    await client.xAdd(
        STREAM_NAME, '*', {
        url,
        id
    }
    );
}

export async function xAddBulk(websites: WebsiteEvent[]) {
    if (websites.length === 0) return;
    
    const pipeline = client.multi();
    for (const { url, id } of websites) {
        pipeline.xAdd(STREAM_NAME, '*', { url, id });
    }
    await pipeline.exec();
}

export async function xReadGroup(consumerGroup: string, workerId: string) {
    try {
        // Ensure consumer group exists
        try {
            await client.xGroupCreate(STREAM_NAME, consumerGroup, '0', {
                MKSTREAM: true
            });
            console.log(`✅ Consumer group created: ${consumerGroup}`);
        } catch (err: any) {
            if (err.message?.includes('BUSYGROUP')) {
                // Consumer group already exists, this is normal
            } else {
                console.error(`❌ Failed to create consumer group ${consumerGroup}:`, err.message);
                throw err;
            }
        }
        const response = await client.xReadGroup(
            consumerGroup, workerId,
            { key: STREAM_NAME, id: '>' },
            { COUNT: 10, BLOCK: 1000 } 
        );
        
        // Response received from Redis
        
        return response;
    } catch (error) {
        console.error('❌ Error in xReadGroup:', {
            error: error instanceof Error ? error.message : String(error),
            consumerGroup,
            workerId,
            streamName: STREAM_NAME
        });
        throw error; // Re-throw to let consumer handle with backoff
    }
}


export async function xAck(consumerGroup: string, eventId: string) {
    try {
        const response = await client.xAck(
            STREAM_NAME, consumerGroup, eventId
        );
        return response;
    } catch (error) {
        console.error(`Error acknowledging message ${eventId}:`, error);
        return 0;
    }
}

export async function xAckBulk(consumerGroup: string, eventIds: string[]) {
    if (eventIds.length === 0) return 0;
    
    try {
        const response = await client.xAck(
            STREAM_NAME, consumerGroup, eventIds
        );
        console.log(`✅ Acknowledged ${response}/${eventIds.length} messages`);
        return response;
    } catch (error) {
        console.error('❌ Error bulk acknowledging messages:', {
            error: error instanceof Error ? error.message : String(error),
            consumerGroup,
            eventIds: eventIds.slice(0, 5), // Log first 5 IDs for debugging
            totalCount: eventIds.length
        });
        throw error; // Re-throw to let consumer handle the error
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
        await publisher.publish(PUBSUB_CHANNEL, JSON.stringify(data));
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
        await subscriber.subscribe(PUBSUB_CHANNEL, (message) => {
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

// Cleanup function for graceful shutdown
export async function closeRedisConnections(): Promise<void> {
    console.log('🔌 Closing Redis connections...');
    await Promise.all([
        client.quit(),
        publisher.quit(),
        subscriber.quit()
    ]);
}

export { client, publisher, subscriber };