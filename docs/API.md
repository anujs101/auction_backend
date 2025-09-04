# Energy Auction Platform - API Reference

## Overview

Complete API reference for the Energy Auction Platform backend. This document provides detailed information about all available endpoints, request/response formats, authentication requirements, and integration examples.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

### Wallet-Based Authentication Flow

The platform uses Ed25519 signature-based authentication with JWT tokens:

1. **Initialize Authentication** - Get nonce and message to sign
2. **Verify Signature** - Submit signed message to receive JWT token
3. **Use JWT Token** - Include token in Authorization header for protected endpoints

### Authentication Endpoints

#### Initialize Authentication
```http
POST /api/auth/init
Content-Type: application/json

{
  "walletAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "auth-nonce-12345",
    "message": "Sign this message to authenticate: auth-nonce-12345",
    "expiresAt": "2024-01-01T12:05:00.000Z"
  }
}
```

#### Verify Signature
```http
POST /api/auth/verify
Content-Type: application/json

{
  "walletAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "signature": "base58-encoded-signature",
  "message": "Sign this message to authenticate: auth-nonce-12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": "user-id-12345",
      "walletAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "lastLoginAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt-token>
```

#### Validate Token
```http
GET /api/auth/validate
Authorization: Bearer <jwt-token>
```

## Core API Endpoints

### Timeslot Management

#### List All Timeslots
```http
GET /api/timeslots
```

**Query Parameters:**
- `status` (optional): Filter by status (`OPEN`, `SEALED`, `SETTLED`)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

#### Get Specific Timeslot
```http
GET /api/timeslots/:id
```

#### Get Active Timeslots
```http
GET /api/timeslots/active
```

#### Get Timeslot Bids
```http
GET /api/timeslots/:id/bids
```

#### Get Timeslot Supplies
```http
GET /api/timeslots/:id/supplies
```

### Bid Management

#### Place New Bid
```http
POST /api/bids
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "timeslotId": "timeslot-12345",
  "price": 0.05,
  "quantity": 100
}
```

#### Get Specific Bid
```http
GET /api/bids/:id
Authorization: Bearer <jwt-token>
```

#### Update Bid
```http
PUT /api/bids/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "price": 0.06,
  "quantity": 150
}
```

#### Cancel Bid
```http
DELETE /api/bids/:id
Authorization: Bearer <jwt-token>
```

#### Get User's Bids
```http
GET /api/my/bids
Authorization: Bearer <jwt-token>
```

### Supply Management

#### Commit Energy Supply
```http
POST /api/supplies
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "timeslotId": "timeslot-12345",
  "quantity": 500,
  "reservePrice": 0.03
}
```

#### Get Specific Supply
```http
GET /api/supplies/:id
Authorization: Bearer <jwt-token>
```

#### Update Supply
```http
PUT /api/supplies/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "quantity": 600,
  "reservePrice": 0.035
}
```

#### Cancel Supply
```http
DELETE /api/supplies/:id
Authorization: Bearer <jwt-token>
```

#### Get User's Supplies
```http
GET /api/my/supplies
Authorization: Bearer <jwt-token>
```

### Blockchain Integration

#### Check Blockchain Health
```http
GET /api/blockchain/health
```

#### Get Global Auction State
```http
GET /api/blockchain/global-state
```

#### Get Timeslot by Epoch
```http
GET /api/blockchain/timeslot/:epoch
```

#### Get Active Timeslots from Blockchain
```http
GET /api/blockchain/active-timeslots
```

#### Get Wallet Balance
```http
GET /api/blockchain/balance/:address
```

#### Get User's Blockchain Bids
```http
GET /api/blockchain/my/bids
Authorization: Bearer <jwt-token>
```

#### Get User's Blockchain Supplies
```http
GET /api/blockchain/my/supplies
Authorization: Bearer <jwt-token>
```

## WebSocket API

### Connection

Connect to WebSocket for real-time updates:

```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token',
    walletAddress: 'your-wallet-address'
  }
});
```

### Events

#### Incoming Events
- `bid_update` - Bid status changes
- `supply_update` - Supply status changes  
- `timeslot_update` - Timeslot status changes
- `user_notification` - User-specific notifications
- `room_joined` - Successfully joined room
- `room_left` - Successfully left room

#### Outgoing Events
- `join_room` - Join a specific room
- `leave_room` - Leave a room
- `join_timeslot` - Join timeslot-specific room
- `ping` - Connection health check

### Example Usage

```javascript
// Listen for bid updates
socket.on('bid_update', (data) => {
  console.log('Bid update:', data);
});

// Join timeslot room
socket.emit('join_timeslot', 'timeslot-12345');

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});
```

## Error Handling

### Standard Error Response

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Descriptive error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - JWT token required
- `INVALID_SIGNATURE` - Wallet signature verification failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Input validation failed
- `BLOCKCHAIN_ERROR` - Blockchain interaction failed
- `INSUFFICIENT_BALANCE` - Insufficient wallet balance
- `TIMESLOT_EXPIRED` - Auction timeslot has expired
- `BID_NOT_FOUND` - Bid does not exist
- `SUPPLY_NOT_FOUND` - Supply does not exist
- `UNAUTHORIZED_ACCESS` - Access to resource denied

## Rate Limiting

### Limits by Endpoint Type

- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **Bid Operations**: 10 requests per 5 minutes
- **Supply Operations**: 10 requests per 5 minutes

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Data Models

### User Model
```typescript
interface User {
  id: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}
```

### Timeslot Model
```typescript
interface Timeslot {
  id: string;
  startTime: string;
  endTime: string;
  status: 'OPEN' | 'SEALED' | 'SETTLED';
  clearingPrice: number | null;
  totalEnergy: number;
  createdAt: string;
  updatedAt: string;
}
```

### Bid Model
```typescript
interface Bid {
  id: string;
  userId: string;
  timeslotId: string;
  price: number;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'MATCHED' | 'CANCELLED' | 'EXPIRED';
  txSignature: string | null;
  escrowAccount: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Supply Model
```typescript
interface Supply {
  id: string;
  userId: string;
  timeslotId: string;
  quantity: number;
  reservePrice: number;
  status: 'COMMITTED' | 'CONFIRMED' | 'ALLOCATED' | 'DELIVERED' | 'CANCELLED';
  txSignature: string | null;
  escrowAccount: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Integration Examples

### JavaScript/TypeScript Client

```typescript
class EnergyAuctionAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async authenticate(walletAddress: string, signMessage: (message: string) => Promise<string>) {
    // Initialize authentication
    const initResponse = await fetch(`${this.baseURL}/auth/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    
    const { data } = await initResponse.json();
    
    // Sign message
    const signature = await signMessage(data.message);
    
    // Verify signature
    const verifyResponse = await fetch(`${this.baseURL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        signature,
        message: data.message
      })
    });
    
    const { data: authData } = await verifyResponse.json();
    this.token = authData.accessToken;
    
    return authData;
  }

  async placeBid(timeslotId: string, price: number, quantity: number) {
    const response = await fetch(`${this.baseURL}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ timeslotId, price, quantity })
    });
    
    return response.json();
  }

  async getMyBids() {
    const response = await fetch(`${this.baseURL}/my/bids`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    return response.json();
  }
}
```

### Python Client

```python
import requests
import json

class EnergyAuctionAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
    
    def authenticate(self, wallet_address, sign_function):
        # Initialize authentication
        init_response = requests.post(
            f"{self.base_url}/auth/init",
            json={"walletAddress": wallet_address}
        )
        init_data = init_response.json()["data"]
        
        # Sign message (implement with your wallet)
        signature = sign_function(init_data["message"])
        
        # Verify signature
        verify_response = requests.post(
            f"{self.base_url}/auth/verify",
            json={
                "walletAddress": wallet_address,
                "signature": signature,
                "message": init_data["message"]
            }
        )
        
        auth_data = verify_response.json()["data"]
        self.token = auth_data["accessToken"]
        
        return auth_data
    
    def place_bid(self, timeslot_id, price, quantity):
        response = requests.post(
            f"{self.base_url}/bids",
            json={
                "timeslotId": timeslot_id,
                "price": price,
                "quantity": quantity
            },
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        return response.json()
    
    def get_my_bids(self):
        response = requests.get(
            f"{self.base_url}/my/bids",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        return response.json()
```

## Testing

### Health Check
```bash
curl -X GET http://localhost:3000/api/health
```

### Authentication Test
```bash
# Initialize auth
curl -X POST http://localhost:3000/api/auth/init \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"}'

# Verify signature (replace with actual signature)
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress":"9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    "signature":"base58-signature",
    "message":"Sign this message to authenticate: auth-nonce-12345"
  }'
```

### Protected Endpoint Test
```bash
curl -X GET http://localhost:3000/api/my/bids \
  -H "Authorization: Bearer your-jwt-token"
```

---

This API reference provides complete documentation for integrating with the Energy Auction Platform backend. For additional support or questions, refer to the main README.md or contact the development team.
