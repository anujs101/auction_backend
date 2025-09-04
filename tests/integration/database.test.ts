import { prismaService } from '@/database/prisma.service';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await prismaService.connect();
  });

  afterAll(async () => {
    await prismaService.disconnect();
  });

  describe('Health Check', () => {
    it('should perform database health check', async () => {
      const result = await prismaService.healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.latency).toBeGreaterThan(0);
    });
  });

  describe('User Operations', () => {
    const testWallet = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

    it('should create and find user by wallet', async () => {
      // Clean up any existing test user
      await prismaService.client.user.deleteMany({
        where: { walletAddress: testWallet }
      });

      const user = await prismaService.createUser(testWallet);
      expect(user.walletAddress).toBe(testWallet);
      expect(user.id).toBeDefined();

      const foundUser = await prismaService.findUserByWallet(testWallet);
      expect(foundUser?.walletAddress).toBe(testWallet);
    });
  });

  describe('Auth Nonce Operations', () => {
    const testWallet = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
    const testNonce = 'test-nonce-12345';

    it('should create and find valid nonce', async () => {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      
      const nonce = await prismaService.createAuthNonce(testWallet, testNonce, expiresAt);
      expect(nonce.nonce).toBe(testNonce);
      expect(nonce.walletAddress).toBe(testWallet);

      const foundNonce = await prismaService.findValidNonce(testNonce);
      expect(foundNonce?.nonce).toBe(testNonce);
      expect(foundNonce?.usedAt).toBeNull();
    });

    it('should mark nonce as used', async () => {
      const foundNonce = await prismaService.findValidNonce(testNonce);
      if (foundNonce) {
        await prismaService.markNonceAsUsed(foundNonce.id);
        
        const usedNonce = await prismaService.findValidNonce(testNonce);
        expect(usedNonce).toBeNull(); // Should not find used nonce
      }
    });
  });
});
