import { prisma } from "store/client";
import { xAddBulk } from "@uply/redis/client";

async function main() {
    try {
        const websites = await prisma.website.findMany({
            where: {
                isActive: true
            },
            select: {
                url: true,
                id: true
            }
        });

        console.log(`Found ${websites.length} active websites to monitor`);
        
        if (websites.length > 0) {
            await xAddBulk(websites.map(website => ({ 
                url: website.url, 
                id: website.id 
            })));
            console.log(`✓ Added ${websites.length} websites to monitoring queue`);
        }
    } catch (error) {
        console.error('Error in producer:', error);
    }
}

main();
setInterval(main, 30000);