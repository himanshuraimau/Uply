import { createClient } from "redis";


const STREAM_NAME = 'uply:website';

const client = await createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
})
    .on('error', (err) => {
        console.log('Redis Client Error', err);
    })
    .connect();

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
        try {
            await client.xGroupCreate(STREAM_NAME, consumerGroup, '0', {
                MKSTREAM: true
            });
        } catch (err: any) {
            if (!err.message?.includes('BUSYGROUP')) {
                throw err;
            }
        }

        const response = await client.xReadGroup(
            consumerGroup, workerId,
            { key: STREAM_NAME, id: '>' },
            { COUNT: 10, BLOCK: 1000 } 
        );
        
        return response;
    } catch (error) {
        console.error('Error in xReadGroup:', error);
        return null;
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
    if (eventIds.length === 0) return;
    
    try {
        const response = await client.xAck(
            STREAM_NAME, consumerGroup, eventIds
        );
        return response;
    } catch (error) {
        console.error('Error bulk acknowledging messages:', error);
        return 0;
    }
}
export { client };