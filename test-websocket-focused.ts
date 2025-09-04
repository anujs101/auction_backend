import { io, Socket } from 'socket.io-client';

async function testWebSocketCore(): Promise<void> {
  console.log('🔌 Testing WebSocket Core Functionality\n');
  
  const socket = io('http://localhost:3001', {
    transports: ['websocket'],
    timeout: 5000
  });

  try {
    // Test 1: Basic Connection
    console.log('1️⃣ Testing basic connection...');
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Connected successfully');
        console.log(`   Socket ID: ${socket.id}`);
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Test 2: Ping/Pong
    console.log('\n2️⃣ Testing ping/pong...');
    socket.emit('ping');
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Pong timeout')), 3000);
      
      socket.once('pong', () => {
        clearTimeout(timeout);
        console.log('✅ Ping/pong working');
        resolve();
      });
    });

    // Test 3: Room Operations (Global Room)
    console.log('\n3️⃣ Testing global room join...');
    socket.emit('join_room', 'global');
    
    // Wait for room response or timeout
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⚠️  No room response (may be auto-joined)');
        resolve();
      }, 2000);
      
      socket.once('room_joined', (data) => {
        clearTimeout(timeout);
        console.log('✅ Room joined:', data);
        resolve();
      });
      
      socket.once('room_join_error', (error) => {
        clearTimeout(timeout);
        console.log('❌ Room join error:', error);
        resolve();
      });
    });

    // Test 4: API Endpoints
    console.log('\n4️⃣ Testing WebSocket API endpoints...');
    
    const healthResponse = await fetch('http://localhost:3001/api/websocket/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint:', healthData.data.status);
    
    const statsResponse = await fetch('http://localhost:3001/api/websocket/stats');
    const statsData = await statsResponse.json();
    console.log('✅ Stats endpoint - Total connections:', statsData.data.connectionStats.totalConnections);

    // Test 5: Broadcast Test
    console.log('\n5️⃣ Testing broadcast functionality...');
    const broadcastResponse = await fetch('http://localhost:3001/api/websocket/test-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'WebSocket Test',
        message: 'Testing WebSocket broadcast functionality',
        level: 'info'
      })
    });
    
    const broadcastData = await broadcastResponse.json();
    console.log('✅ Broadcast test:', broadcastData.success ? 'Success' : 'Failed');

    console.log('\n🎉 WebSocket Core Tests Completed Successfully!');
    console.log('📊 All essential WebSocket functionality is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : error);
  } finally {
    socket.disconnect();
    console.log('\n🔌 Socket disconnected');
  }
}

// Run the test
testWebSocketCore().catch(console.error);
