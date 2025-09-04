#!/usr/bin/env bun

/**
 * Comprehensive Production-Grade Endpoint Testing
 * Tests all implemented endpoints for production readiness
 */

const API_BASE = 'http://localhost:3000/api';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  responseTime?: number;
  statusCode?: number;
}

class ProductionTester {
  private results: TestResult[] = [];
  private startTime = Date.now();

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Comprehensive Production-Grade Endpoint Testing...\n');

    // Core API Tests
    await this.testCoreEndpoints();
    
    // Security Tests
    await this.testSecurityFeatures();
    
    // Authentication Tests
    await this.testAuthenticationFlow();
    
    // Bid Management Tests
    await this.testBidEndpoints();
    
    // Supply Management Tests
    await this.testSupplyEndpoints();
    
    // Blockchain Integration Tests
    await this.testBlockchainEndpoints();
    
    // Error Handling Tests
    await this.testErrorHandling();
    
    // Performance Tests
    await this.testPerformance();
    
    // Rate Limiting Tests
    await this.testRateLimiting();

    this.generateReport();
  }

  private async testCoreEndpoints(): Promise<void> {
    console.log('📋 Testing Core API Endpoints...');

    // API Info
    await this.testEndpoint('GET', '/', 200, 'API info should return correctly');
    
    // Health Check
    await this.testEndpoint('GET', '/health', 200, 'Health check should be operational');
  }

  private async testSecurityFeatures(): Promise<void> {
    console.log('🛡️ Testing Security Features...');

    // Security Headers
    const response = await fetch(`${API_BASE}/`);
    const headers = response.headers;
    
    this.addResult('/', 'GET', 
      headers.get('x-frame-options') === 'DENY' ? 'PASS' : 'FAIL',
      `X-Frame-Options: ${headers.get('x-frame-options')}`
    );
    
    this.addResult('/', 'GET',
      headers.get('x-content-type-options') === 'nosniff' ? 'PASS' : 'WARN',
      `X-Content-Type-Options: ${headers.get('x-content-type-options')}`
    );

    // CORS Headers
    this.addResult('/', 'GET',
      headers.get('access-control-allow-origin') ? 'PASS' : 'WARN',
      `CORS configured: ${!!headers.get('access-control-allow-origin')}`
    );

    // Invalid JSON handling
    const jsonResponse = await fetch(`${API_BASE}/auth/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid": json}'
    });
    
    this.addResult('/auth/initialize', 'POST',
      jsonResponse.status === 400 ? 'PASS' : 'FAIL',
      `Invalid JSON handling: ${jsonResponse.status}`
    );
  }

  private async testAuthenticationFlow(): Promise<void> {
    console.log('🔐 Testing Authentication Flow...');

    // Initialize auth with valid wallet (development)
    const initResponse = await fetch(`${API_BASE}/auth/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: 'TestWallet123' })
    });

    this.addResult('/auth/initialize', 'POST',
      initResponse.status !== 400 ? 'PASS' : 'FAIL',
      `Wallet validation relaxed for dev: ${initResponse.status}`
    );

    // Test protected endpoint without auth
    const protectedResponse = await fetch(`${API_BASE}/my/bids`);
    this.addResult('/my/bids', 'GET',
      protectedResponse.status === 401 ? 'PASS' : 'FAIL',
      `Protected endpoint security: ${protectedResponse.status}`
    );

    // Test with invalid token
    const invalidTokenResponse = await fetch(`${API_BASE}/my/bids`, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    this.addResult('/my/bids', 'GET',
      invalidTokenResponse.status === 401 ? 'PASS' : 'FAIL',
      `Invalid token rejection: ${invalidTokenResponse.status}`
    );
  }

  private async testBidEndpoints(): Promise<void> {
    console.log('💰 Testing Bid Management Endpoints...');

    // Test bid placement without auth
    const bidResponse = await fetch(`${API_BASE}/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeslotId: 'test-timeslot',
        amount: 100,
        energyAmount: 50
      })
    });

    this.addResult('/bids', 'POST',
      bidResponse.status === 401 ? 'PASS' : 'FAIL',
      `Bid placement requires auth: ${bidResponse.status}`
    );

    // Test bid validation
    const invalidBidResponse = await fetch(`${API_BASE}/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' })
    });

    this.addResult('/bids', 'POST',
      invalidBidResponse.status === 400 || invalidBidResponse.status === 401 ? 'PASS' : 'FAIL',
      `Bid validation working: ${invalidBidResponse.status}`
    );
  }

  private async testSupplyEndpoints(): Promise<void> {
    console.log('⚡ Testing Supply Management Endpoints...');

    // Test supply placement without auth
    const supplyResponse = await fetch(`${API_BASE}/supplies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeslotId: 'test-timeslot',
        pricePerUnit: 10,
        energyAmount: 100
      })
    });

    this.addResult('/supplies', 'POST',
      supplyResponse.status === 401 ? 'PASS' : 'FAIL',
      `Supply placement requires auth: ${supplyResponse.status}`
    );

    // Test supply validation
    const invalidSupplyResponse = await fetch(`${API_BASE}/supplies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' })
    });

    this.addResult('/supplies', 'POST',
      invalidSupplyResponse.status === 400 || invalidSupplyResponse.status === 401 ? 'PASS' : 'FAIL',
      `Supply validation working: ${invalidSupplyResponse.status}`
    );
  }

  private async testBlockchainEndpoints(): Promise<void> {
    console.log('⛓️ Testing Blockchain Integration...');

    // Blockchain health
    await this.testEndpoint('GET', '/blockchain/health', 200, 'Blockchain health check');

    // Global state (may return 404 if not initialized)
    const globalStateResponse = await fetch(`${API_BASE}/blockchain/global-state`);
    this.addResult('/blockchain/global-state', 'GET',
      globalStateResponse.status === 200 || globalStateResponse.status === 404 ? 'PASS' : 'FAIL',
      `Global state endpoint: ${globalStateResponse.status}`
    );
  }

  private async testErrorHandling(): Promise<void> {
    console.log('❌ Testing Error Handling...');

    // 404 handling
    const notFoundResponse = await fetch(`${API_BASE}/nonexistent-endpoint`);
    this.addResult('/nonexistent-endpoint', 'GET',
      notFoundResponse.status === 404 ? 'PASS' : 'FAIL',
      `404 handling: ${notFoundResponse.status}`
    );

    // Method not allowed
    const methodResponse = await fetch(`${API_BASE}/`, { method: 'DELETE' });
    this.addResult('/', 'DELETE',
      methodResponse.status === 404 || methodResponse.status === 405 ? 'PASS' : 'WARN',
      `Method handling: ${methodResponse.status}`
    );

    // Check error response format
    const errorData = await notFoundResponse.json();
    this.addResult('/nonexistent-endpoint', 'GET',
      errorData.success === false && errorData.error ? 'PASS' : 'FAIL',
      `Error response format: ${JSON.stringify(errorData).substring(0, 50)}...`
    );

    // Check no stack traces in production-like responses
    this.addResult('/nonexistent-endpoint', 'GET',
      !errorData.error.stack || process.env.NODE_ENV === 'development' ? 'PASS' : 'FAIL',
      `Stack trace handling: ${errorData.error.stack ? 'present' : 'hidden'}`
    );
  }

  private async testPerformance(): Promise<void> {
    console.log('⚡ Testing Performance...');

    const start = Date.now();
    const response = await fetch(`${API_BASE}/`);
    const responseTime = Date.now() - start;

    this.addResult('/', 'GET',
      responseTime < 1000 ? 'PASS' : 'WARN',
      `Response time: ${responseTime}ms`,
      responseTime
    );

    // Concurrent requests test
    const promises = Array.from({ length: 10 }, () => fetch(`${API_BASE}/`));
    const concurrentStart = Date.now();
    await Promise.all(promises);
    const concurrentTime = Date.now() - concurrentStart;

    this.addResult('/', 'GET',
      concurrentTime < 2000 ? 'PASS' : 'WARN',
      `Concurrent requests (10): ${concurrentTime}ms`
    );
  }

  private async testRateLimiting(): Promise<void> {
    console.log('🚦 Testing Rate Limiting...');

    // Make rapid requests to test rate limiting
    const promises = Array.from({ length: 20 }, () => fetch(`${API_BASE}/`));
    const responses = await Promise.all(promises);
    
    const rateLimited = responses.filter(r => r.status === 429).length;
    
    this.addResult('/', 'GET',
      rateLimited > 0 ? 'PASS' : 'WARN',
      `Rate limiting active: ${rateLimited}/20 requests limited`
    );
  }

  private async testEndpoint(method: string, path: string, expectedStatus: number, description: string): Promise<void> {
    try {
      const start = Date.now();
      const response = await fetch(`${API_BASE}${path}`, { method });
      const responseTime = Date.now() - start;

      this.addResult(path, method,
        response.status === expectedStatus ? 'PASS' : 'FAIL',
        `${description}: ${response.status}`,
        responseTime,
        response.status
      );
    } catch (error) {
      this.addResult(path, method, 'FAIL', `${description}: ${error}`);
    }
  }

  private addResult(endpoint: string, method: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, responseTime?: number, statusCode?: number): void {
    this.results.push({ endpoint, method, status, message, responseTime, statusCode });
  }

  private generateReport(): void {
    const totalTime = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE PRODUCTION-GRADE TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   🕐 Total Time: ${totalTime}ms`);
    
    const passRate = ((passed / total) * 100).toFixed(1);
    console.log(`   📊 Pass Rate: ${passRate}%`);

    console.log(`\n📋 Detailed Results:`);
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
      console.log(`   ${icon} ${result.method} ${result.endpoint}${time}`);
      console.log(`      ${result.message}`);
    });

    console.log(`\n🎯 Production Readiness Assessment:`);
    if (failed === 0 && warnings <= 2) {
      console.log('   🚀 READY FOR PRODUCTION DEPLOYMENT');
    } else if (failed <= 2) {
      console.log('   ⚠️  NEEDS MINOR FIXES BEFORE PRODUCTION');
    } else {
      console.log('   ❌ REQUIRES SIGNIFICANT FIXES');
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Run the comprehensive tests
const tester = new ProductionTester();
tester.runAllTests().catch(console.error);
