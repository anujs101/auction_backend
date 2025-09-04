import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample timeslots
  const now = new Date();
  const timeslot1 = await prisma.timeslot.create({
    data: {
      startTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      totalEnergy: 1000,
      status: 'OPEN'
    }
  });

  const timeslot2 = await prisma.timeslot.create({
    data: {
      startTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
      endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
      totalEnergy: 1500,
      status: 'OPEN'
    }
  });

  console.log('✅ Created timeslots:', { timeslot1: timeslot1.id, timeslot2: timeslot2.id });

  // Create sample users (wallet addresses)
  const user1 = await prisma.user.create({
    data: {
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      walletAddress: 'BzQzP8J9vKzKvKzKvKzKvKzKvKzKvKzKvKzKvKzKvKzK'
    }
  });

  console.log('✅ Created users:', { user1: user1.id, user2: user2.id });

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
