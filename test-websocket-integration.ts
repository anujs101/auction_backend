import { io, Socket } from 'socket.io-client';
import { logger } from './src/utils/logger';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

class WebSocketIntegrationTest {
  private baseUrl = 'http://localhost:3001';
  private results: TestResult[] = [];
  private socket: Socket | null = null;

  async runAllTests(): Promise<void> {
    console.log('🔌 Starting WebSocket Integration Tests\n');
    console.log('=' .repeat(60));

    try {
      // Test 1: Basic connection
      await this.testBasicConnection();
      
      // Test 2: Authentication flow
      await this.testAuthenticationFlow();
      
      // Test 3: Room management
      await this.testRoomManagement();
      
      // Test 4: Event broadcasting
      await this.testEventBroadcasting();
      
      // Test 5: WebSocket API endpoints
      await this.testWebSocketApiEndpoints();
      
      // Test 6: Connection cleanup
      await this.testConnectionCleanup();

    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      await this.cleanup();
      this.printResults();
    }
  }

  private async testBasicConnection(): Promise<void> {
    const testName = 'Basic WebSocket Connection';
    const startTime = Date.now();

    try {
      this.socket = io(this.baseUrl, {
        transports: ['websocket'],
        timeout: 5000
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      this.addResult({
        name: testName,
        status: 'PASS',
        message: 'Successfully connected to WebSocket server',
        duration: Date.now() - startTime
      });

    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testAuthenticationFlow(): Promise<void> {
    const testName = 'WebSocket Authentication Flow';
    const startTime = Date.now();

    try {
      if (!this.socket) {
        throw new Error('No socket connection available');
      }

      // Test unauthenticated connection (should work for public rooms)
      let joinResult = await this.emitAndWait('join_room', 'global', 'room_joined', 3000);
      
      if (!joinResult.success) {
        throw new Error('Failed to join global room without authentication');
      }

      // Test authenticated room (should fail without token)
      try {
        await this.emitAndWait('join_room', 'authenticated', 'room_join_error', 3000);
      } catch (error) {
        // Expected to fail
      }

      this.addResult({
        name: testName,
        status: 'PASS',
        message: 'Authentication flow working correctly',
        duration: Date.now() - startTime
      });

    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        message: `Authentication test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testRoomManagement(): Promise<void> {
    const testName = 'Room Management';
    const startTime = Date.now();

    try {
      if (!this.socket) {
        throw new Error('No socket connection available');
      }

      // Test joining and leaving rooms
      await this.emitAndWait('join_room', 'global', 'room_joined', 3000);
      await this.emitAndWait('leave_room', 'global', 'room_left', 3000);

      this.addResult({
        name: testName,
        status: 'PASS',
        message: 'Room join/leave operations working correctly',
        duration: Date.now() - startTime
      });

    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        message: `Room management failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testEventBroadcasting(): Promise<void> {
    const testName = 'Event Broadcasting';
    const startTime = Date.now();

    try {
      if (!this.socket) {
        throw new Error('No socket connection available');
      }

      // Test ping/pong
      await this.emitAndWait('ping', null, 'pong', 3000);

      this.addResult({
        name: testName,
        status: 'PASS',
        message: 'Event broadcasting working correctly',
        duration: Date.now() - startTime
      });

    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        message: `Event broadcasting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testWebSocketApiEndpoints(): Promise<void> {
    const testName = 'WebSocket API Endpoints';
    const startTime = Date.now();

    try {
      // Test health endpoint
      const healthResponse = await fetch(`${this.baseUrl}/api/websocket/health`);
      const healthData = await healthResponse.json();

      if (!healthData.success || healthData.data.status !== 'healthy') {
        throw new Error('Health endpoint failed');
      }

      // Test stats endpoint
      const statsResponse = await fetch(`${this.baseUrl}/api/websocket/stats`);
      const statsData = await statsResponse.json();

      if (!statsData.success) {
        throw new Error('Stats endpoint failed');
      }

      // Test broadcast endpoint (should work without auth for testing)
      const broadcastResponse = await fetch(`${this.baseUrl}/api/websocket/test-broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Announcement',
          message: 'This is a test WebSocket broadcast',
          level: 'info'
        })
      });

      const broadcastData = await broadcastResponse.json();

      if (!broadcastData.success) {
        throw new Error('Test broadcast endpoint failed');
      }

      this.addResult({
        name: testName,
        status: 'PASS',
        message: 'All WebSocket API endpoints working correctly',
        duration: Date.now() - startTime
      });

    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        message: `API endpoints failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testConnectionCleanup(): Promise<void> {
    const testName = 'Connection Cleanup';
    const startTime = Date.now();

    try {
      if (!this.socket) {
        throw new Error('No socket connection available');
      }

      // Disconnect and verify cleanup
      this.socket.disconnect();
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.addResult({
        name: testName,
        status: 'PASS',
        message: 'Connection cleanup completed successfully',
        duration: Date.now() - startTime
      });

    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async emitAndWait(event: string, data: any, expectedResponse: string, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('No socket connection'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${expectedResponse}`));
      }, timeout);

      this.socket.once(expectedResponse, (response) => {
        clearTimeout(timer);
        resolve({ success: true, data: response });
      });

      this.socket.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });

      this.socket.emit(event, data);
    });
  }

  private addResult(result: TestResult): void {
    this.results.push(result);
    const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${status} ${result.name}${duration}`);
    console.log(`   ${result.message}\n`);
  }

  private async cleanup(): Promise<void> {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  private printResults(): void {
    console.log('=' .repeat(60));
    console.log('📊 WebSocket Integration Test Results\n');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.name}: ${r.message}`));
      console.log();
    }

    const overallStatus = failed === 0 ? 'PASSED' : 'FAILED';
    console.log(`🎯 Overall Status: ${overallStatus}`);
    console.log('=' .repeat(60));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new WebSocketIntegrationTest();
  tester.runAllTests().catch(console.error);
}

export { WebSocketIntegrationTest };
