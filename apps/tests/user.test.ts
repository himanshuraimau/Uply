import { describe, it, test } from "bun:test";
import axios from "axios";


describe("Signup Endpoint", () => {
    it("should create a new user", async () => {
        const response = await axios.post("http://localhost:3000/user/signup", {
            username: "testuser",
            password: "testpassword"
        });
        console.log(response.data);
        if (response.status !== 201) throw new Error("Expected status 201");
        if (!response.data.id) throw new Error("Expected user ID in response");
    });

    it("should fail with invalid input", async () => {
        try {
            await axios.post("http://localhost:3000/user/signup", {
                username: "tu"
            });
        } catch (error: any) {
            if (error.response.status !== 400) throw new Error("Expected status 400");
        }
    });
});

describe("Signin Endpoint", () => {
    test("should sign in an existing user", async () => {
        const response = await axios.post("http://localhost:3000/user/signin", {
            username: "testuser",
            password: "testpassword"
        });
        console.log(response.data);
        if (response.status !== 200) throw new Error("Expected status 200");
        if (!response.data.jwt) throw new Error("Expected JWT in response");
    });

    test("should fail with invalid credentials", async () => {
        try {
            await axios.post("http://localhost:3000/user/signin", {
                username: "testuser",
                password: "wrongpassword"
            });
        } catch (error: any) {
            if (error.response.status !== 401) throw new Error("Expected status 401");
        }
    });
});