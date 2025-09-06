import { createClient } from "redis";


const client = await createClient()
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
        'uply:website', '*', {
        url,
        id
    }
    )
}

export async function xAddBulk(websites: WebsiteEvent[]) {
    for (let i = 0; i < websites.length; i++) {
        const { url, id } = websites[i] || { url: '', id: '' };
        await xAdd({ url, id });
    }
}