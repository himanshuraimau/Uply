# UPLY - Website Monitoring Platform

A comprehensive website uptime monitoring platform built with modern technologies. Monitor your websites globally, get instant alerts when they go down, and track performance metrics across multiple regions.

## Architecture

UPLY is built as a microservices architecture using a monorepo structure with the following components:

### Applications (`apps/`)

- **API** (`apps/api/`) - Express.js REST API server
- **Web** (`apps/web/`) - Next.js frontend application  
- **Producer** (`apps/producer/`) - Background service that queues websites for monitoring
- **Consumer** (`apps/consumer/`) - Worker service that performs website health checks
- **Tests** (`apps/tests/`) - Integration test suite

### Shared Packages (`packages/`)

- **Redis** (`packages/redis/`) - Redis client wrapper for stream processing
- **Store** (`packages/store/`) - Prisma database client and schema
- **UI** (`packages/ui/`) - Shared React components
- **ESLint Config** (`packages/eslint-config/`) - Shared linting configuration
- **TypeScript Config** (`packages/typescript-config/`) - Shared TypeScript configuration

## Tech Stack

- **Runtime**: Bun
- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Message Queue**: Redis Streams
- **Monorepo**: Turborepo
- **Authentication**: JWT

## Features

- **Global Monitoring** - Monitor websites from multiple regions
- **Real-time Alerts** - Instant notifications when websites go down
- **Performance Tracking** - Response time and uptime percentage analytics
- **Dashboard** - Comprehensive overview of all monitored websites
- **User Management** - Secure authentication and user accounts
- **Health Checks** - Built-in health monitoring for all services

## Getting Started

### Prerequisites

- Bun >= 1.2.10
- Node.js >= 18
- PostgreSQL database
- Redis server

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in root and each app directory
   - Configure database and Redis connections

### Development

Start all services in development mode:
```bash
bun run dev:all
```

Or start individual services:
```bash
bun run dev:api      # API server (port 3001)
bun run dev:web      # Web frontend (port 3000)  
bun run dev:producer # Producer service
bun run dev:consumer # Consumer service
```

### Available Scripts

- `bun run build` - Build all applications
- `bun run dev` - Start development servers
- `bun run lint` - Lint all packages
- `bun run format` - Format code with Prettier
- `bun run check-types` - Type check all packages

## API Endpoints

### Authentication
- `POST /user/signup` - Create new user account
- `POST /user/signin` - Sign in user
- `GET /user/profile` - Get user profile (authenticated)

### Website Management
- `GET /websites` - Get all user websites (authenticated)
- `POST /website` - Add new website to monitor (authenticated)
- `GET /website/:id` - Get website details (authenticated)
- `PUT /website/:id` - Update website settings (authenticated)
- `DELETE /website/:id` - Remove website (authenticated)

### Monitoring
- `GET /status/:websiteId` - Get latest website status (authenticated)
- `GET /website/:websiteId/history` - Get status history (authenticated)
- `GET /dashboard` - Get dashboard overview (authenticated)

### System
- `GET /health` - API health check

## Services

### Producer Service
- Queries active websites from database every 30 seconds
- Adds websites to Redis stream for monitoring
- Handles database connection errors gracefully

### Consumer Service  
- Processes websites from Redis stream
- Performs HTTP health checks with 10-second timeout
- Stores results in database with response times
- Supports multiple regions and workers
- Includes comprehensive error handling and retry logic

## Database Schema

The application uses Prisma with the following main entities:
- **User** - User accounts and authentication
- **Website** - Monitored websites with URLs and settings
- **Region** - Monitoring regions (e.g., "india", "us-east", etc.)
- **WebsiteTick** - Individual monitoring results with status and response times

## Monitoring & Health Checks

Each service exposes health check endpoints:
- API: `http://localhost:3001/health`
- Consumer: `http://localhost:3002/health` (configurable port)

Health checks include:
- Service uptime
- Database connectivity
- Redis connection status
- Memory usage
- Error rates and recent activity

## Configuration

### Environment Variables

Key environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `JWT_SECRET` - JWT signing secret
- `REGION_NAME` - Consumer region identifier
- `WORKER_ID` - Consumer worker identifier
- `HEALTH_PORT` - Consumer health check port

## Testing

Run integration tests:
```bash
cd apps/tests
bun test
```

Tests cover:
- User authentication endpoints
- Website monitoring functionality
- API error handling

## Deployment

The application is designed for containerized deployment with:
- Separate containers for each service
- Health check endpoints for load balancer integration
- Graceful error handling and recovery
- Horizontal scaling support for consumers

## License

Private - All rights reserved