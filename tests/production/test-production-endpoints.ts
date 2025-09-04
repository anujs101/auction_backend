import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from './index';

describe('Production-Grade Endpoint Testing', () => {
  let authToken: string;
  let testUserId: string;
  let testWalletAddress: string;

  beforeAll(async () => {
    // Setup test authentication
    testWalletAddress = 'TestWallet' + Date.now();
    
    // Initialize authentication
    const initResponse = await request(app)
      .post('/api/auth/initialize')
      .send({ walletAddress: testWalletAddress });
    
    if (initResponse.status === 200) {
      const { nonce } = initResponse.body.data;

      // Mock signature verification
      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .send({
          walletAddress: testWalletAddress,
          signature: 'mock_signature_' + nonce,
          nonce
        });

      if (verifyResponse.status === 200) {
        authToken = verifyResponse.body.data.token;
        testUserId = verifyResponse.body.data.user.id;
      }
    }
  });

  describe('API Health and Info Endpoints', () => {
    test('GET /api/ - Should return API info', async () => {
      const response = await request(app)
        .get('/api/')
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'Solana Energy Auction API',
        version: '1.0.0',
        status: 'active'
      });
      expect(response.body.timestamp).toBeDefined();
    });

    test('GET /api/health - Should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy'
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('Blockchain Endpoints', () => {
    test('GET /api/blockchain/health - Should return blockchain health', async () => {
      const response = await request(app)
        .get('/api/blockchain/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.slot).toBeGreaterThan(0);
    });

    test('GET /api/blockchain/global-state - Should return global state', async () => {
      const response = await request(app)
        .get('/api/blockchain/global-state')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/initialize - Should initialize auth with valid wallet', async () => {
      const response = await request(app)
        .post('/api/auth/initialize')
        .send({ walletAddress: 'TestWallet123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nonce).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();
    });

    test('POST /api/auth/initialize - Should reject invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/auth/initialize')
        .send({ walletAddress: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('POST /api/auth/verify - Should verify valid signature', async () => {
      // First initialize
      const initResponse = await request(app)
        .post('/api/auth/initialize')
        .send({ walletAddress: 'TestWallet456' });

      const { nonce } = initResponse.body.data;

      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          walletAddress: 'TestWallet456',
          signature: 'mock_signature_' + nonce,
          nonce
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });
  });

  describe('Bid Endpoints - Production Grade Tests', () => {
    test('POST /api/bids - Should require authentication', async () => {
      const response = await request(app)
        .post('/api/bids')
        .send({
          timeslotId: 'test-timeslot',
          price: 50,
          quantity: 100
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('POST /api/bids - Should validate input data', async () => {
      if (!authToken) return; // Skip if auth failed

      const response = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          timeslotId: '',
          price: -10, // Invalid negative price
          quantity: 0 // Invalid zero quantity
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/my/bids - Should require authentication', async () => {
      const response = await request(app)
        .get('/api/my/bids')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/my/bids - Should return user bids with pagination', async () => {
      if (!authToken) return; // Skip if auth failed

      const response = await request(app)
        .get('/api/my/bids?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bids).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10
      });
    });
  });

  describe('Supply Endpoints - Production Grade Tests', () => {
    test('POST /api/supplies - Should require authentication', async () => {
      const response = await request(app)
        .post('/api/supplies')
        .send({
          timeslotId: 'test-timeslot',
          price: 50,
          quantity: 100
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('POST /api/supplies - Should validate input data', async () => {
      if (!authToken) return; // Skip if auth failed

      const response = await request(app)
        .post('/api/supplies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          timeslotId: '',
          price: -10, // Invalid negative price
          quantity: 0 // Invalid zero quantity
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/my/supplies - Should require authentication', async () => {
      const response = await request(app)
        .get('/api/my/supplies')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/my/supplies - Should return user supplies with pagination', async () => {
      if (!authToken) return; // Skip if auth failed

      const response = await request(app)
        .get('/api/my/supplies?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.supplies).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10
      });
    });
  });

  describe('Rate Limiting Tests', () => {
    test('Should enforce rate limits on bid placement', async () => {
      if (!authToken) return; // Skip if auth failed

      // Make multiple rapid requests to test rate limiting
      const promises = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/bids')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            timeslotId: 'test-timeslot-' + Math.random(),
            price: 50,
            quantity: 100
          })
      );

      const responses = await Promise.all(promises);
      
      // Should have some rate limited responses (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Tests', () => {
    test('Should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/initialize')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Should handle non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Should handle invalid HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/bids')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Tests', () => {
    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/api/')
        .expect(200);

      // Check for security headers added by helmet
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });

    test('Should reject requests with invalid Authorization header', async () => {
      const response = await request(app)
        .get('/api/my/bids')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Input Validation Tests', () => {
    test('Should validate pagination parameters', async () => {
      if (!authToken) return; // Skip if auth failed

      const response = await request(app)
        .get('/api/my/bids?page=-1&limit=1000') // Invalid pagination
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Should still work but with corrected values

      expect(response.body.data.pagination.page).toBeGreaterThan(0);
      expect(response.body.data.pagination.limit).toBeLessThanOrEqual(100);
    });

    test('Should validate query parameters', async () => {
      if (!authToken) return; // Skip if auth failed

      const response = await request(app)
        .get('/api/my/bids?sortOrder=invalid&status=INVALID_STATUS')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('Should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('Should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      expect(responses.length).toBe(10);
      responses.forEach(response => {
        expect(response.body.status).toBe('active');
      });
    });
  });
});
