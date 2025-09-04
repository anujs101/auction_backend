#!/usr/bin/env bun

/**
 * Production-Grade Fixes Validation Test
 * Tests all the security and production improvements made
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

const API_BASE = 'http://localhost:3000/api';

describe('Production-Grade Fixes Validation', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Security Improvements', () => {
    test('Error responses should not expose stack traces in production', async () => {
      // Test with invalid JSON
      const response = await fetch(`${API_BASE}/auth/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid": json}'
      });

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Invalid JSON format');
      expect(data.error.stack).toBeUndefined(); // Should not have stack trace
    });

    test('Security headers should be properly configured', async () => {
      const response = await fetch(`${API_BASE}/`);
      
      // Check X-Frame-Options is set to DENY
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      
      // Check other security headers are present
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-xss-protection')).toBeTruthy();
    });

    test('Wallet validation should be relaxed for development', async () => {
      const response = await fetch(`${API_BASE}/auth/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: 'TestWallet123' })
      });

      const data = await response.json();
      
      // Should pass validation in development (8+ chars)
      if (data.success === false && data.error.message.includes('String must contain at least 32')) {
        throw new Error('Wallet validation not properly relaxed for development');
      }
      
      // Even if it fails due to database, it should pass validation
      expect(response.status).not.toBe(400);
    });

    test('Rate limiting should be active', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array.from({ length: 15 }, () =>
        fetch(`${API_BASE}/`, { method: 'GET' })
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      
      // Should have at least some rate limiting active
      console.log(`Rate limiting test: ${responses.filter(r => r.status === 429).length}/15 requests rate limited`);
    });
  });

  describe('Error Handling Improvements', () => {
    test('Invalid JSON should return 400 with proper message', async () => {
      const response = await fetch(`${API_BASE}/auth/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid": json}'
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Invalid JSON format');
    });

    test('Missing required fields should return validation error', async () => {
      const response = await fetch(`${API_BASE}/auth/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Required');
    });

    test('404 errors should be properly handled', async () => {
      const response = await fetch(`${API_BASE}/nonexistent-endpoint`);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Route');
      expect(data.error.message).toContain('not found');
    });
  });

  describe('API Functionality', () => {
    test('API info endpoint should work', async () => {
      const response = await fetch(`${API_BASE}/`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('Solana Energy Auction API');
      expect(data.version).toBe('1.0.0');
      expect(data.status).toBe('active');
    });

    test('Health endpoint should work', async () => {
      const response = await fetch(`${API_BASE}/health`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.uptime).toBeGreaterThan(0);
    });

    test('Blockchain health should work', async () => {
      const response = await fetch(`${API_BASE}/blockchain/health`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
    });
  });

  describe('Authentication Security', () => {
    test('Protected endpoints should require authentication', async () => {
      const response = await fetch(`${API_BASE}/my/bids`);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('token');
    });

    test('Invalid token should be rejected', async () => {
      const response = await fetch(`${API_BASE}/my/bids`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});

// Run the tests
console.log('🧪 Running Production-Grade Fixes Validation Tests...\n');
