import { verify } from '@noble/ed25519';
import bs58 from 'bs58';
import crypto from 'crypto';
import { logger } from '@/utils/logger';
import { WalletError } from '@/utils/errors';

export interface SignatureVerificationResult {
  isValid: boolean;
  publicKey?: string;
  error?: string;
}

export interface NonceMessage {
  message: string;
  nonce: string;
  timestamp: number;
}

export class WalletCrypto {
  /**
   * Generate a secure random nonce for wallet authentication
   */
  generateNonce(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a standardized message for wallet to sign
   */
  createSignMessage(walletAddress: string, nonce: string): string {
    const timestamp = Date.now();
    const message = `Sign this message to authenticate with Auction Platform.

Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;

    return message;
  }

  /**
   * Verify ed25519 signature from Solana wallet
   */
  async verifySignature(
    message: string,
    signature: string,
    publicKey: string
  ): Promise<SignatureVerificationResult> {
    try {
      // Validate inputs
      if (!message || !signature || !publicKey) {
        return {
          isValid: false,
          error: 'Missing required parameters'
        };
      }

      // Decode base58 signature and public key
      let signatureBytes: Uint8Array;
      let publicKeyBytes: Uint8Array;

      try {
        signatureBytes = bs58.decode(signature);
        publicKeyBytes = bs58.decode(publicKey);
      } catch (error) {
        logger.warn('Failed to decode signature or public key:', error);
        return {
          isValid: false,
          error: 'Invalid signature or public key format'
        };
      }

      // Validate signature and public key lengths
      if (signatureBytes.length !== 64) {
        return {
          isValid: false,
          error: 'Invalid signature length'
        };
      }

      if (publicKeyBytes.length !== 32) {
        return {
          isValid: false,
          error: 'Invalid public key length'
        };
      }

      // Convert message to bytes
      const messageBytes = new TextEncoder().encode(message);

      // Verify signature
      const isValid = await verify(signatureBytes, messageBytes, publicKeyBytes);

      if (isValid) {
        logger.info('Wallet signature verified successfully', {
          publicKey: publicKey.substring(0, 8) + '...'
        });
      } else {
        logger.warn('Wallet signature verification failed', {
          publicKey: publicKey.substring(0, 8) + '...'
        });
      }

      return {
        isValid,
        publicKey: isValid ? publicKey : undefined
      };

    } catch (error) {
      logger.error('Error verifying wallet signature:', error);
      return {
        isValid: false,
        error: 'Signature verification failed'
      };
    }
  }

  /**
   * Parse and validate signed message structure
   */
  parseSignedMessage(signedMessage: string): NonceMessage {
    try {
      // Extract nonce and timestamp from the message
      const nonceMatch = signedMessage.match(/Nonce: ([a-f0-9]+)/);
      const timestampMatch = signedMessage.match(/Timestamp: (\d+)/);

      if (!nonceMatch || !timestampMatch) {
        throw new WalletError('Invalid message format');
      }

      const nonce = nonceMatch[1];
      const timestamp = parseInt(timestampMatch[1], 10);

      // Validate timestamp (should be within last 5 minutes)
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - timestamp > fiveMinutes) {
        throw new WalletError('Message timestamp expired');
      }

      return {
        message: signedMessage,
        nonce,
        timestamp
      };

    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new WalletError('Failed to parse signed message');
    }
  }

  /**
   * Validate Solana wallet address format
   */
  isValidSolanaAddress(address: string): boolean {
    try {
      const decoded = bs58.decode(address);
      return decoded.length === 32;
    } catch {
      return false;
    }
  }

  /**
   * Generate expiration time for nonce (5 minutes from now)
   */
  generateNonceExpiration(): Date {
    return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }
}

export const walletCrypto = new WalletCrypto();
