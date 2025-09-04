#!/usr/bin/env bun

/**
 * Contract State Checker and Test Setup
 * Checks contract deployment and creates test data for transaction testing
 */

import { blockchainTransactionService } from './src/services/blockchain-transaction.service';
import { blockchainService } from './src/services/blockchain.service';
import { timeslotService } from './src/services/timeslot.service';
import { logger } from './src/utils/logger';
import { PublicKey } from '@solana/web3.js';

class ContractInitializer {
  private connection = blockchainService.getConnection();
  private programId = blockchainService.getProgramId();

  /**
   * Initialize global state account
   */
  async initializeGlobalState(): Promise<string> {
    try {
      console.log('🔧 Initializing global state...');
      
      const [globalStatePda, bump] = blockchainService.getGlobalStatePDA();
      
      // Check if already initialized
      const existingAccount = await this.connection.getAccountInfo(globalStatePda);
      if (existingAccount) {
        console.log('✅ Global state already initialized');
        return 'already_initialized';
      }

      // Create initialize instruction
      const initializeData = serialize(
        new Map([
          [InitializeGlobalStateArgs, {
            kind: 'struct',
            fields: [
              ['admin', [32]], // PublicKey as 32 bytes
              ['feePercentage', 'u16']
            ]
          }]
        ]),
        new InitializeGlobalStateArgs({
          admin: this.wallet!.publicKey,
          feePercentage: 250 // 2.5%
        })
      );

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: globalStatePda, isSigner: false, isWritable: true },
          { pubkey: this.wallet!.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId: this.programId,
        data: Buffer.concat([
          Buffer.from([0]), // Initialize instruction discriminator
          initializeData
        ])
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = this.wallet!.publicKey;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      // Sign and send transaction
      transaction.sign(this.wallet!);
      const signature = await this.connection.sendTransaction(transaction, [this.wallet!]);
      
      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log(`✅ Global state initialized: ${signature}`);
      return signature;
      
    } catch (error) {
      logger.error('Failed to initialize global state:', error);
      throw error;
    }
  }

  /**
   * Create a test timeslot
   */
  async createTimeslot(epoch: number, totalEnergy: number): Promise<string> {
    try {
      console.log(`🔧 Creating timeslot ${epoch}...`);
      
      const [timeslotPda] = blockchainService.getTimeslotPDA(epoch);
      
      // Check if already exists
      const existingAccount = await this.connection.getAccountInfo(timeslotPda);
      if (existingAccount) {
        console.log(`✅ Timeslot ${epoch} already exists`);
        return 'already_exists';
      }

      const now = Math.floor(Date.now() / 1000);
      const timeslotData = serialize(
        new Map([
          [CreateTimeslotArgs, {
            kind: 'struct',
            fields: [
              ['epoch', 'u64'],
              ['totalEnergy', 'u64'],
              ['startTime', 'i64'],
              ['endTime', 'i64']
            ]
          }]
        ]),
        new CreateTimeslotArgs({
          epoch,
          totalEnergy,
          startTime: now,
          endTime: now + 3600 // 1 hour from now
        })
      );

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: timeslotPda, isSigner: false, isWritable: true },
          { pubkey: this.wallet!.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId: this.programId,
        data: Buffer.concat([
          Buffer.from([1]), // CreateTimeslot instruction discriminator
          timeslotData
        ])
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = this.wallet!.publicKey;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      // Sign and send transaction
      transaction.sign(this.wallet!);
      const signature = await this.connection.sendTransaction(transaction, [this.wallet!]);
      
      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log(`✅ Timeslot ${epoch} created: ${signature}`);
      return signature;
      
    } catch (error) {
      logger.error(`Failed to create timeslot ${epoch}:`, error);
      throw error;
    }
  }

  /**
   * Initialize contract with test data
   */
  async initializeContract(): Promise<void> {
    console.log('🚀 Starting contract initialization...');
    console.log(`📍 Program ID: ${this.programId.toString()}`);
    console.log(`📍 Admin Wallet: ${this.wallet!.publicKey.toString()}`);
    console.log('='.repeat(60));

    try {
      // Step 1: Initialize global state
      const globalStateResult = await this.initializeGlobalState();
      if (globalStateResult !== 'already_initialized') {
        console.log(`🔗 View transaction: https://explorer.solana.com/tx/${globalStateResult}?cluster=devnet`);
      }

      // Step 2: Create test timeslots
      const testTimeslots = [
        { epoch: 1725432000, totalEnergy: 1000 },
        { epoch: 1725435600, totalEnergy: 1500 },
        { epoch: 1725439200, totalEnergy: 2000 }
      ];

      for (const timeslot of testTimeslots) {
        const result = await this.createTimeslot(timeslot.epoch, timeslot.totalEnergy);
        if (result !== 'already_exists') {
          console.log(`🔗 View transaction: https://explorer.solana.com/tx/${result}?cluster=devnet`);
        }
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('\n' + '='.repeat(60));
      console.log('🎉 Contract initialization complete!');
      console.log('✅ Global state initialized');
      console.log(`✅ ${testTimeslots.length} test timeslots created`);
      console.log('\n📋 Test Timeslots:');
      testTimeslots.forEach(ts => {
        console.log(`   • Epoch ${ts.epoch}: ${ts.totalEnergy} kWh`);
      });
      console.log('\n🧪 You can now run transaction tests with these timeslots');
      
    } catch (error) {
      console.error('💥 Contract initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check contract state
   */
  async checkContractState(): Promise<void> {
    console.log('🔍 Checking contract state...');
    
    try {
      // Check global state
      const [globalStatePda] = blockchainService.getGlobalStatePDA();
      const globalStateAccount = await this.connection.getAccountInfo(globalStatePda);
      
      console.log(`📊 Global State: ${globalStateAccount ? '✅ Exists' : '❌ Not found'}`);
      
      if (globalStateAccount) {
        console.log(`   📏 Data Length: ${globalStateAccount.data.length} bytes`);
        console.log(`   👤 Owner: ${globalStateAccount.owner.toString()}`);
      }

      // Check test timeslots
      const testEpochs = [1725432000, 1725435600, 1725439200];
      
      for (const epoch of testEpochs) {
        const [timeslotPda] = blockchainService.getTimeslotPDA(epoch);
        const timeslotAccount = await this.connection.getAccountInfo(timeslotPda);
        
        console.log(`📊 Timeslot ${epoch}: ${timeslotAccount ? '✅ Exists' : '❌ Not found'}`);
        
        if (timeslotAccount) {
          console.log(`   📏 Data Length: ${timeslotAccount.data.length} bytes`);
        }
      }
      
    } catch (error) {
      console.error('Failed to check contract state:', error);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'init';

  const initializer = new ContractInitializer();

  try {
    switch (command) {
      case 'init':
        await initializer.initializeContract();
        break;
      case 'check':
        await initializer.checkContractState();
        break;
      default:
        console.log('Usage: bun run initialize-contract.ts [init|check]');
        console.log('  init  - Initialize contract with global state and test timeslots');
        console.log('  check - Check current contract state');
        process.exit(1);
    }
  } catch (error) {
    console.error('💥 Command failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.main) {
  main().catch(console.error);
}

export { ContractInitializer };
