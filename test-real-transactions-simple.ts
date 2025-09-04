#!/usr/bin/env bun

/**
 * Simple Real Transaction Test
 * Tests the transaction system with database timeslots instead of blockchain initialization
 */

import { blockchainTransactionService } from './src/services/blockchain-transaction.service';
import { blockchainService } from './src/services/blockchain.service';
import { timeslotService } from './src/services/timeslot.service';
import { logger } from './src/utils/logger';
import { PublicKey } from '@solana/web3.js';
import { env } from './src/config/environment';

class SimpleTransactionTester {
  private results: Array<{name: string, success: boolean, signature?: string, error?: string}> = [];

  async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    try {
      console.log(`\n🧪 ${name}`);
      const result = await testFn();
      
      const signature = typeof result === 'string' ? result : result?.signature;
      this.results.push({ name, success: true, signature });
      
      console.log(`✅ ${name} - PASSED`);
      if (signature && signature.length > 50 && !signature.includes('_tx_')) {
        console.log(`   📝 Real Transaction: ${signature}`);
        console.log(`   🔗 Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      } else if (signature) {
        console.log(`   📝 Mock/Serialized: ${signature.substring(0, 50)}...`);
      }
      
    } catch (error) {
      this.results.push({ 
        name, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log(`❌ ${name} - FAILED`);
      console.log(`   💥 ${error instanceof Error ? error.message : error}`);
    }
  }

  async testWalletConfiguration(): Promise<any> {
    const hasWallet = blockchainTransactionService.hasWallet();
    const walletPublicKey = blockchainTransactionService.getWalletPublicKey();
    
    if (!hasWallet) {
      throw new Error('No wallet configured - add PRIVATE_KEY to environment');
    }
    
    return {
      hasWallet,
      publicKey: walletPublicKey?.toString(),
      privateKeyConfigured: !!env.PRIVATE_KEY
    };
  }

  async testBlockchainConnection(): Promise<any> {
    const connection = blockchainService.getConnection();
    const slot = await connection.getSlot();
    const version = await connection.getVersion();
    
    return {
      slot,
      version: version['solana-core'],
      rpcUrl: env.SOLANA_RPC_URL
    };
  }

  async testContractDeployment(): Promise<any> {
    const programId = blockchainService.getProgramId();
    const connection = blockchainService.getConnection();
    
    const programAccount = await connection.getAccountInfo(programId);
    
    if (!programAccount) {
      throw new Error(`Program ${programId.toString()} not found`);
    }
    
    return {
      programId: programId.toString(),
      programExists: true,
      dataLength: programAccount.data.length
    };
  }

  async createTestTimeslot(): Promise<any> {
    // Create a test timeslot in the database
    const now = new Date();
    const startTime = new Date(now.getTime() + 60000); // 1 minute from now
    const endTime = new Date(now.getTime() + 3660000); // 1 hour 1 minute from now
    
    const timeslot = await timeslotService.createTimeslot({
      startTime,
      endTime,
      totalEnergy: 1000,
      status: 'OPEN'
    });
    
    return {
      id: timeslot.id,
      startTime: timeslot.startTime,
      endTime: timeslot.endTime,
      totalEnergy: timeslot.totalEnergy,
      status: timeslot.status
    };
  }

  async testBidTransaction(): Promise<string> {
    // Get or create a test timeslot
    const timeslots = await timeslotService.getActiveTimeslots();
    let testTimeslot = timeslots[0];
    
    if (!testTimeslot) {
      testTimeslot = await timeslotService.createTimeslot({
        startTime: new Date(Date.now() + 60000),
        endTime: new Date(Date.now() + 3660000),
        totalEnergy: 1000,
        status: 'OPEN'
      });
    }
    
    // Test with your wallet's public key
    const walletPublicKey = blockchainTransactionService.getWalletPublicKey();
    if (!walletPublicKey) {
      throw new Error('No wallet public key available');
    }
    
    const bid = {
      price: 0.001, // 0.001 SOL
      quantity: 10,
      timeslotId: testTimeslot.id
    };
    
    const signature = await blockchainTransactionService.prepareBidTransaction(
      bid,
      walletPublicKey.toString()
    );
    
    return signature;
  }

  async testSupplyTransaction(): Promise<string> {
    // Get or create a test timeslot
    const timeslots = await timeslotService.getActiveTimeslots();
    let testTimeslot = timeslots[0];
    
    if (!testTimeslot) {
      testTimeslot = await timeslotService.createTimeslot({
        startTime: new Date(Date.now() + 60000),
        endTime: new Date(Date.now() + 3660000),
        totalEnergy: 1000,
        status: 'OPEN'
      });
    }
    
    const walletPublicKey = blockchainTransactionService.getWalletPublicKey();
    if (!walletPublicKey) {
      throw new Error('No wallet public key available');
    }
    
    const supply = {
      price: 0.002, // 0.002 SOL
      quantity: 5,
      timeslotId: testTimeslot.id
    };
    
    const signature = await blockchainTransactionService.prepareSupplyTransaction(
      supply,
      walletPublicKey.toString()
    );
    
    return signature;
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Simple Real Transaction Tests');
    console.log('='.repeat(60));
    console.log(`📍 RPC URL: ${env.SOLANA_RPC_URL}`);
    console.log(`📍 Program ID: ${env.SOLANA_PROGRAM_ID}`);
    console.log('='.repeat(60));

    // Infrastructure tests
    await this.runTest('Wallet Configuration', () => this.testWalletConfiguration());
    await this.runTest('Blockchain Connection', () => this.testBlockchainConnection());
    await this.runTest('Contract Deployment', () => this.testContractDeployment());
    
    // Database setup
    await this.runTest('Create Test Timeslot', () => this.createTestTimeslot());
    
    // Transaction tests
    await this.runTest('Bid Transaction', () => this.testBidTransaction());
    await this.runTest('Supply Transaction', () => this.testSupplyTransaction());

    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   • ${r.name}: ${r.error}`));
    }
    
    // Check for real transactions
    const realTransactions = this.results
      .filter(r => r.signature && r.signature.length > 50 && !r.signature.includes('_tx_'))
      .map(r => ({ test: r.name, signature: r.signature }));
    
    if (realTransactions.length > 0) {
      console.log('\n🎯 REAL BLOCKCHAIN TRANSACTIONS:');
      realTransactions.forEach(({ test, signature }) => {
        console.log(`   • ${test}: ${signature}`);
      });
      console.log('\n🎉 SUCCESS: Real transactions are being submitted to blockchain!');
    } else {
      console.log('\n⚠️  Note: Transactions may be serialized for external signing');
      console.log('   This is expected behavior when contract state is not initialized');
    }
  }
}

async function main() {
  const tester = new SimpleTransactionTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}

export { SimpleTransactionTester };
