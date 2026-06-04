const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  { slug: 'NEW',           label: 'New Lead',      color: 'blue',   order: 0, isWon: false, isLost: false },
  { slug: 'CONTACTED',     label: 'Contacted',     color: 'purple', order: 1, isWon: false, isLost: false },
  { slug: 'QUALIFIED',     label: 'Qualified',     color: 'yellow', order: 2, isWon: false, isLost: false },
  { slug: 'ESTIMATE_SENT', label: 'Estimate Sent', color: 'orange', order: 3, isWon: false, isLost: false },
  { slug: 'NEGOTIATING',   label: 'Negotiating',   color: 'red',    order: 4, isWon: false, isLost: false },
  { slug: 'WON',           label: 'Won',           color: 'green',  order: 5, isWon: true,  isLost: false },
  { slug: 'LOST',          label: 'Lost',          color: 'gray',   order: 6, isWon: false, isLost: true  },
  { slug: 'UNQUALIFIED',   label: 'Unqualified',   color: 'gray',   order: 7, isWon: false, isLost: true  },
];

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

  const stageCount = await prisma.pipelineStage.count().catch(() => 0);
  if (stageCount === 0) {
    console.log('Seeding default pipeline stages...');
    for (const s of DEFAULT_STAGES) {
      await prisma.pipelineStage.upsert({ where: { slug: s.slug }, create: s, update: {} });
    }
    console.log('Pipeline stages seeded.');
  } else {
    console.log(`Pipeline stages already seeded (${stageCount}) — skipping.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
