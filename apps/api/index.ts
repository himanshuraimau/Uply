import express from 'express';


const app = express();

app.use(express.json());


app.post('/website', (req, res) => {
    res.status(201).send({ message: 'Website created successfully' });
});

app.get('/website/:websiteId', (req, res) => {
    const { websiteId } = req.params;
    
    res.status(200).send({ message: `Website with ID ${websiteId} retrieved successfully` });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});