import express from 'express';
import { prisma } from "store/client";
const app = express();

app.use(express.json());


app.post('/website', async (req, res) => {
   const webiste =  await prisma.website.create({
        data: {
            url: req.body.url,
            timeAdded: new Date(),
        }
    });
    res.json({
        id: webiste.id,
    })
})


app.get('/website/:websiteId', (req, res) => {
    const { websiteId } = req.params;

    res.status(200).send({ message: `Website with ID ${websiteId} retrieved successfully` });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});