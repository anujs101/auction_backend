# Energy Auction Platform - Postman Collection

This directory contains comprehensive Postman testing resources for the Energy Auction Platform API.

## Files Overview

### Collection File
- **`Energy-Auction-Platform-API.postman_collection.json`** - Main collection with all API endpoints

### Environment Files
- **`development.postman_environment.json`** - Development environment (localhost:3000)
- **`staging.postman_environment.json`** - Staging environment configuration
- **`production.postman_environment.json`** - Production environment configuration

## Quick Setup

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Energy-Auction-Platform-API.postman_collection.json`
4. Collection will appear in your workspace

### 2. Import Environment
1. Click **Import** button again
2. Select the appropriate environment file:
   - `development.postman_environment.json` for local testing
   - `staging.postman_environment.json` for staging tests
   - `production.postman_environment.json` for production tests
3. Select the imported environment from the dropdown

### 3. Configure Environment Variables
Update these key variables in your selected environment:

**Required:**
- `walletAddress` - Your test wallet address
- `walletSignature` - Will be set after signing authentication message

**Auto-populated:**
- `authToken` - JWT token (set after authentication)
- `testTimeslotId` - Test timeslot ID (set from API responses)
- `testBidId` - Test bid ID (set from API responses)
- `testSupplyId` - Test supply ID (set from API responses)

## Authentication Flow

### Step 1: Initialize Authentication
Run **"Initialize Authentication"** request:
- Sends your wallet address
- Receives nonce and message to sign
- Auto-populates `authNonce` and `authMessage` variables

### Step 2: Sign Message
1. Copy the `authMessage` from environment variables
2. Sign it with your wallet (using Phantom, Solflare, etc.)
3. Update `walletSignature` environment variable with the signature

### Step 3: Complete Authentication
Run **"Wallet Authentication"** request:
- Verifies your signature
- Returns JWT token
- Auto-populates `authToken` for subsequent requests

## Collection Structure

### 🔐 Authentication
- Initialize Authentication
- Wallet Authentication
- Get User Profile

### ⏰ Timeslot Management
- List Timeslots
- Get Timeslot Details

### 💰 Bid Management
- Place Bid
- Get User Bid History

### ⚡ Supply Management
- Commit Supply
- Get User Supplies

### 🔧 System & Health
- Health Check
- Blockchain Health

## Testing Workflow

### Happy Path Testing
1. **Authentication Flow**
   ```
   Initialize Authentication → Sign Message → Wallet Authentication
   ```

2. **Data Retrieval**
   ```
   List Timeslots → Get Timeslot Details
   ```

3. **Bid Placement**
   ```
   Place Bid → Get User Bid History
   ```

4. **Supply Commitment**
   ```
   Commit Supply → Get User Supplies
   ```

### Automated Testing Features

**Pre-request Scripts:**
- Authentication validation
- Dynamic test data generation
- Dependency checking

**Test Scripts:**
- Response validation
- Status code verification
- Data structure validation
- Auto-population of test IDs

## Environment-Specific Configuration

### Development Environment
```json
{
  "baseUrl": "http://localhost:3000/api",
  "websocketUrl": "ws://localhost:3000"
}
```

### Staging Environment
```json
{
  "baseUrl": "https://staging-api.energy-auction.com/api",
  "websocketUrl": "wss://staging-api.energy-auction.com"
}
```

### Production Environment
```json
{
  "baseUrl": "https://api.energy-auction.com/api",
  "websocketUrl": "wss://api.energy-auction.com"
}
```

## Test Data Examples

### Sample Wallet Addresses (Development)
```
Devnet Test Wallet: 11111111111111111111111111111112
Mainnet Test Wallet: (Use your actual wallet address)
```

### Sample Request Bodies

**Place Bid:**
```json
{
  "timeslotId": "{{testTimeslotId}}",
  "price": "0.15",
  "quantity": "100",
  "txSignature": "test-signature"
}
```

**Commit Supply:**
```json
{
  "timeslotId": "{{testTimeslotId}}",
  "price": "0.12",
  "quantity": "200",
  "txSignature": "test-supply-signature"
}
```

## Error Testing

The collection includes comprehensive error handling tests:

### Authentication Errors
- Invalid wallet address
- Invalid signature
- Expired nonce
- Missing authentication token

### Validation Errors
- Invalid price values
- Invalid quantity values
- Missing required fields
- Malformed request bodies

### Business Logic Errors
- Bidding on closed timeslots
- Insufficient balance
- Duplicate transactions

## Advanced Features

### Dynamic Variables
- `{{$timestamp}}` - Current timestamp
- `{{$randomInt}}` - Random integer
- Auto-generated test data for prices and quantities

### Response Validation
- Status code verification
- Response structure validation
- Business rule validation
- Performance monitoring (response time < 5s)

### Cross-Request Dependencies
- Automatic ID extraction from responses
- Environment variable population
- Request chaining support

## Troubleshooting

### Common Issues

**Authentication Fails:**
1. Verify wallet address is correct
2. Ensure message is signed exactly as provided
3. Check signature format (base58 encoded)
4. Verify nonce hasn't expired

**Request Fails with 401:**
1. Run authentication flow first
2. Check `authToken` is populated
3. Verify token hasn't expired

**Test Timeslot Not Found:**
1. Run "List Timeslots" first
2. Ensure timeslots exist in database
3. Check `testTimeslotId` is populated

### Debug Tips

1. **Check Environment Variables:**
   - Click environment name in top-right
   - Verify all required variables are set

2. **View Test Results:**
   - Check "Test Results" tab after each request
   - Review failed assertions

3. **Inspect Responses:**
   - Check "Response" tab for error details
   - Verify response structure matches expectations

## Performance Testing

### Response Time Expectations
- Authentication: < 1000ms
- Data retrieval: < 500ms
- Data creation: < 1000ms
- Health checks: < 200ms

### Load Testing Preparation
The collection is designed to support load testing:
- Parameterized requests
- Dynamic test data
- Automated cleanup
- Performance assertions

## Integration with CI/CD

### Newman CLI Usage
```bash
# Install Newman
npm install -g newman

# Run collection with development environment
newman run Energy-Auction-Platform-API.postman_collection.json \
  -e development.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json

# Run with custom environment variables
newman run Energy-Auction-Platform-API.postman_collection.json \
  -e development.postman_environment.json \
  --env-var "walletAddress=YOUR_WALLET_ADDRESS" \
  --env-var "walletSignature=YOUR_SIGNATURE"
```

### GitHub Actions Integration
```yaml
- name: Run API Tests
  run: |
    newman run postman/Energy-Auction-Platform-API.postman_collection.json \
      -e postman/development.postman_environment.json \
      --env-var "walletAddress=${{ secrets.TEST_WALLET_ADDRESS }}" \
      --env-var "walletSignature=${{ secrets.TEST_WALLET_SIGNATURE }}" \
      --reporters cli,junit \
      --reporter-junit-export test-results.xml
```

## Support

For issues with the Postman collection:
1. Check this README for troubleshooting steps
2. Verify API documentation in `API.md`
3. Review server logs for detailed error information
4. Ensure all environment variables are correctly configured

---

**Collection Version:** 1.0.0  
**Last Updated:** January 2025  
**Compatible with:** Postman v10.0+, Newman v5.0+
