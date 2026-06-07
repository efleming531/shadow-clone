const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const SOURCES = [
  { name: 'Google Ads', slug: 'google-ads' },
  { name: 'Facebook/Instagram', slug: 'facebook-instagram' },
  { name: 'TikTok', slug: 'tiktok' },
  { name: 'Organic', slug: 'organic' },
  { name: 'Referrals', slug: 'referrals' },
];

const SOURCE_CONFIG = {
  'google-ads':        { adSpendDay: [400, 800],  impressions: [8000, 18000], ctr: [0.03, 0.07], leadRate: [0.08, 0.15], quality: 'HOT' },
  'facebook-instagram':{ adSpendDay: [200, 500],  impressions: [15000, 35000], ctr: [0.015, 0.04], leadRate: [0.05, 0.10], quality: 'WARM' },
  'tiktok':            { adSpendDay: [100, 300],  impressions: [20000, 50000], ctr: [0.008, 0.025], leadRate: [0.03, 0.07], quality: 'WARM' },
  'organic':           { adSpendDay: [0, 0],      impressions: [500, 2000],   ctr: [0.05, 0.12], leadRate: [0.15, 0.30], quality: 'HOT' },
  'referrals':         { adSpendDay: [0, 0],      impressions: [0, 0],        ctr: [0, 0],       leadRate: [0, 0],       quality: 'HOT' },
};

function generateFunnelRow(sourceId, date, config, adminId) {
  const adSpend = rand(...config.adSpendDay);
  const impressions = config.impressions[1] > 0 ? randInt(...config.impressions) : 0;
  const clicks = impressions > 0 ? Math.floor(impressions * rand(...config.ctr)) : 0;

  let leadsGenerated;
  if (config.slug === 'referrals') {
    leadsGenerated = randInt(1, 5);
  } else {
    leadsGenerated = clicks > 0 ? Math.floor(clicks * rand(...config.leadRate)) : randInt(0, 3);
  }

  const formCompletions = Math.floor(leadsGenerated * rand(0.6, 0.85));
  const callsBooked = Math.floor(leadsGenerated * rand(0.4, 0.65));
  const callsShowed = Math.floor(callsBooked * rand(0.55, 0.75));
  const callsClosed = Math.floor(callsShowed * rand(0.30, 0.55));
  const avgTicket = rand(2800, 7500);
  const revenue = callsClosed * avgTicket;
  const cashCollected = revenue * rand(0.6, 0.85);

  return {
    leadSourceId: sourceId,
    date,
    adSpend,
    impressions,
    clicks,
    leadsGenerated,
    formCompletions,
    callsBooked,
    callsShowed,
    callsClosed,
    revenue,
    cashCollected,
    leadQuality: config.quality,
    notes: null,
    createdById: adminId,
  };
}

async function main() {
  console.log('Seeding database...');

  await prisma.callCenterLog.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.funnelData.deleteMany();
  await prisma.callCenterAgent.deleteMany();
  await prisma.salesRep.deleteMany();
  await prisma.user.deleteMany();
  await prisma.leadSource.deleteMany();
  await prisma.apiConnection.deleteMany();

  const adminHash = await bcrypt.hash('AtticAdmin2024!', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Owner',
      email: 'admin@atticfanatics.com',
      passwordHash: adminHash,
      role: 'OWNER',
      lastLogin: new Date(),
    },
  });
  console.log('Created admin user');

  const managerHash = await bcrypt.hash('Manager2024!', 10);
  const manager = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      email: 'sarah@atticfanatics.com',
      passwordHash: managerHash,
      role: 'MANAGER',
    },
  });

  const repNames = [
    { name: 'Mike Torres', email: 'mike@atticfanatics.com' },
    { name: 'Jessica Lee', email: 'jessica@atticfanatics.com' },
    { name: 'David Chen', email: 'david@atticfanatics.com' },
  ];

  const repHash = await bcrypt.hash('Rep2024!', 10);
  const repUsers = await Promise.all(
    repNames.map(r =>
      prisma.user.create({
        data: { name: r.name, email: r.email, passwordHash: repHash, role: 'REP' },
      })
    )
  );

  const agentNames = [
    { name: 'Carlos Rivera', email: 'carlos@atticfanatics.com' },
    { name: 'Amanda Walsh', email: 'amanda@atticfanatics.com' },
  ];

  const agentUsers = await Promise.all(
    agentNames.map(a =>
      prisma.user.create({
        data: { name: a.name, email: a.email, passwordHash: repHash, role: 'REP' },
      })
    )
  );

  const sources = await Promise.all(
    SOURCES.map(s => prisma.leadSource.create({ data: s }))
  );
  console.log('Created lead sources');

  await prisma.apiConnection.createMany({
    data: [
      { provider: 'google-ads', isActive: false },
      { provider: 'meta-ads', isActive: false },
      { provider: 'tiktok-ads', isActive: false },
      { provider: 'workiz-crm', isActive: false },
    ],
  });

  const salesReps = await Promise.all(
    repUsers.map(u =>
      prisma.salesRep.create({ data: { userId: u.id, name: u.name } })
    )
  );

  const callAgents = await Promise.all(
    agentUsers.map(u =>
      prisma.callCenterAgent.create({ data: { userId: u.id, name: u.name } })
    )
  );

  console.log('Generating 90 days of funnel data...');
  const today = new Date();
  const funnelRows = [];

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    date.setHours(12, 0, 0, 0);

    for (const source of sources) {
      const config = { ...SOURCE_CONFIG[source.slug], slug: source.slug };
      funnelRows.push(generateFunnelRow(source.id, date, config, admin.id));
    }
  }

  await prisma.funnelData.createMany({ data: funnelRows });
  console.log(`Created ${funnelRows.length} funnel data rows`);

  console.log('Generating 90 days of deal data...');
  const dealRows = [];
  const sourceIds = sources.map(s => s.id);

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    date.setHours(14, 0, 0, 0);

    const numDeals = randInt(1, 4);
    for (let i = 0; i < numDeals; i++) {
      const rep = pick(salesReps);
      const revenue = rand(2800, 7500);
      dealRows.push({
        salesRepId: rep.id,
        leadSourceId: pick(sourceIds),
        date,
        revenue,
        cashCollected: revenue * rand(0.6, 0.9),
        installed: Math.random() > 0.2,
        referralGenerated: Math.random() > 0.75,
        salesCycleDays: randInt(1, 14),
        notes: null,
      });
    }
  }

  await prisma.deal.createMany({ data: dealRows });
  console.log(`Created ${dealRows.length} deals`);

  console.log('Generating 90 days of call center logs...');
  const callLogs = [];

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    date.setHours(10, 0, 0, 0);

    const numCalls = randInt(8, 25);
    for (let i = 0; i < numCalls; i++) {
      const agent = pick(callAgents);
      const answered = Math.random() > 0.15;
      const qualified = answered && Math.random() > 0.35;
      const booked = qualified && Math.random() > 0.40;

      callLogs.push({
        agentId: agent.id,
        date,
        speedToLeadMinutes: rand(2, 45),
        answered,
        qualified,
        booked,
        notes: null,
      });
    }
  }

  await prisma.callCenterLog.createMany({ data: callLogs });
  console.log(`Created ${callLogs.length} call center logs`);

  // Ensure aevum-roofing SiteConfig exists with correct slug
  await prisma.siteConfig.upsert({
    where: { tenantId: 'aevum-roofing' },
    update: { slug: 'aevum', template: 'aevum-brutalist' },
    create: {
      tenantId: 'aevum-roofing',
      slug: 'aevum',
      template: 'aevum-brutalist',
      heroHeadline: 'READY TO BUILD SOMETHING EXCEPTIONAL?',
      heroSub: "We don't do standard jobs — we build building envelopes that outlast the generation that commissioned them.",
      ctaText: 'Request a Project Assessment',
      tagline: 'Built to Last an Era',
      serviceArea: 'NJ · NY · PA',
    },
  });
  console.log('Upserted aevum-roofing SiteConfig');

  console.log('\nSeed complete!');
  console.log('Login: admin@atticfanatics.com / AtticAdmin2024!');
  console.log('Manager: sarah@atticfanatics.com / Manager2024!');
  console.log('Reps: mike@atticfanatics.com / Rep2024!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
