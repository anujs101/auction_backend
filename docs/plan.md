# Express.js Energy Auction Backend - Step-by-Step Builder Prompt

## Overview
You are an expert backend developer tasked with building a production-ready Express.js + TypeScript backend for a Solana-based energy auction platform with **wallet-only authentication**. You will implement this **step by step**, testing each functionality before moving to the next.

## Critical Rules & Requirements

### Code Quality Standards
- **NO TODO COMMENTS**: Every function must be fully implemented
- **NO PLACEHOLDER CODE**: All functions must contain working implementations
- **COMPLETE ERROR HANDLING**: Every function must handle all possible error scenarios
- **FULL TYPE SAFETY**: Use strict TypeScript with proper interfaces and types
- **COMPREHENSIVE LOGGING**: Add structured logging to all critical operations
- **NO CONSOLE.LOG**: Use proper logging library (Winston) for all output

### Testing Requirements
- **Test After Each Step**: Implement functionality → Write tests → Verify works → Move to next
- **Incremental Development**: Build one complete feature at a time
- **Integration Testing**: Test API endpoints with real database operations
- **Error Scenario Testing**: Test all error conditions and edge cases

### Project Structure Requirements
- **Directory**: `auction_backend/` (root directory name)
- **Solana Target**: `target/` directory from Solana program is present in project root
- **Package Manager**: Use **Bun** for faster performance and better TypeScript support
- **Environment**: Support for development, staging, and production environments

## Wallet-Only Authentication Flow

### Authentication Process
1. **User clicks 'Connect Wallet'** → Frontend initiates connection
2. **Wallet provider prompts for connection** → Phantom/Solflare/etc. opens
3. **User approves connection** → Wallet returns public key
4. **Backend generates message to sign** → Unique nonce-based message
5. **User signs message with wallet** → Cryptographic signature created
6. **Backend verifies signature → JWT issued** → Authentication complete
7. **User is authenticated** → Access granted to protected routes

### No Traditional Auth Required
- **No email/password registration**
- **No username/password login**
- **No email verification**
- **No password reset flows**
- **Wallet signature = Identity verification**

## Step-by-Step Implementation Plan

### STEP 1: Project Foundation & Setup
**Objective**: Create the basic project structure with all dependencies and configuration

#### 1.1 Initialize Project Structure
```bash
mkdir auction_backend
cd auction_backend
bun init
```

#### 1.2 Install All Dependencies (Complete List)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@types/express": "^4.17.17",
    "prisma": "^5.7.1",
    "@prisma/client": "^5.7.1",
    "@solana/web3.js": "^1.87.6",
    "@coral-xyz/anchor": "^0.29.0",
    "socket.io": "^4.7.4",
    "redis": "^4.6.12",
    "jsonwebtoken": "^9.0.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "bull": "^4.12.2",
    "dotenv": "^16.3.1",
    "tweetnacl": "^1.0.3",
    "bs58": "^5.0.0",
    "@noble/ed25519": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.4",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.16",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.1"
  }
}
```

#### 1.3 Create Complete Project Structure
```
auction_backend/
├── target/                    # Solana program build artifacts (existing)
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── timeslot.controller.ts
│   │   ├── bid.controller.ts
│   │   └── supply.controller.ts
│   ├── services/
│   │   ├── blockchain/
│   │   │   ├── solana.service.ts
│   │   │   ├── program.service.ts
│   │   │   └── event-indexer.service.ts
│   │   ├── wallet-auth.service.ts
│   │   ├── auction.service.ts
│   │   └── cache.service.ts
│   ├── middleware/
│   │   ├── wallet-auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── timeslot.routes.ts
│   │   ├── bid.routes.ts
│   │   └── supply.routes.ts
│   ├── websocket/
│   │   ├── socket.service.ts
│   │   └── rooms.service.ts
│   ├── database/
│   │   ├── prisma.service.ts
│   │   └── migrations/
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── blockchain.types.ts
│   │   ├── wallet-auth.types.ts
│   │   └── websocket.types.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   ├── wallet-crypto.ts
│   │   └── errors.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── environment.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── .env.development
├── tsconfig.json
├── jest.config.js
└── package.json
```

#### 1.4 Configuration Files
Create complete configuration files:

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/controllers/*": ["controllers/*"],
      "@/services/*": ["services/*"],
      "@/middleware/*": ["middleware/*"],
      "@/types/*": ["types/*"],
      "@/utils/*": ["utils/*"],
      "@/config/*": ["config/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist", "target"]
}
```

**Complete Environment Configuration**

#### 1.5 Test Foundation Setup
Create a simple health check endpoint and test it works:
```typescript
// Test that basic Express app starts and responds
```

**Verification Criteria for Step 1:**
- [ ] Project structure created correctly
- [ ] All dependencies installed without errors
- [ ] TypeScript compiles successfully
- [ ] Basic Express server starts on specified port
- [ ] Health check endpoint responds correctly

---

### STEP 2: Database Layer & Prisma Setup
**Objective**: Implement complete database layer with wallet-focused user model

#### 2.1 Complete Prisma Schema (Wallet-Focused)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Wallet-based user model
model User {
  id                String    @id @default(cuid())
  walletAddress     String    @unique // Solana public key
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?
  
  // Authentication tracking
  nonces            AuthNonce[]
  
  // User activity
  bids              Bid[]
  supplies          Supply[]
  transactions      Transaction[]
  
  @@map("users")
  @@index([walletAddress])
}

// Authentication nonces for wallet signature verification
model AuthNonce {
  id            String    @id @default(cuid())
  userId        String?
  walletAddress String    // Public key attempting to authenticate
  nonce         String    @unique // Random string to sign
  expiresAt     DateTime  // Nonce expiration (5 minutes)
  usedAt        DateTime? // When nonce was consumed
  createdAt     DateTime  @default(now())
  
  user          User?     @relation(fields: [userId], references: [id])
  
  @@map("auth_nonces")
  @@index([walletAddress])
  @@index([nonce])
  @@index([expiresAt])
}

enum TimeslotStatus {
  OPEN
  SEALED
  SETTLED
}

model Timeslot {
  id                String        @id @default(cuid())
  startTime         DateTime
  endTime           DateTime
  status            TimeslotStatus @default(OPEN)
  clearingPrice     Decimal?       @db.Decimal(10, 4)
  totalEnergy       Decimal        @db.Decimal(10, 4)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  bids              Bid[]
  supplies          Supply[]
  transactions      Transaction[]
  
  @@map("timeslots")
  @@index([startTime, endTime])
  @@index([status])
}

enum BidStatus {
  PENDING
  CONFIRMED
  MATCHED
  CANCELLED
  EXPIRED
}

model Bid {
  id                String     @id @default(cuid())
  userId            String
  timeslotId        String
  price             Decimal    @db.Decimal(10, 4)
  quantity          Decimal    @db.Decimal(10, 4)
  status            BidStatus  @default(PENDING)
  txSignature       String?    // Solana transaction signature
  escrowAccount     String?    // PDA for escrowed tokens
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  
  user              User       @relation(fields: [userId], references: [id])
  timeslot          Timeslot   @relation(fields: [timeslotId], references: [id])
  
  @@map("bids")
  @@index([userId])
  @@index([timeslotId])
  @@index([status])
}

enum SupplyStatus {
  COMMITTED
  CONFIRMED
  ALLOCATED
  DELIVERED
  CANCELLED
}

model Supply {
  id                String       @id @default(cuid())
  userId            String
  timeslotId        String
  quantity          Decimal      @db.Decimal(10, 4)
  reservePrice      Decimal      @db.Decimal(10, 4)
  status            SupplyStatus @default(COMMITTED)
  txSignature       String?      // Solana transaction signature
  escrowAccount     String?      // PDA for escrowed energy tokens
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  user              User         @relation(fields: [userId], references: [id])
  timeslot          Timeslot     @relation(fields: [timeslotId], references: [id])
  
  @@map("supplies")
  @@index([userId])
  @@index([timeslotId])
  @@index([status])
}

enum TransactionType {
  BID_PLACED
  SUPPLY_COMMITTED
  BID_MATCHED
  PAYMENT_SETTLED
  ESCROW_RELEASED
}

model Transaction {
  id                String          @id @default(cuid())
  userId            String
  timeslotId        String?
  type              TransactionType
  amount            Decimal         @db.Decimal(18, 9)
  txSignature       String          @unique // Solana transaction signature
  blockTime         DateTime?       // When transaction was confirmed on-chain
  status            String          @default("pending") // pending, confirmed, failed
  createdAt         DateTime        @default(now())
  
  user              User            @relation(fields: [userId], references: [id])
  timeslot          Timeslot?       @relation(fields: [timeslotId], references: [id])
  
  @@map("transactions")
  @@index([userId])
  @@index([txSignature])
  @@index([status])
}
```

#### 2.2 Prisma Service Implementation
Create a complete, production-ready Prisma service with:
- Connection management and pooling
- Health check functionality  
- Query optimization methods
- Transaction handling
- Error handling and logging
- Retry logic for connection issues

#### 2.3 Database Migration & Seeding
- Create initial migration
- Implement data seeding for development
- Test database connection and queries

**Verification Criteria for Step 2:**
- [ ] Database connection established successfully
- [ ] All Prisma models generated correctly
- [ ] CRUD operations work for all entities
- [ ] Database queries are properly indexed
- [ ] Connection pooling is configured
- [ ] Error handling works for database failures

---

### STEP 3: Wallet-Only Authentication System
**Objective**: Implement complete wallet-based authentication with signature verification

#### 3.1 Wallet Crypto Utilities
Implement complete cryptographic functions for Solana wallets:
```typescript
// utils/wallet-crypto.ts - Complete implementation required

interface SignatureVerificationResult {
  isValid: boolean;
  publicKey?: string;
  error?: string;
}

interface NonceMessage {
  message: string;
  nonce: string;
  timestamp: number;
}

class WalletCrypto {
  // Generate secure random nonce
  generateNonce(): string;
  
  // Create message for wallet to sign
  createSignMessage(walletAddress: string, nonce: string): string;
  
  // Verify ed25519 signature from Solana wallet
  verifySignature(
    message: string, 
    signature: string, 
    publicKey: string
  ): SignatureVerificationResult;
  
  // Parse and validate signed message
  parseSignedMessage(signedMessage: string): NonceMessage;
}
```

#### 3.2 Wallet Authentication Service
Create complete wallet authentication service:
```typescript
// services/wallet-auth.service.ts - Complete implementation required

interface WalletAuthRequest {
  walletAddress: string;
}

interface WalletSignRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

class WalletAuthService {
  // Step 4: Generate nonce and message for wallet to sign
  async initializeAuth(request: WalletAuthRequest): Promise<{
    nonce: string;
    message: string;
    expiresAt: Date;
  }>;
  
  // Step 6: Verify signature and issue JWT
  async verifyAndAuthenticate(request: WalletSignRequest): Promise<AuthTokens>;
  
  // Validate JWT token
  async validateToken(token: string): Promise<User>;
  
  // Refresh token (optional)
  async refreshToken(refreshToken: string): Promise<AuthTokens>;
  
  // Logout (invalidate token)
  async logout(userId: string): Promise<void>;
}
```

#### 3.3 Wallet Authentication Middleware
Implement middleware for wallet-based authentication:
```typescript
// middleware/wallet-auth.middleware.ts - Complete implementation required

// Verify JWT token and extract user
export const authenticateWallet = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void>;

// Optional authentication (user may or may not be logged in)
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void>;
```

#### 3.4 Wallet Authentication Routes & Controllers
Complete API endpoints following the 7-step wallet auth flow:
```typescript
// routes/auth.routes.ts & controllers/auth.controller.ts

// Step 1-4: Initialize wallet authentication
POST /api/auth/init
{
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
Response: {
  "nonce": "abc123...",
  "message": "Sign this message to authenticate with Auction Platform...",
  "expiresAt": "2024-01-01T12:05:00Z"
}

// Step 5-7: Verify signature and authenticate
POST /api/auth/verify
{
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "signature": "5a7d...", // base58 encoded signature
  "message": "Sign this message to authenticate..."
}
Response: {
  "accessToken": "eyJ...",
  "user": {
    "id": "user123",
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "createdAt": "...",
    "lastLoginAt": "..."
  },
  "expiresIn": 86400
}

// Get current user profile (protected)
GET /api/auth/profile
Headers: { Authorization: "Bearer <jwt-token>" }

// Logout (optional - could just delete token client-side)
POST /api/auth/logout
Headers: { Authorization: "Bearer <jwt-token>" }
```

#### 3.5 Authentication Error Handling
Complete error handling for wallet authentication:
- Invalid wallet address format
- Expired nonce
- Invalid signature
- Signature verification failure
- JWT token expired/invalid
- Rate limiting for auth attempts

**Verification Criteria for Step 3:**
- [ ] Nonce generation and storage works correctly
- [ ] Signature verification works with real wallet signatures
- [ ] JWT tokens are generated and validated properly
- [ ] Authentication middleware protects routes correctly
- [ ] Users can authenticate using Phantom/Solflare wallets
- [ ] Error handling covers all authentication scenarios
- [ ] Rate limiting prevents authentication abuse
- [ ] New users are automatically registered on first auth

---

### STEP 4: Blockchain Integration Layer
**Objective**: Complete Solana blockchain integration with program interaction

#### 4.1 Solana Connection Service
Implement robust Solana connection management:
- Multiple RPC endpoint support with failover
- Connection health monitoring
- Retry logic with exponential backoff
- Connection pooling and reuse
- Rate limiting for RPC calls

#### 4.2 Program Service Implementation
Complete Anchor program integration:
- Load program IDL from target directory
- Initialize program instance
- PDA (Program Derived Address) calculations
- Transaction preparation and signing
- Account fetching and parsing

#### 4.3 Transaction Monitoring Service
Implement comprehensive transaction monitoring:
- Transaction confirmation tracking
- Status updates and retries
- Failed transaction handling
- Transaction history logging

#### 4.4 Event Indexer Service
Create real-time event processing:
- Blockchain event listening
- Event parsing and validation
- Database synchronization
- WebSocket broadcasting
- Error recovery and restart logic

**Verification Criteria for Step 4:**
- [ ] Solana connection established successfully
- [ ] Program interaction works (can fetch accounts)
- [ ] Transaction preparation works correctly  
- [ ] Event listener captures blockchain events
- [ ] Database updates from blockchain events
- [ ] Connection failover works properly

---

### STEP 5: Core API Endpoints - Timeslots
**Objective**: Implement complete timeslot management API with wallet authentication

#### 5.1 Timeslot Service
Complete business logic for:
- Timeslot creation and management
- Status tracking (OPEN, SEALED, SETTLED)
- Validation rules
- State transitions

#### 5.2 Timeslot Controllers (Wallet-Protected)
Implement all timeslot endpoints with proper wallet authentication:
```typescript
// All endpoints require valid wallet authentication via JWT

// GET /api/timeslots - List timeslots (authenticated users only)
// GET /api/timeslots/:id - Get specific timeslot details
// POST /api/timeslots - Create new timeslot (admin wallets only)
// PUT /api/timeslots/:id/seal - Seal timeslot (admin wallets only)
// PUT /api/timeslots/:id/settle - Settle timeslot (admin wallets only)
```

#### 5.3 Timeslot Validation & Authorization
Complete validation with wallet-based authorization:
- Request parameter validation
- Business rule validation
- Wallet-based admin checks
- Error response formatting

**Verification Criteria for Step 5:**
- [ ] All timeslot endpoints require valid wallet authentication
- [ ] Pagination works with proper cursors
- [ ] Filtering and sorting work as expected
- [ ] Validation prevents invalid operations
- [ ] Wallet-based authorization prevents unauthorized access
- [ ] Database queries are optimized

---

### STEP 6: Bid Management System (Wallet-Authenticated)
**Objective**: Complete bid placement and management functionality with wallet integration

#### 6.1 Bid Service Implementation
Complete bid business logic with wallet integration:
- Bid validation and verification
- Wallet balance checks
- Price and quantity validation
- Timeslot status validation
- Transaction preparation for blockchain
- Bid status management

#### 6.2 Bid Controllers (Wallet-Protected)
Implement all bid endpoints with wallet authentication:
```typescript
// All endpoints require valid wallet authentication

// POST /api/bids - Place new bid (authenticated wallet required)
Request: {
  timeslotId: string,
  price: number,
  quantity: number
}

// GET /api/bids/:id - Get bid details (owner or admin only)
// GET /api/my/bids - Get current user's bids 
// DELETE /api/bids/:id - Cancel bid (owner only)
// GET /api/timeslots/:id/bids - Get bids for timeslot (paginated)
```

#### 6.3 Bid Validation & Security (Wallet-Based)
Complete validation system with wallet security:
- Input sanitization and validation
- Business rule enforcement
- Rate limiting per wallet address
- Duplicate bid prevention
- Wallet authorization checks

**Verification Criteria for Step 6:**
- [ ] Bid placement requires valid wallet authentication
- [ ] Only bid owners can view/modify their bids
- [ ] Transaction preparation includes proper escrow
- [ ] Bid validation prevents invalid bids
- [ ] Rate limiting prevents spam bidding per wallet
- [ ] Wallet balance validation works correctly

---

### STEP 7: Supply Management System (Wallet-Authenticated)
**Objective**: Complete supply commitment and management functionality with wallet integration

#### 7.1 Supply Service Implementation
Complete supply business logic with wallet integration:
- Supply commitment validation
- Energy availability checks via wallet
- Reserve price validation
- Escrow management
- Supply allocation tracking

#### 7.2 Supply Controllers (Wallet-Protected)
Implement all supply endpoints with wallet authentication:
```typescript
// All endpoints require valid wallet authentication

// POST /api/supplies - Commit energy supply (authenticated wallet required)
Request: {
  timeslotId: string,
  quantity: number,
  reservePrice: number
}

// GET /api/supplies/:id - Get supply details (owner or admin only)
// GET /api/my/supplies - Get current user's supplies
// PUT /api/supplies/:id - Update supply (owner only)
// GET /api/timeslots/:id/supplies - Get supplies for timeslot
```

#### 7.3 Supply Validation (Wallet-Based)
Complete validation system with wallet authorization:
- Energy quantity validation
- Reserve price checks
- Timeslot compatibility
- Wallet authorization
- Business rule enforcement

**Verification Criteria for Step 7:**
- [ ] Supply commitment requires valid wallet authentication
- [ ] Only supply owners can modify their commitments
- [ ] Validation prevents invalid commitments
- [ ] Supply allocation tracking works
- [ ] Integration with timeslot management works

---

### STEP 8: WebSocket Real-Time System (Wallet-Authenticated)
**Objective**: Complete real-time communication system with wallet-based authentication

#### 8.1 WebSocket Service Implementation
Complete WebSocket server with wallet authentication:
```typescript
// WebSocket authentication using JWT tokens

// Client connects with JWT token in auth header or query param
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  // Verify JWT and attach user info to socket
});
```

#### 8.2 Room Management Service (Wallet-Based)
Implement room-based messaging with wallet context:
- User-specific rooms based on wallet address
- Timeslot-specific rooms for auction updates
- Admin broadcast rooms
- Wallet-based room access control

#### 8.3 Real-Time Event Broadcasting (Wallet-Contextualized)
Complete event broadcasting with wallet-specific updates:
- Bid placement notifications to relevant wallets
- Supply commitment updates  
- Auction status changes
- Price updates and clearing
- User-specific notifications to wallet owners

**Verification Criteria for Step 8:**
- [ ] WebSocket connections require valid JWT authentication
- [ ] Room-based messaging respects wallet permissions
- [ ] Real-time updates broadcast to correct wallet users
- [ ] Authentication works for WebSocket connections
- [ ] Connection cleanup prevents memory leaks
- [ ] Message delivery is reliable

---

### STEP 9: Background Jobs & Queue System
**Objective**: Implement complete background processing system with wallet context

#### 9.1 Queue Service Implementation
Complete job queue system:
- Bull queue configuration
- Job definitions and processors
- Failed job handling and retry logic
- Job status tracking
- Queue monitoring and metrics

#### 9.2 Background Job Types (Wallet-Contextualized)
Implement all job processors with wallet awareness:
- Transaction monitoring jobs (per wallet)
- Blockchain sync jobs  
- Wallet notification delivery jobs
- Analytics processing jobs
- Cleanup and maintenance jobs

#### 9.3 Job Scheduling
Complete scheduling system:
- Recurring job scheduling
- Priority-based job processing
- Resource-intensive job throttling
- Job failure recovery

**Verification Criteria for Step 9:**
- [ ] Queue system processes wallet-related jobs correctly
- [ ] Failed jobs retry with proper backoff
- [ ] Scheduled jobs run at correct intervals
- [ ] Job monitoring shows proper metrics
- [ ] System handles high job volumes
- [ ] Resource usage is optimized

---

### STEP 10: Caching & Performance Layer (Wallet-Optimized)
**Objective**: Implement comprehensive caching with wallet-specific optimizations

#### 10.1 Redis Cache Service
Complete caching implementation:
- Redis connection management
- Wallet-based cache key strategies
- TTL management
- Cache invalidation logic
- Distributed caching support

#### 10.2 API Response Caching (Wallet-Aware)
Implement caching for:
- User-specific data caching (by wallet address)
- Timeslot data caching
- Bid history caching (wallet-specific)
- Supply history caching (wallet-specific)
- Public auction statistics caching

#### 10.3 Performance Monitoring
Complete monitoring system:
- Response time tracking
- Cache hit/miss ratios per wallet
- Database query performance
- Memory usage monitoring
- Error rate tracking

**Verification Criteria for Step 10:**
- [ ] Redis caching reduces database queries
- [ ] Wallet-specific caching works correctly
- [ ] Cache invalidation works properly
- [ ] API response times are improved
- [ ] Monitoring shows performance metrics
- [ ] System handles cache failures gracefully

---

### STEP 11: Security & Middleware (Wallet-Focused)
**Objective**: Complete security implementation with wallet-specific protections

#### 11.1 Security Middleware
Implement complete security stack:
- Helmet.js for security headers
- CORS configuration for wallet connections
- Request sanitization
- Wallet signature replay attack prevention
- XSS protection

#### 11.2 Rate Limiting System (Wallet-Based)
Complete rate limiting with wallet address tracking:
- API endpoint rate limiting per wallet
- Wallet-based rate limiting
- IP-based rate limiting as fallback
- Sliding window implementation
- Different limits for different wallet tiers

#### 11.3 Input Validation System
Comprehensive validation:
- Zod schema validation
- Wallet address format validation
- Signature format validation
- JSON payload validation
- Error response standardization

**Verification Criteria for Step 11:**
- [ ] Security headers are properly set
- [ ] Rate limiting prevents wallet-based abuse
- [ ] Input validation catches malicious input
- [ ] CORS works for wallet providers
- [ ] Signature replay attacks are prevented
- [ ] No security vulnerabilities detected

---

### STEP 12: Error Handling & Logging (Wallet-Contextualized)
**Objective**: Complete error handling and logging system with wallet context

#### 12.1 Error Handling Service
Implement comprehensive error handling:
- Wallet-specific error classes
- Error categorization
- Error response formatting
- Error recovery strategies
- Wallet notification system for errors

#### 12.2 Logging System (Wallet-Aware)
Complete logging implementation:
- Winston logger configuration
- Structured logging with wallet context
- Log levels and filtering
- Log rotation and archiving
- Wallet-specific error log aggregation

#### 12.3 Monitoring Integration
Monitoring and alerting:
- Health check endpoints
- Performance metrics collection
- Wallet authentication error monitoring
- Alert threshold configuration
- Dashboard integration

**Verification Criteria for Step 12:**
- [ ] All errors are properly caught and handled
- [ ] Error responses are user-friendly
- [ ] Logging captures wallet context in all events
- [ ] Monitoring detects wallet authentication issues
- [ ] Alerts trigger on critical errors
- [ ] Log analysis provides wallet usage insights

---

### STEP 13: Testing Suite (Wallet Authentication Focused)
**Objective**: Complete comprehensive testing with wallet authentication scenarios

#### 13.1 Unit Tests
Implement unit tests for:
- Wallet signature verification logic
- JWT token generation/validation
- Wallet-based authorization
- Authentication utility functions
- Error handling scenarios

#### 13.2 Integration Tests
Complete integration testing:
- Wallet authentication flow end-to-end
- API endpoint testing with wallet auth
- Database integration with wallet users
- Blockchain integration tests
- WebSocket authentication tests

#### 13.3 Wallet Authentication Tests
Specific wallet testing scenarios:
- Valid signature verification
- Invalid signature rejection
- Expired nonce handling
- JWT token expiration
- Multiple wallet authentication
- Wallet switching scenarios

**Verification Criteria for Step 13:**
- [ ] Unit test coverage > 90%
- [ ] All wallet authentication flows tested
- [ ] Integration tests pass with real wallet signatures
- [ ] Performance tests meet benchmarks
- [ ] Edge cases are properly tested
- [ ] Security scenarios are covered

---

### STEP 14: Production Deployment Setup (Wallet-Ready)
**Objective**: Complete production-ready deployment with wallet integration

#### 14.1 Docker Configuration
Complete containerization with wallet support:
- Multi-stage Docker build
- Production optimization
- Environment variable handling for wallet configs
- Health check configuration
- Security best practices for wallet operations

#### 14.2 Environment Management (Wallet-Focused)
Complete environment setup:
- Environment-specific configurations
- Wallet provider endpoint configurations
- Secret management for JWT signing keys
- SSL/TLS configuration for secure wallet connections
- Load balancer integration

#### 14.3 Monitoring & Observability (Wallet Metrics)
Production monitoring with wallet-specific metrics:
- Application performance monitoring
- Wallet authentication success/failure rates
- Database monitoring
- Infrastructure monitoring
- Log aggregation with wallet context
- Alert configuration for wallet issues

**Verification Criteria for Step 14:**
- [ ] Docker containers build and run correctly
- [ ] Production environment supports wallet connections
- [ ] Monitoring captures wallet authentication metrics
- [ ] Deployment process is automated
- [ ] Rollback procedures work
- [ ] System handles production wallet load
- [ ] SSL/TLS works with wallet providers

## Implementation Guidelines

### Wallet Authentication Best Practices

#### Security Considerations
- **Nonce Expiration**: Nonces must expire within 5 minutes to prevent replay attacks
- **Signature Verification**: Always verify signatures using cryptographically secure methods
- **JWT Security**: Use strong signing keys and appropriate expiration times
- **Rate Limiting**: Implement aggressive rate limiting for authentication endpoints
- **Error Messages**: Never leak information about why authentication failed

#### Frontend Integration Points
The backend must support these frontend wallet integration patterns:
```typescript
// Expected frontend flow integration points:

// 1. Wallet Connection Detection
GET /api/auth/wallet-info?address=<wallet-address>
// Returns: { exists: boolean, lastLogin?: timestamp }

// 2. Nonce Request
POST /api/auth/init
{ "walletAddress": "..." }
// Returns: { nonce, message, expiresAt }

// 3. Signature Verification
POST /api/auth/verify  
{ "walletAddress": "...", "signature": "...", "message": "..." }
// Returns: { accessToken, user, expiresIn }

// 4. Protected Route Access
GET /api/protected-endpoint
Headers: { "Authorization": "Bearer <jwt>" }
```

#### Wallet Provider Compatibility
Ensure compatibility with major Solana wallet providers:
- **Phantom Wallet** - Most popular Solana wallet
- **Solflare** - Web and mobile wallet
- **Backpack** - Popular among power users  
- **Glow Wallet** - Stake-focused wallet
- **Slope Wallet** - Mobile-first wallet

### After Each Step
1. **Run Tests**: Execute all tests for the implemented functionality
2. **Manual Verification**: Test wallet authentication flow manually
3. **Wallet Integration Test**: Test with actual wallet providers (Phantom/Solflare)
4. **Performance Check**: Verify response times and resource usage
5. **Security Audit**: Ensure no authentication vulnerabilities
6. **Code Review**: Ensure code quality and adherence to standards
7. **Documentation**: Update API documentation and wallet integration guides

### Error Handling Requirements (Wallet-Specific)
- Every wallet authentication function must handle all possible error scenarios
- Database connection failures during auth must be handled gracefully
- Blockchain RPC failures during signature verification must have retry logic
- Invalid wallet addresses must return helpful error messages
- Signature verification failures must be logged but not leak details
- JWT token validation errors must be handled consistently
- Unexpected authentication errors must be logged and reported

### Performance Requirements (Wallet-Optimized)
- Wallet authentication flow < 500ms end-to-end
- JWT token validation < 50ms
- API response times < 200ms for cached wallet data
- API response times < 1000ms for database queries
- WebSocket message delivery < 100ms
- Memory usage stable under concurrent wallet authentications
- Database connection pool efficiently managed during auth spikes

### Security Requirements (Wallet-Focused)
- All wallet addresses must be validated for correct format
- All signatures must be cryptographically verified
- JWT tokens must be properly secured with strong keys
- Rate limiting must prevent wallet-based authentication abuse
- Error messages must not leak sensitive authentication information
- All secrets (JWT keys, nonces) must be properly managed
- Signature replay attacks must be prevented
- Session management must be secure

## Wallet Authentication Flow Details

### Complete 7-Step Flow Implementation

#### Step 1: User Clicks 'Connect Wallet'
```typescript
// Frontend initiates wallet connection
const connectWallet = async () => {
  if (window.phantom?.solana) {
    const response = await window.phantom.solana.connect();
    return response.publicKey.toString();
  }
};
```

#### Step 2: Wallet Provider Prompts for Connection
```typescript
// Wallet provider (Phantom/Solflare) opens connection dialog
// User sees: "auction-platform.com wants to connect to your wallet"
// This is handled by the wallet provider, not our backend
```

#### Step 3: User Approves Connection
```typescript
// Wallet returns public key after user approval
// Frontend receives: { publicKey: PublicKey }
// Convert to string: publicKey.toString()
```

#### Step 4: Backend Generates Message to Sign
```typescript
// POST /api/auth/init
export const initializeWalletAuth = async (req: Request, res: Response) => {
  const { walletAddress } = req.body;
  
  // Generate unique nonce
  const nonce = generateSecureNonce();
  
  // Create standardized message
  const message = createSignMessage(walletAddress, nonce);
  
  // Store nonce in database with expiration
  await storeNonce(walletAddress, nonce, 5 * 60 * 1000); // 5 minutes
  
  res.json({
    nonce,
    message,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });
};
```

#### Step 5: User Signs Message with Wallet
```typescript
// Frontend requests signature from wallet
const signMessage = async (message: string) => {
  const encodedMessage = new TextEncoder().encode(message);
  const signedMessage = await window.phantom.solana.signMessage(encodedMessage);
  return {
    signature: bs58.encode(signedMessage.signature),
    publicKey: signedMessage.publicKey.toString()
  };
};
```

#### Step 6: Backend Verifies Signature → JWT Issued
```typescript
// POST /api/auth/verify
export const verifyWalletAuth = async (req: Request, res: Response) => {
  const { walletAddress, signature, message } = req.body;
  
  // Verify nonce is valid and not expired
  const nonce = await validateNonce(walletAddress, message);
  
  // Verify cryptographic signature
  const isValidSignature = verifyEd25519Signature(
    message, 
    signature, 
    walletAddress
  );
  
  if (!isValidSignature) {
    throw new AuthenticationError('Invalid signature');
  }
  
  // Create or update user
  const user = await findOrCreateUser(walletAddress);
  
  // Generate JWT token
  const accessToken = generateJWT({
    userId: user.id,
    walletAddress: user.walletAddress
  });
  
  // Mark nonce as used
  await markNonceAsUsed(nonce.id);
  
  res.json({
    accessToken,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    },
    expiresIn: 86400 // 24 hours
  });
};
```

#### Step 7: User is Authenticated
```typescript
// Middleware validates JWT on protected routes
export const authenticateWallet = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }
  
  try {
    const decoded = verifyJWT(token);
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};
```

### Database Schema Focus

The wallet-only authentication approach simplifies the user model significantly:

```prisma
model User {
  id                String    @id @default(cuid())
  walletAddress     String    @unique // This IS the user identity
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?
  
  // No email, username, password, or traditional auth fields needed
  // Wallet address serves as unique identifier
  
  nonces            AuthNonce[] // For signature verification
  bids              Bid[]
  supplies          Supply[]
  transactions      Transaction[]
  
  @@map("users")
  @@index([walletAddress]) // Primary lookup index
}
```

## Success Criteria

The implementation is considered complete when:
1. All 14 steps have been successfully implemented and tested with wallet authentication
2. Complete wallet authentication flow (7 steps) works end-to-end
3. Signature verification works with real Solana wallets (Phantom, Solflare)
4. Full test suite passes with >90% coverage including wallet auth scenarios
5. API documentation includes wallet integration examples
6. Performance benchmarks are met for wallet authentication flows
7. Security audit shows no wallet authentication vulnerabilities
8. Production deployment works with wallet providers
9. Monitoring and alerting captures wallet authentication metrics
10. Frontend integration examples are provided and tested

## Final Deliverables

Upon completion, provide:
1. Complete, working Express.js + TypeScript backend with wallet-only authentication
2. Full test suite with wallet authentication coverage reports
3. API documentation with wallet integration examples
4. Frontend integration code examples for major wallet providers
5. Wallet authentication flow diagrams and documentation
6. Deployment configuration files optimized for wallet operations
7. Performance benchmark results for wallet authentication flows
8. Security audit report focusing on wallet authentication security
9. Operations runbook including wallet-specific monitoring and troubleshooting
10. Developer guide for integrating additional wallet providers

## Wallet Provider Integration Examples

Provide complete integration examples for:

### Phantom Wallet Integration
```typescript
// Complete Phantom wallet integration example
const PhantomWalletAuth = {
  connect: async () => { /* implementation */ },
  signMessage: async (message: string) => { /* implementation */ },
  disconnect: async () => { /* implementation */ }
};
```

### Solflare Wallet Integration  
```typescript
// Complete Solflare wallet integration example
const SolflareWalletAuth = {
  connect: async () => { /* implementation */ },
  signMessage: async (message: string) => { /* implementation */ },
  disconnect: async () => { /* implementation */ }
};
```

### Universal Wallet Adapter Integration
```typescript
// Integration with Solana wallet adapter for multiple wallet support
const UniversalWalletAuth = {
  detectWallets: () => { /* implementation */ },
  connectWallet: async (walletName: string) => { /* implementation */ },
  signMessage: async (message: string) => { /* implementation */ }
};
```

Remember: **NO SHORTCUTS, NO PLACEHOLDERS, NO TODO COMMENTS**. Every piece of code must be production-ready, fully functional, and focused on wallet-only authentication. The system should work seamlessly with real Solana wallets and provide a secure, user-friendly authentication experience.