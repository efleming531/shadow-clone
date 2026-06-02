const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('Database is empty — running base seed...');
    execSync('node prisma/seed.js', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('Base seed complete.');
  } else {
    console.log(`Database already has ${userCount} user(s) — skipping base seed.`);
  }

  const leadCount = await prisma.lead.count().catch(() => 0);
  if (leadCount === 0) {
    console.log('Forge models empty — running forge seed...');
    execSync('node prisma/seed-forge.js', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('Forge seed complete.');
  } else {
    console.log(`Forge models already seeded (${leadCount} leads) — skipping.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
