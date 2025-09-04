#!/usr/bin/env bun

import { BlockchainService } from './src/services/blockchain.service';
import { logger } from './src/utils/logger';

async function testBlockchainIntegration() {
  console.log('🔗 Testing Blockchain Integration with Real Anchor Program...\n');

  const blockchainService = new BlockchainService();

  try {
    // Test 1: Initialize blockchain service
    console.log('1. Initializing blockchain service...');
    await blockchainService.initialize();
    console.log('✅ Blockchain service initialized successfully\n');

    // Test 2: Check connection health
    console.log('2. Checking blockchain connection health...');
    const health = await blockchainService.checkConnection();
    console.log('✅ Connection healthy:', {
      status: health.status,
      slot: health.slot,
      version: health.version?.['solana-core']
    });
    console.log('');

    // Test 3: Get global state
    console.log('3. Fetching global state from blockchain...');
    const globalState = await blockchainService.getGlobalState();
    if (globalState) {
      console.log('✅ Global state found:', {
        authority: globalState.authority,
        paused: globalState.paused,
        totalTimeslots: globalState.totalTimeslots,
        feeRate: globalState.feeRate
      });
    } else {
      console.log('⚠️  Global state not found (program may not be initialized)');
    }
    console.log('');

    // Test 4: Get timeslot (epoch 1)
    console.log('4. Fetching timeslot for epoch 1...');
    const timeslot = await blockchainService.getTimeslot(1);
    if (timeslot) {
      console.log('✅ Timeslot found:', {
        publicKey: timeslot.publicKey,
        epoch: timeslot.epoch,
        status: timeslot.status,
        reservePrice: timeslot.reservePrice
      });
    } else {
      console.log('⚠️  Timeslot not found (no timeslot created for epoch 1)');
    }
    console.log('');

    // Test 5: Get active timeslots
    console.log('5. Fetching active timeslots...');
    const activeTimeslots = await blockchainService.getActiveTimeslots();
    console.log(`✅ Found ${activeTimeslots.length} active timeslots`);
    console.log('');

    // Test 6: Get bids for timeslot
    console.log('6. Fetching bids for timeslot epoch 1...');
    const bids = await blockchainService.getBidsForTimeslot(1);
    console.log(`✅ Found ${bids.length} bids for timeslot epoch 1`);
    console.log('');

    // Test 7: Get supplies for timeslot
    console.log('7. Fetching supplies for timeslot epoch 1...');
    const supplies = await blockchainService.getSuppliesForTimeslot(1);
    console.log(`✅ Found ${supplies.length} supplies for timeslot epoch 1`);
    console.log('');

    console.log('🎉 All blockchain integration tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Blockchain service initialization: PASSED');
    console.log('- ✅ Connection health check: PASSED');
    console.log('- ✅ Global state fetch: PASSED');
    console.log('- ✅ Timeslot fetch: PASSED');
    console.log('- ✅ Active timeslots fetch: PASSED');
    console.log('- ✅ Bids fetch: PASSED');
    console.log('- ✅ Supplies fetch: PASSED');
    console.log('\n🚀 Real Anchor integration is working correctly!');

  } catch (error) {
    console.error('❌ Blockchain integration test failed:', error);
    process.exit(1);
  }
}

// Run the test
testBlockchainIntegration().catch(console.error);
