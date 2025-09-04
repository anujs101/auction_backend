#!/usr/bin/env bun

/**
 * Real Blockchain Transaction Test
 * Tests actual transaction submission to deployed energy_auction contract
 */

import { blockchainTransactionService, TransactionError, InsufficientBalanceError } from './src/services/blockchain-transaction.service';
import { blockchainService } from './src/services/blockchain.service';
import { logger } from './src/utils/logger';
import { PublicKey, Keypair } from '@solana/web3.js';
import { env } from './src/config/environment';

// Test configuration
const TEST_CONFIG = {
  // Test wallet (you should replace with a test wallet that has some devnet SOL)
  TEST_WALLET: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', // Example devnet wallet
  TEST_TIMESLOT_ID: '1725432000', // Example timeslot epoch
  TEST_BID: {
    price: 0.001, // 0.001 SOL
    quantity: 10,
    timeslotId: '1725432000'
  },
  TEST_SUPPLY: {
    price: 0.002, // 0.002 SOL
    quantity: 5,
    timeslotId: '1725432000'
  }
};

interface TestResult {
  testName: string;
  success: boolean;
  signature?: string;
  error?: string;
  duration: number;
  details?: any;
}

class RealBlockchainTransactionTester {
  private results: TestResult[] = [];

  async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Running: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        testName,
        success: true,
        signature: typeof result === 'string' ? result : result?.signature,
        duration,
        details: typeof result === 'object' ? result : undefined
      };
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      if (testResult.signature) {
        console.log(`   📝 Signature: ${testResult.signature}`);
      }
      
      this.results.push(testResult);
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
      
      console.log(`❌ ${testName} - FAILED (${duration}ms)`);
      console.log(`   💥 Error: ${testResult.error}`);
      
      this.results.push(testResult);
      return testResult;
    }
  }

  async testBlockchainConnection(): Promise<any> {
    const connection = blockchainTransactionService.getConnection();
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
    
    // Check if program account exists
    const programAccount = await connection.getAccountInfo(programId);
    
    if (!programAccount) {
      throw new Error(`Program ${programId.toString()} not found on blockchain`);
    }
    
    // Check global state
    const [globalStatePda] = blockchainService.getGlobalStatePDA();
    const globalStateAccount = await connection.getAccountInfo(globalStatePda);
    
    return {
      programId: programId.toString(),
      programExists: !!programAccount,
      programDataLength: programAccount.data.length,
      globalStateExists: !!globalStateAccount,
      globalStatePda: globalStatePda.toString()
    };
  }

  async testWalletBalance(): Promise<any> {
    const connection = blockchainTransactionService.getConnection();
    const testWallet = new PublicKey(TEST_CONFIG.TEST_WALLET);
    
    const balance = await connection.getBalance(testWallet);
    const balanceSOL = balance / 1e9;
    
    if (balanceSOL < 0.01) {
      throw new Error(`Insufficient balance: ${balanceSOL} SOL (need at least 0.01 SOL for testing)`);
    }
    
    return {
      wallet: TEST_CONFIG.TEST_WALLET,
      balanceLamports: balance,
      balanceSOL,
      sufficientForTesting: balanceSOL >= 0.01
    };
  }

  async testTransactionServiceWallet(): Promise<any> {
    const hasWallet = blockchainTransactionService.hasWallet();
    const walletPublicKey = blockchainTransactionService.getWalletPublicKey();
    
    return {
      hasWallet,
      walletPublicKey: walletPublicKey?.toString(),
      privateKeyConfigured: !!env.PRIVATE_KEY
    };
  }

  async testBidTransactionSubmission(): Promise<string> {
    const signature = await blockchainTransactionService.prepareBidTransaction(
      TEST_CONFIG.TEST_BID,
      TEST_CONFIG.TEST_WALLET
    );
    
    // Check if it's a real signature or mock
    const isRealSignature = signature.length > 50 && !signature.includes('bid_tx_');
    
    if (!isRealSignature && blockchainTransactionService.hasWallet()) {
      throw new Error('Expected real transaction signature but got mock signature');
    }
    
    return signature;
  }

  async testSupplyTransactionSubmission(): Promise<string> {
    const signature = await blockchainTransactionService.prepareSupplyTransaction(
      TEST_CONFIG.TEST_SUPPLY,
      TEST_CONFIG.TEST_WALLET
    );
    
    // Check if it's a real signature or mock
    const isRealSignature = signature.length > 50 && !signature.includes('supply_tx_');
    
    if (!isRealSignature && blockchainTransactionService.hasWallet()) {
      throw new Error('Expected real transaction signature but got mock signature');
    }
    
    return signature;
  }

  async testTransactionStatus(): Promise<any> {
    // First submit a transaction
    const signature = await blockchainTransactionService.prepareBidTransaction(
      TEST_CONFIG.TEST_BID,
      TEST_CONFIG.TEST_WALLET
    );
    
    // Then check its status
    const status = await blockchainTransactionService.getTransactionStatus(signature);
    
    return {
      signature,
      status
    };
  }

  async testErrorHandling(): Promise<any> {
    try {
      // Test with invalid wallet
      await blockchainTransactionService.prepareBidTransaction(
        TEST_CONFIG.TEST_BID,
        'invalid_wallet_address'
      );
      throw new Error('Should have thrown error for invalid wallet');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid public key')) {
        return { errorHandlingWorks: true, errorType: 'InvalidPublicKey' };
      }
      throw error;
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Real Blockchain Transaction Tests');
    console.log('='.repeat(60));
    console.log(`📍 RPC URL: ${env.SOLANA_RPC_URL}`);
    console.log(`📍 Program ID: ${env.SOLANA_PROGRAM_ID}`);
    console.log(`📍 Test Wallet: ${TEST_CONFIG.TEST_WALLET}`);
    console.log('='.repeat(60));

    // Core infrastructure tests
    await this.runTest('Blockchain Connection', () => this.testBlockchainConnection());
    await this.runTest('Contract Deployment Check', () => this.testContractDeployment());
    await this.runTest('Wallet Balance Check', () => this.testWalletBalance());
    await this.runTest('Transaction Service Wallet', () => this.testTransactionServiceWallet());
    
    // Transaction submission tests
    await this.runTest('Bid Transaction Submission', () => this.testBidTransactionSubmission());
    await this.runTest('Supply Transaction Submission', () => this.testSupplyTransactionSubmission());
    await this.runTest('Transaction Status Check', () => this.testTransactionStatus());
    
    // Error handling tests
    await this.runTest('Error Handling', () => this.testErrorHandling());

    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   • ${r.testName}: ${r.error}`));
    }
    
    // Check for real transaction signatures
    const realSignatures = this.results
      .filter(r => r.signature && r.signature.length > 50 && !r.signature.includes('_tx_'))
      .map(r => ({ test: r.testName, signature: r.signature }));
    
    if (realSignatures.length > 0) {
      console.log('\n🎯 REAL BLOCKCHAIN TRANSACTIONS DETECTED:');
      realSignatures.forEach(({ test, signature }) => {
        console.log(`   • ${test}: ${signature}`);
        console.log(`     🔗 View on Solana Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      });
    } else {
      console.log('\n⚠️  NO REAL TRANSACTIONS DETECTED - All signatures appear to be mocks');
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (passed === this.results.length) {
      console.log('🎉 ALL TESTS PASSED - Real blockchain integration working!');
    } else {
      console.log('⚠️  Some tests failed - Check configuration and setup');
    }
  }
}

// Run the tests
async function main() {
  const tester = new RealBlockchainTransactionTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.main) {
  main().catch(console.error);
}

export { RealBlockchainTransactionTester };
