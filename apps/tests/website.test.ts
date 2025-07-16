import { describe, it, expect } from 'bun:test';
import axios from 'axios';

let BASE_URL = 'http://localhost:3000';

describe("Website get created", () => {
    it("should create a website and return its ID", async () => {
        const response = await axios.post(`${BASE_URL}/website`, {
            url: 'https://example.com'
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id');
    });

    it("should retrieve the website by ID", async () => {
        const response = await axios.get(`${BASE_URL}/website/1`);

        expect(response.status).toBe(200);
        expect(response.data).toEqual({ message: 'Website with ID 1 retrieved successfully' });
    });
})