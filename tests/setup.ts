import { beforeAll, afterAll } from '@jest/globals';

beforeAll(async () => {
  // Test setup - database connections, etc.
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Test cleanup
});
