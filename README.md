# Solana Energy Auction Backend

A production-ready Express.js + TypeScript backend for a Solana-based energy auction platform with wallet-only authentication.

## Features

- **Wallet-Only Authentication** - Ed25519 signature verification with JWT tokens
- **Real Solana Integration** - Live blockchain transactions on Solana devnet/mainnet
- **Production Architecture** - Docker, Redis, PostgreSQL, WebSocket support
- **Real-Time Updates** - WebSocket-based auction updates and notifications
- **Security First** - Rate limiting, CORS, Helmet, input validation
- **Monitoring Ready** - Prometheus, Grafana, structured logging

## Quick Start

### Development Setup

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

3. **Start database**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Run migrations**
   ```bash
   bun run prisma:migrate
   bun run prisma:seed
   ```

5. **Start development server**
   ```bash
   bun run dev
   ```

### Production Deployment

1. **Set environment variables**
   ```bash
   export POSTGRES_PASSWORD="your-secure-password"
   export JWT_SECRET="your-jwt-secret"
   export PRIVATE_KEY="your-solana-private-key-base58"
   export CORS_ORIGIN="https://yourdomain.com"
   export WEBSOCKET_CORS_ORIGIN="https://yourdomain.com"
   export SOLANA_PROGRAM_ID="your-deployed-program-id"
   ```

2. **Deploy with Docker**
   ```bash
   ./deploy.sh
   ```

3. **Access application**
   - API: `https://localhost/api`
   - Health: `https://localhost/health`
   - Monitoring: `http://localhost:3001` (Grafana)

## API Endpoints

### Authentication
- `POST /api/auth/init` - Initialize wallet authentication
- `POST /api/auth/verify` - Verify signature and get JWT
- `GET /api/auth/profile` - Get user profile (protected)

### Timeslots
- `GET /api/timeslots` - List auction timeslots
- `GET /api/timeslots/:id` - Get timeslot details

### Bids & Supplies
- `POST /api/bids` - Place bid (protected)
- `GET /api/my/bids` - Get user's bids (protected)
- `POST /api/supplies` - Commit supply (protected)
- `GET /api/my/supplies` - Get user's supplies (protected)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│   (React/Vue)   │◄──►│   (Express.js)  │◄──►│   (Solana)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (PostgreSQL)  │
                       └─────────────────┘
```

## Environment Configuration

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT token signing
- `PRIVATE_KEY` - Base58 encoded Solana private key
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `SOLANA_PROGRAM_ID` - Deployed Anchor program ID

### Optional Configuration

- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- `RATE_LIMIT_MAX_REQUESTS` - API rate limit per window
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## Testing

```bash
# Run all tests
bun test

# Run integration tests
bun run test:integration

# Run with coverage
bun run test:coverage

# Test real blockchain transactions
bun run test-real-production-transactions.ts
```

## Monitoring

Access monitoring dashboards:
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

## Security

- Ed25519 signature verification for wallet authentication
- JWT tokens with configurable expiration
- Rate limiting per wallet address and IP
- CORS protection for wallet providers
- Input validation with Zod schemas
- Security headers with Helmet.js

## License

MIT
