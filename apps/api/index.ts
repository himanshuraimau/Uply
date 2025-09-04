import express from 'express';
import { prisma } from "store/client";
import { AuthInputSchema } from './types';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './middleware';



const app = express();

app.use(express.json());


app.post('/website', authMiddleware, async (req, res) => {
    const website = await prisma.website.create({
        data: {
            url: req.body.url,
            timeAdded: new Date(),
            user_id: (req as any).userId,
        }
    });
    res.json({
        id: website.id,
    })
})


app.get("/status/:websiteId", authMiddleware, async (req, res) => {
    const { websiteId } = req.params;
    const website = await prisma.website.findFirst({
        where: {
            user_id: (req as any).userId,
            id: websiteId,
        },
        include: {
            ticks: {
                orderBy: [{
                    createdAt: 'desc'
                }],
                take: 1
            }
        }
    })
    if (!website) {
        return res.status(404).json({ error: "Website not found" });
    }
    const lastTick = website.ticks[0];
    if (!lastTick) {
        return res.status(404).json({ error: "No status available" });
    }
    res.json(
        lastTick
    );
})
;

app.post("/user/signup", async (req, res) => {


    const data = AuthInputSchema.safeParse(req.body);
    if (!data.success) {
        return res.status(400).json({ error: "Invalid input", details: data.error });
    }

    try {
        const user = await prisma.user.create({
            data: {
                username: data.data.username,
                password: data.data.password,
            }
        });
        res.status(201).json({ id: user.id });
    } catch (error) {
        res.status(500).json({ error: "User creation failed" });
    }


});

app.post("/user/signin", async (req, res) => {

    const data = AuthInputSchema.safeParse(req.body);
    if (!data.success) {
        return res.status(400).json({ error: "Invalid input", details: data.error });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                username: data.data.username,
            }
        });

        if (!user || user.password !== data.data.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string);
        if (!token) {
            return res.status(500).json({ error: "Token generation failed" });
        }

        res.status(200).json({
            jwt: token
        });
    } catch (error) {
        res.status(500).json({ error: "Sign-in failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});