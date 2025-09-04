import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from './index';
import { prismaService } from './src/database/prisma.service';

describe('Bid Management System Endpoints', () => {
  let authToken: string;
  let testUserId: string;
  let testTimeslotId: string;
  let testBidId: string;

  beforeAll(async () => {
    // Initialize auth for testing
    const walletAddress = 'TestWallet123456789';
    
    // Initialize authentication
    const initResponse = await request(app)
      .post('/api/auth/initialize')
      .send({ walletAddress });
    
    expect(initResponse.status).toBe(200);
    const { nonce } = initResponse.body.data;

    // Mock signature verification (in real tests, you'd sign the nonce)
    const verifyResponse = await request(app)
      .post('/api/auth/verify')
      .send({
        walletAddress,
        signature: 'mock_signature_' + nonce,
        nonce
      });

    expect(verifyResponse.status).toBe(200);
    authToken = verifyResponse.body.data.token;
    testUserId = verifyResponse.body.data.user.id;

    // Create a test timeslot
    const timeslotResponse = await request(app)
      .post('/api/timeslots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        startTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
        endTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        totalEnergy: 1000
      });

    expect(timeslotResponse.status).toBe(201);
    testTimeslotId = timeslotResponse.body.data.timeslot.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testBidId) {
      await prismaService.client.bid.deleteMany({
        where: { id: testBidId }
      });
    }
    if (testTimeslotId) {
      await prismaService.client.timeslot.deleteMany({
        where: { id: testTimeslotId }
      });
    }
    if (testUserId) {
      await prismaService.client.user.deleteMany({
        where: { id: testUserId }
      });
    }
  });

  describe('POST /api/bids - Place Bid', () => {
    test('should place a new bid successfully', async () => {
      const bidData = {
        timeslotId: testTimeslotId,
        price: 50.5,
        quantity: 100
      };

      const response = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bidData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bid).toMatchObject({
        timeslotId: testTimeslotId,
        price: 50.5,
        quantity: 100,
        status: 'PENDING'
      });

      testBidId = response.body.data.bid.id;
    });

    test('should reject bid without authentication', async () => {
      const bidData = {
        timeslotId: testTimeslotId,
        price: 50.5,
        quantity: 100
      };

      const response = await request(app)
        .post('/api/bids')
        .send(bidData);

      expect(response.status).toBe(401);
    });

    test('should reject bid with invalid data', async () => {
      const bidData = {
        timeslotId: testTimeslotId,
        price: -10, // Invalid negative price
        quantity: 100
      };

      const response = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/bids/:id - Get Bid Details', () => {
    test('should get bid details for owner', async () => {
      const response = await request(app)
        .get(`/api/bids/${testBidId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bid).toMatchObject({
        id: testBidId,
        timeslotId: testTimeslotId,
        price: 50.5,
        quantity: 100
      });
    });

    test('should reject unauthorized access to bid details', async () => {
      const response = await request(app)
        .get(`/api/bids/${testBidId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/my/bids - Get User Bids', () => {
    test('should get current user bids', async () => {
      const response = await request(app)
        .get('/api/my/bids')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bids).toBeInstanceOf(Array);
      expect(response.body.data.bids.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10
      });
    });

    test('should support pagination and filtering', async () => {
      const response = await request(app)
        .get('/api/my/bids?page=1&limit=5&status=PENDING')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/timeslots/:id/bids - Get Timeslot Bids', () => {
    test('should get bids for a timeslot', async () => {
      const response = await request(app)
        .get(`/api/timeslots/${testTimeslotId}/bids`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bids).toBeInstanceOf(Array);
      expect(response.body.data.timeslotId).toBe(testTimeslotId);
    });
  });

  describe('GET /api/timeslots/:id/bids/stats - Get Bid Statistics', () => {
    test('should get bid statistics for a timeslot', async () => {
      const response = await request(app)
        .get(`/api/timeslots/${testTimeslotId}/bids/stats`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toMatchObject({
        totalBids: expect.any(Number),
        totalQuantity: expect.any(Number),
        averagePrice: expect.any(Number)
      });
    });
  });

  describe('DELETE /api/bids/:id - Cancel Bid', () => {
    test('should cancel own bid successfully', async () => {
      const response = await request(app)
        .delete(`/api/bids/${testBidId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bid.status).toBe('CANCELLED');
    });

    test('should reject canceling non-existent bid', async () => {
      const response = await request(app)
        .delete('/api/bids/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/bids/:id/status - Update Bid Status', () => {
    test('should update bid status (internal use)', async () => {
      // First create a new bid for this test
      const bidResponse = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          timeslotId: testTimeslotId,
          price: 60,
          quantity: 50
        });

      const newBidId = bidResponse.body.data.bid.id;

      const response = await request(app)
        .put(`/api/bids/${newBidId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'CONFIRMED',
          txSignature: 'test_tx_signature_123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bid.status).toBe('CONFIRMED');
    });
  });
});
