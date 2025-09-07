# Uply API Documentation

## Overview
REST API for the Uply website monitoring service. Provides endpoints for user authentication, website management, and monitoring data.

## Base URL
```
http://localhost:3001
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Health Check
- **GET** `/health` - Check API health status

### Authentication
- **POST** `/user/signup` - Create new user account
- **POST** `/user/signin` - Sign in and get JWT token
- **GET** `/user/profile` - Get current user profile (auth required)

### Website Management
- **GET** `/websites` - Get all user websites (auth required)
- **POST** `/website` - Add new website (auth required)
- **GET** `/website/:id` - Get website details (auth required)
- **PUT** `/website/:id` - Update website (auth required)
- **DELETE** `/website/:id` - Delete website (auth required)

### Monitoring
- **GET** `/status/:websiteId` - Get latest website status (auth required)
- **GET** `/website/:websiteId/history` - Get website status history (auth required)
- **GET** `/dashboard` - Get dashboard overview stats (auth required)

## Request/Response Examples

### User Signup
```http
POST /user/signup
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

Response:
```json
{
  "id": "user-id",
  "username": "john_doe",
  "message": "User created successfully"
}
```

### Add Website
```http
POST /website
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com",
  "isActive": true
}
```

Response:
```json
{
  "id": "website-id",
  "url": "https://example.com",
  "isActive": true,
  "timeAdded": "2024-01-01T00:00:00.000Z"
}
```

### Get Dashboard
```http
GET /dashboard
Authorization: Bearer <token>
```

Response:
```json
{
  "totalWebsites": 5,
  "upCount": 4,
  "downCount": 1,
  "uptimePercentage": 80,
  "avgResponseTime": 245,
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

## Error Responses
All errors follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details (optional)"
}
```

Common error codes:
- `INVALID_TOKEN` - JWT token is invalid
- `TOKEN_EXPIRED` - JWT token has expired
- `USER_EXISTS` - Username already taken
- `INVALID_CREDENTIALS` - Wrong username/password
- `INTERNAL_ERROR` - Server error

## Environment Variables
```
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
PORT=3001
```

## Development
Start the API server:
```bash
cd apps/api
bun run start
```

Test endpoints using the provided `test-endpoints.http` file with a REST client.