# Energy Auction Platform - Development Guide

## Overview

This guide provides comprehensive information for developers working on the Energy Auction Platform backend. It covers development setup, coding standards, testing procedures, and contribution guidelines.

## Development Environment Setup

### Prerequisites

- **Bun**: v1.0+ (Primary runtime)
- **Node.js**: v18.0+ (Fallback runtime)
- **Docker**: v20.0+ (For services)
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions

### Required VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode-remote.remote-containers",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd auction_backend
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Setup Environment**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your local configuration
   ```

4. **Start Development Services**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Initialize Database**
   ```bash
   bun run prisma:generate
   bun run prisma:migrate:dev
   bun run prisma:seed
   ```

6. **Start Development Server**
   ```bash
   bun run dev
   ```

## Project Structure

```
auction_backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.ts        # Database configuration
│   │   ├── environment.ts     # Environment validation
│   │   └── security.ts        # Security configuration
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── bid.controller.ts
│   │   ├── blockchain.controller.ts
│   │   ├── supply.controller.ts
│   │   ├── timeslot.controller.ts
│   │   └── user.controller.ts
│   ├── services/              # Business logic
│   │   ├── blockchain.service.ts
│   │   ├── blockchain-transaction.service.ts
│   │   ├── wallet-auth.service.ts
│   │   ├── bid.service.ts
│   │   ├── supply.service.ts
│   │   └── timeslot.service.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── wallet-auth.middleware.ts
│   │   └── admin-auth.middleware.ts
│   ├── routes/               # API route definitions
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── bid.routes.ts
│   │   ├── blockchain.routes.ts
│   │   ├── supply.routes.ts
│   │   ├── timeslot.routes.ts
│   │   ├── user.routes.ts
│   │   └── websocket.routes.ts
│   ├── types/                # TypeScript type definitions
│   │   ├── auth.types.ts
│   │   ├── blockchain.types.ts
│   │   ├── wallet-auth.types.ts
│   │   └── websocket.types.ts
│   ├── utils/                # Utility functions
│   │   ├── blockchain.utils.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── validation.ts
│   ├── websocket/            # WebSocket services
│   │   ├── socket.service.ts
│   │   └── rooms.service.ts
│   └── database/             # Database utilities
│       └── prisma.service.ts
├── prisma/                   # Database schema and migrations
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── tests/                    # Test files
│   ├── unit/
│   ├── integration/
│   └── setup.ts
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
└── docker-compose.yml        # Development containers
```

## Development Workflow

### Branch Strategy

We use Git Flow branching strategy:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `hotfix/*` - Critical bug fixes
- `release/*` - Release preparation branches

### Feature Development Process

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Develop Feature**
   - Write code following coding standards
   - Add comprehensive tests
   - Update documentation
   - Ensure all tests pass

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request to develop branch
   ```

### Commit Message Convention

Follow Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```bash
feat(auth): add wallet signature verification
fix(blockchain): handle connection timeout errors
docs(api): update authentication flow documentation
test(bid): add integration tests for bid placement
```

## Coding Standards

### TypeScript Guidelines

1. **Strict Type Checking**
   ```typescript
   // Good
   interface User {
     id: string;
     walletAddress: string;
     createdAt: Date;
   }
   
   function getUser(id: string): Promise<User | null> {
     // Implementation
   }
   
   // Avoid
   function getUser(id: any): any {
     // Implementation
   }
   ```

2. **Error Handling**
   ```typescript
   // Good
   import { AppError, ValidationError } from '@/utils/errors';
   
   async function placeBid(data: BidData): Promise<Bid> {
     try {
       validateBidData(data);
       return await bidService.create(data);
     } catch (error) {
       if (error instanceof ValidationError) {
         throw error;
       }
       throw new AppError('Failed to place bid', 500);
     }
   }
   
   // Avoid
   async function placeBid(data: any) {
     try {
       return await bidService.create(data);
     } catch (error) {
       console.log(error);
       return null;
     }
   }
   ```

3. **Async/Await Usage**
   ```typescript
   // Good
   async function processTransaction(): Promise<void> {
     const user = await userService.getById(userId);
     const balance = await blockchainService.getBalance(user.walletAddress);
     
     if (balance < requiredAmount) {
       throw new ValidationError('Insufficient balance');
     }
     
     await transactionService.process(user, requiredAmount);
   }
   
   // Avoid
   function processTransaction() {
     return userService.getById(userId)
       .then(user => blockchainService.getBalance(user.walletAddress))
       .then(balance => {
         if (balance < requiredAmount) {
           throw new Error('Insufficient balance');
         }
         return transactionService.process(user, requiredAmount);
       });
   }
   ```

### API Design Principles

1. **RESTful Endpoints**
   ```typescript
   // Good
   GET    /api/bids           # List bids
   POST   /api/bids           # Create bid
   GET    /api/bids/:id       # Get specific bid
   PUT    /api/bids/:id       # Update bid
   DELETE /api/bids/:id       # Delete bid
   
   // Avoid
   POST   /api/getBids
   POST   /api/createBid
   POST   /api/updateBid/:id
   ```

2. **Consistent Response Format**
   ```typescript
   // Success Response
   {
     "success": true,
     "data": {
       "id": "bid-123",
       "price": 0.05,
       "quantity": 100
     }
   }
   
   // Error Response
   {
     "success": false,
     "error": {
       "message": "Validation failed",
       "code": "VALIDATION_ERROR",
       "details": {
         "price": "Price must be positive"
       }
     }
   }
   ```

3. **Input Validation**
   ```typescript
   import { z } from 'zod';
   
   const bidSchema = z.object({
     timeslotId: z.string().uuid(),
     price: z.number().positive().max(1000),
     quantity: z.number().positive().max(1000000)
   });
   
   export const placeBid = asyncHandler(async (req: Request, res: Response) => {
     const validatedData = bidSchema.parse(req.body);
     // Process validated data
   });
   ```

### Database Guidelines

1. **Prisma Best Practices**
   ```typescript
   // Good - Use transactions for related operations
   async function placeBidWithEscrow(bidData: BidData): Promise<Bid> {
     return await prisma.$transaction(async (tx) => {
       const bid = await tx.bid.create({
         data: bidData
       });
       
       await tx.transaction.create({
         data: {
           userId: bidData.userId,
           type: 'BID_PLACED',
           amount: bidData.price * bidData.quantity,
           txSignature: bidData.txSignature
         }
       });
       
       return bid;
     });
   }
   
   // Good - Use proper error handling
   async function getUserBids(userId: string): Promise<Bid[]> {
     try {
       return await prisma.bid.findMany({
         where: { userId },
         include: {
           timeslot: true,
           user: {
             select: {
               id: true,
               walletAddress: true
             }
           }
         },
         orderBy: { createdAt: 'desc' }
       });
     } catch (error) {
       logger.error('Failed to get user bids:', error);
       throw new AppError('Failed to retrieve bids', 500);
     }
   }
   ```

2. **Migration Guidelines**
   ```sql
   -- Good - Always use transactions for complex migrations
   BEGIN;
   
   -- Add new column with default value
   ALTER TABLE bids ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';
   
   -- Update existing records
   UPDATE bids SET status = 'CONFIRMED' WHERE tx_signature IS NOT NULL;
   
   -- Add constraints after data migration
   ALTER TABLE bids ALTER COLUMN status SET NOT NULL;
   
   COMMIT;
   ```

## Testing

### Test Structure

```
tests/
├── unit/                     # Unit tests
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── bid.service.test.ts
│   │   └── blockchain.service.test.ts
│   ├── controllers/
│   │   ├── auth.controller.test.ts
│   │   └── bid.controller.test.ts
│   └── utils/
│       └── validation.test.ts
├── integration/              # Integration tests
│   ├── auth.integration.test.ts
│   ├── bid.integration.test.ts
│   └── websocket.integration.test.ts
└── setup.ts                 # Test setup and teardown
```

### Writing Tests

1. **Unit Tests**
   ```typescript
   import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
   import { bidService } from '@/services/bid.service';
   import { prisma } from '@/database/prisma.service';
   
   describe('BidService', () => {
     beforeEach(async () => {
       // Setup test data
       await prisma.user.create({
         data: {
           id: 'test-user-1',
           walletAddress: 'test-wallet-address'
         }
       });
     });
   
     afterEach(async () => {
       // Cleanup
       await prisma.bid.deleteMany();
       await prisma.user.deleteMany();
     });
   
     it('should create a new bid', async () => {
       const bidData = {
         userId: 'test-user-1',
         timeslotId: 'test-timeslot-1',
         price: 0.05,
         quantity: 100
       };
   
       const bid = await bidService.create(bidData);
   
       expect(bid).toBeDefined();
       expect(bid.price).toBe(0.05);
       expect(bid.quantity).toBe(100);
       expect(bid.status).toBe('PENDING');
     });
   
     it('should throw error for invalid bid data', async () => {
       const invalidBidData = {
         userId: 'test-user-1',
         timeslotId: 'test-timeslot-1',
         price: -1, // Invalid negative price
         quantity: 100
       };
   
       await expect(bidService.create(invalidBidData))
         .rejects
         .toThrow('Price must be positive');
     });
   });
   ```

2. **Integration Tests**
   ```typescript
   import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
   import request from 'supertest';
   import { app } from '@/app';
   import { prisma } from '@/database/prisma.service';
   
   describe('Bid API', () => {
     let authToken: string;
     let userId: string;
   
     beforeAll(async () => {
       // Setup test user and get auth token
       const user = await prisma.user.create({
         data: {
           walletAddress: 'test-wallet-address'
         }
       });
       userId = user.id;
   
       // Mock authentication for testing
       authToken = 'test-jwt-token';
     });
   
     afterAll(async () => {
       // Cleanup
       await prisma.bid.deleteMany();
       await prisma.user.deleteMany();
     });
   
     it('POST /api/bids should create a new bid', async () => {
       const bidData = {
         timeslotId: 'test-timeslot-1',
         price: 0.05,
         quantity: 100
       };
   
       const response = await request(app)
         .post('/api/bids')
         .set('Authorization', `Bearer ${authToken}`)
         .send(bidData)
         .expect(201);
   
       expect(response.body.success).toBe(true);
       expect(response.body.data.price).toBe(0.05);
     });
   
     it('GET /api/my/bids should return user bids', async () => {
       // Create test bid first
       await prisma.bid.create({
         data: {
           userId,
           timeslotId: 'test-timeslot-1',
           price: 0.05,
           quantity: 100
         }
       });
   
       const response = await request(app)
         .get('/api/my/bids')
         .set('Authorization', `Bearer ${authToken}`)
         .expect(200);
   
       expect(response.body.success).toBe(true);
       expect(response.body.data).toHaveLength(1);
     });
   });
   ```

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun test tests/unit/services/bid.service.test.ts

# Run integration tests only
bun test tests/integration/

# Run tests with verbose output
bun test --verbose
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage required
- **New Features**: 90% coverage required

## Debugging

### Development Debugging

1. **VS Code Debugging**
   
   Create `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug Server",
         "type": "node",
         "request": "launch",
         "program": "${workspaceFolder}/src/app.ts",
         "outFiles": ["${workspaceFolder}/dist/**/*.js"],
         "env": {
           "NODE_ENV": "development",
           "LOG_LEVEL": "debug"
         },
         "runtimeExecutable": "bun",
         "runtimeArgs": ["--inspect-brk"],
         "console": "integratedTerminal",
         "skipFiles": ["<node_internals>/**"]
       }
     ]
   }
   ```

2. **Console Debugging**
   ```bash
   # Start with debug logging
   LOG_LEVEL=debug bun run dev
   
   # Use Node.js inspector
   node --inspect-brk dist/app.js
   ```

3. **Database Debugging**
   ```bash
   # Enable Prisma query logging
   DEBUG=prisma:query bun run dev
   
   # Use Prisma Studio
   bun run prisma:studio
   ```

### Production Debugging

```bash
# Check application logs
docker-compose logs -f app

# Check specific service logs
docker-compose logs postgres
docker-compose logs redis

# Monitor system resources
docker stats

# Access container shell
docker-compose exec app sh
```

## Performance Optimization

### Database Optimization

1. **Query Optimization**
   ```typescript
   // Good - Use select to limit fields
   const users = await prisma.user.findMany({
     select: {
       id: true,
       walletAddress: true,
       createdAt: true
     },
     where: {
       createdAt: {
         gte: new Date('2024-01-01')
       }
     }
   });
   
   // Good - Use proper indexing
   const bids = await prisma.bid.findMany({
     where: {
       userId: userId, // Indexed field
       status: 'PENDING' // Indexed field
     },
     orderBy: {
       createdAt: 'desc' // Consider composite index
     }
   });
   ```

2. **Connection Pooling**
   ```typescript
   // Configure in prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   // Connection pool settings in DATABASE_URL
   // postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20
   ```

### Caching Strategy

```typescript
import { Redis } from 'ioredis';

class CacheService {
  private redis = new Redis(process.env.REDIS_URL);
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in service
async function getTimeslots(): Promise<Timeslot[]> {
  const cacheKey = 'timeslots:active';
  
  let timeslots = await cacheService.get<Timeslot[]>(cacheKey);
  
  if (!timeslots) {
    timeslots = await prisma.timeslot.findMany({
      where: { status: 'OPEN' }
    });
    
    await cacheService.set(cacheKey, timeslots, 300); // 5 minutes
  }
  
  return timeslots;
}
```

## Security Guidelines

### Input Validation

```typescript
import { z } from 'zod';

// Define schemas for all inputs
const createBidSchema = z.object({
  timeslotId: z.string().uuid(),
  price: z.number().positive().max(1000),
  quantity: z.number().int().positive().max(1000000)
});

// Validate in controllers
export const createBid = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createBidSchema.parse(req.body);
  // Process validated data
});
```

### Authentication Security

```typescript
// Secure JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET, // Minimum 64 characters
  expiresIn: '24h',
  algorithm: 'HS256' as const,
  issuer: 'energy-auction-api',
  audience: 'energy-auction-client'
};

// Rate limiting
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false
});
```

### Data Protection

```typescript
// Sanitize sensitive data in logs
function sanitizeForLogging(data: any): any {
  const sanitized = { ...data };
  
  // Remove sensitive fields
  delete sanitized.privateKey;
  delete sanitized.signature;
  delete sanitized.password;
  
  // Truncate wallet addresses
  if (sanitized.walletAddress) {
    sanitized.walletAddress = sanitized.walletAddress.substring(0, 8) + '...';
  }
  
  return sanitized;
}

// Use in logging
logger.info('User authenticated', sanitizeForLogging(userData));
```

## Documentation

### Code Documentation

```typescript
/**
 * Places a new bid in the auction system
 * 
 * @param bidData - The bid information
 * @param bidData.userId - ID of the user placing the bid
 * @param bidData.timeslotId - ID of the target timeslot
 * @param bidData.price - Bid price per unit (SOL)
 * @param bidData.quantity - Quantity of energy (kWh)
 * 
 * @returns Promise resolving to the created bid
 * 
 * @throws {ValidationError} When bid data is invalid
 * @throws {InsufficientBalanceError} When user has insufficient balance
 * @throws {TimeslotExpiredError} When timeslot is no longer accepting bids
 * 
 * @example
 * ```typescript
 * const bid = await bidService.create({
 *   userId: 'user-123',
 *   timeslotId: 'timeslot-456',
 *   price: 0.05,
 *   quantity: 100
 * });
 * ```
 */
async function create(bidData: CreateBidData): Promise<Bid> {
  // Implementation
}
```

### API Documentation

Update API documentation when adding new endpoints:

1. Add endpoint to `API.md`
2. Include request/response examples
3. Document error cases
4. Add integration examples

## Contributing Guidelines

### Pull Request Process

1. **Before Creating PR**
   - Ensure all tests pass
   - Run linting and formatting
   - Update documentation
   - Add changelog entry

2. **PR Requirements**
   - Descriptive title and description
   - Link to related issues
   - Screenshots for UI changes
   - Test coverage report

3. **Code Review Checklist**
   - [ ] Code follows style guidelines
   - [ ] Tests are comprehensive
   - [ ] Documentation is updated
   - [ ] No security vulnerabilities
   - [ ] Performance impact considered

### Release Process

1. **Create Release Branch**
   ```bash
   git checkout develop
   git checkout -b release/v1.2.0
   ```

2. **Prepare Release**
   - Update version in `package.json`
   - Update `CHANGELOG.md`
   - Run full test suite
   - Update documentation

3. **Merge and Tag**
   ```bash
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   git push origin main --tags
   ```

---

This development guide provides the foundation for maintaining high code quality and consistent development practices. Follow these guidelines to ensure the codebase remains maintainable, secure, and performant.
