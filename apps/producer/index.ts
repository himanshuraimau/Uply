import { prisma } from "store/client";

async function main(){
    let websites = await prisma.website.findMany({
        select:{
            url:true,
            id:true
        }
    })
}



setInterval(async () => {
    main();
}, 3000);