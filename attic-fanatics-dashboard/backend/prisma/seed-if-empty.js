const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count === 0) {
    console.log('Database is empty — running seed...');
    execSync('node prisma/seed.js', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('Seed complete.');
  } else {
    console.log(`Database already has ${count} user(s) — skipping seed.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
