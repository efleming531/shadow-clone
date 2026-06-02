const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('Seeding Forge models...');

  const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  const manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } });
  const reps = await prisma.salesRep.findMany({ include: { user: true } });
  const sources = await prisma.leadSource.findMany();

  if (!owner || !sources.length) {
    console.log('Base seed data not found. Run seed.js first.');
    return;
  }

  const creatorId = owner.id;
  const googleSource = sources.find(s => s.slug === 'google-ads') || sources[0];
  const fbSource = sources.find(s => s.slug === 'facebook-instagram') || sources[0];

  // Materials DB
  console.log('Seeding materials...');
  const materialData = [
    { category: 'Insulation', name: 'Blown-in Fiberglass R-30', unit: 'bag', costPerUnit: 28, markupPct: 45 },
    { category: 'Insulation', name: 'Blown-in Fiberglass R-38', unit: 'bag', costPerUnit: 35, markupPct: 45 },
    { category: 'Insulation', name: 'Spray Foam - Open Cell', unit: 'sq ft', costPerUnit: 1.20, markupPct: 50 },
    { category: 'Insulation', name: 'Spray Foam - Closed Cell', unit: 'sq ft', costPerUnit: 2.10, markupPct: 50 },
    { category: 'Vapor Barrier', name: 'Poly Film 6-mil', unit: 'roll', costPerUnit: 85, markupPct: 40 },
    { category: 'Vapor Barrier', name: 'Reinforced Vapor Barrier', unit: 'sq ft', costPerUnit: 0.65, markupPct: 40 },
    { category: 'Rodent Exclusion', name: 'Steel Wool Mesh', unit: 'lb', costPerUnit: 12, markupPct: 60 },
    { category: 'Rodent Exclusion', name: 'Hardware Cloth 1/4"', unit: 'roll', costPerUnit: 55, markupPct: 55 },
    { category: 'Rodent Exclusion', name: 'Expandable Foam Sealant', unit: 'can', costPerUnit: 8, markupPct: 60 },
    { category: 'Ventilation', name: 'Ridge Vent 10ft', unit: 'piece', costPerUnit: 45, markupPct: 40 },
    { category: 'Ventilation', name: 'Soffit Vent 16x8', unit: 'piece', costPerUnit: 18, markupPct: 40 },
    { category: 'Ventilation', name: 'Attic Fan Solar', unit: 'unit', costPerUnit: 280, markupPct: 35 },
    { category: 'Labor', name: 'Technician Hour', unit: 'hour', costPerUnit: 65, markupPct: 30 },
    { category: 'Labor', name: 'Lead Tech Hour', unit: 'hour', costPerUnit: 85, markupPct: 25 },
    { category: 'Cleanup', name: 'Debris Disposal Bag', unit: 'bag', costPerUnit: 15, markupPct: 40 },
  ];

  for (const m of materialData) {
    await prisma.materialsDB.upsert({
      where: { id: `mat-${m.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: m,
      create: { id: `mat-${m.name.replace(/\s+/g, '-').toLowerCase()}`, ...m },
    }).catch(() => prisma.materialsDB.create({ data: m }));
  }

  // Membership Plans
  console.log('Seeding membership plans...');
  const basicPlan = await prisma.membershipPlan.upsert({
    where: { id: 'plan-basic' },
    update: {},
    create: {
      id: 'plan-basic',
      name: 'Attic Shield Basic',
      price: 29,
      billingCycle: 'MONTHLY',
      features: ['Annual attic inspection', 'Priority scheduling', '10% off services', 'Rodent alert monitoring'],
    },
  }).catch(() => prisma.membershipPlan.findFirst({ where: { name: 'Attic Shield Basic' } }));

  const premiumPlan = await prisma.membershipPlan.upsert({
    where: { id: 'plan-premium' },
    update: {},
    create: {
      id: 'plan-premium',
      name: 'Attic Shield Premium',
      price: 299,
      billingCycle: 'ANNUAL',
      features: ['Bi-annual inspection', 'Emergency same-day service', '20% off all services', 'Rodent monitoring + traps', 'Free minor repairs'],
    },
  }).catch(() => prisma.membershipPlan.findFirst({ where: { name: 'Attic Shield Premium' } }));

  // Commission Rules
  console.log('Seeding commission rules...');
  await prisma.commissionRule.upsert({
    where: { id: 'rule-rep-pct' },
    update: {},
    create: {
      id: 'rule-rep-pct',
      name: 'Standard Rep Commission',
      roleTarget: 'REP',
      type: 'PERCENTAGE',
      rate: 0.08,
      bonusThreshold: 15000,
      bonusRate: 0.02,
    },
  }).catch(async () => {
    const exists = await prisma.commissionRule.findFirst({ where: { name: 'Standard Rep Commission' } });
    if (!exists) await prisma.commissionRule.create({
      data: {
        name: 'Standard Rep Commission',
        roleTarget: 'REP',
        type: 'PERCENTAGE',
        rate: 0.08,
        bonusThreshold: 15000,
        bonusRate: 0.02,
      },
    });
  });

  await prisma.commissionRule.upsert({
    where: { id: 'rule-mgr-flat' },
    update: {},
    create: {
      id: 'rule-mgr-flat',
      name: 'Manager Override',
      roleTarget: 'MANAGER',
      type: 'PERCENTAGE',
      rate: 0.02,
    },
  }).catch(async () => {
    const exists = await prisma.commissionRule.findFirst({ where: { name: 'Manager Override' } });
    if (!exists) await prisma.commissionRule.create({
      data: { name: 'Manager Override', roleTarget: 'MANAGER', type: 'PERCENTAGE', rate: 0.02 },
    });
  });

  // Alert Rules
  console.log('Seeding alert rules...');
  const alertRulesData = [
    { name: 'CPL Too High', metric: 'cpl', condition: 'above', threshold: 150, period: 'daily' },
    { name: 'Daily Revenue Low', metric: 'revenue', condition: 'below', threshold: 5000, period: 'daily' },
    { name: 'Close Rate Drop', metric: 'close_rate', condition: 'below', threshold: 0.25, period: 'daily' },
  ];

  for (const ar of alertRulesData) {
    const exists = await prisma.alertRule.findFirst({ where: { name: ar.name } });
    if (!exists) await prisma.alertRule.create({ data: ar });
  }

  // SOPs
  console.log('Seeding SOPs...');
  const sopData = [
    {
      title: 'New Lead Response Protocol',
      category: 'Sales',
      content: `# New Lead Response Protocol\n\n## Overview\nAll new leads must be contacted within 5 minutes of submission.\n\n## Steps\n1. Receive lead notification in CRM\n2. Call the lead immediately\n3. If no answer, send SMS within 2 minutes\n4. Schedule a follow-up call for 1 hour later\n5. Update lead stage to CONTACTED in the system\n\n## Script\n"Hi [Name], this is [Rep] from Attic Fanatics. I saw you reached out about your attic — I'm calling to schedule your free inspection. Does this week work for you?"\n\n## Key Metrics\n- Target: < 5 min speed to lead\n- Minimum 3 contact attempts before marking unreachable`,
    },
    {
      title: 'Attic Inspection Checklist',
      category: 'Operations',
      content: `# Attic Inspection Checklist\n\n## Pre-Inspection\n- [ ] Review job order and customer notes\n- [ ] Load truck with basic materials and tools\n- [ ] Confirm appointment with customer 30 min before\n\n## During Inspection\n- [ ] Check insulation R-value and coverage\n- [ ] Inspect for moisture, mold, or water damage\n- [ ] Check ventilation (soffit, ridge vents)\n- [ ] Look for rodent entry points and evidence\n- [ ] Document with photos (minimum 10)\n- [ ] Check air sealing around penetrations\n\n## Post-Inspection\n- [ ] Review findings with homeowner\n- [ ] Present estimate on tablet\n- [ ] Email detailed report with photos\n- [ ] Update job status in system`,
    },
    {
      title: 'Estimate Presentation Guide',
      category: 'Sales',
      content: `# Estimate Presentation Guide\n\n## Preparation\nAlways build the estimate in the system before the appointment. Know your numbers.\n\n## The Presentation\n1. **Problem First**: Show photos, explain what you found\n2. **Consequences**: What happens if not addressed (health, energy, pests)\n3. **Solution**: Walk through the recommended work\n4. **Investment**: Present the estimate — lead with value, not price\n\n## Handling Objections\n- "Too expensive": Break into payment options\n- "Need to think about it": Ask what questions they have\n- "Getting other quotes": Emphasize our warranty and experience\n\n## Closing\nAlways ask for the decision before leaving: "Can we get this scheduled for you?"`,
    },
    {
      title: 'Job Completion & QC Process',
      category: 'Operations',
      content: `# Job Completion & Quality Control\n\n## Before Leaving the Job\n- [ ] Walk through work with customer\n- [ ] Take before/after photos\n- [ ] Clean up all debris\n- [ ] Leave the space cleaner than you found it\n- [ ] Collect payment or confirm financing\n- [ ] Ask for Google review on the spot\n\n## In the System\n- [ ] Mark job as COMPLETED\n- [ ] Enter actual revenue and cash collected\n- [ ] Upload photos to job record\n- [ ] Update customer record\n- [ ] Trigger referral ask sequence\n\n## Follow-Up\n- Send thank-you text within 2 hours\n- Call 3 days later to confirm satisfaction\n- Send review request email at day 7`,
    },
  ];

  for (const sop of sopData) {
    const exists = await prisma.sOP.findFirst({ where: { title: sop.title } });
    if (!exists) await prisma.sOP.create({ data: { ...sop, createdById: creatorId } });
  }

  // Leads (CRM)
  console.log('Seeding leads...');
  const repIds = reps.map(r => r.id);
  const getRepId = (i) => repIds.length > 0 ? repIds[i % repIds.length] : null;

  const leadData = [
    { name: 'Robert Martinez', phone: '973-555-0101', email: 'rmartinez@email.com', city: 'Newark', state: 'NJ', zip: '07102', stage: 'NEW', estimatedValue: 3200, sourceId: googleSource.id, daysAgoCreated: 0 },
    { name: 'Patricia Johnson', phone: '201-555-0102', email: 'pjohnson@email.com', city: 'Jersey City', state: 'NJ', zip: '07302', stage: 'CONTACTED', estimatedValue: 4800, sourceId: fbSource.id, daysAgoCreated: 2 },
    { name: 'Thomas Williams', phone: '732-555-0103', email: 'twilliams@email.com', city: 'Edison', state: 'NJ', zip: '08817', stage: 'QUALIFIED', estimatedValue: 6500, sourceId: googleSource.id, daysAgoCreated: 4, repIdx: 0 },
    { name: 'Sandra Davis', phone: '908-555-0104', email: 'sdavis@email.com', city: 'Elizabeth', state: 'NJ', zip: '07201', stage: 'ESTIMATE_SENT', estimatedValue: 8200, sourceId: googleSource.id, daysAgoCreated: 6, repIdx: 1 },
    { name: 'James Wilson', phone: '609-555-0105', email: 'jwilson@email.com', city: 'Trenton', state: 'NJ', zip: '08601', stage: 'NEGOTIATING', estimatedValue: 12000, sourceId: fbSource.id, daysAgoCreated: 10, repIdx: 0 },
    { name: 'Linda Anderson', phone: '856-555-0106', email: 'landerson@email.com', city: 'Cherry Hill', state: 'NJ', zip: '08002', stage: 'WON', estimatedValue: 9500, sourceId: googleSource.id, daysAgoCreated: 15, repIdx: 1 },
    { name: 'Charles Thompson', phone: '973-555-0107', email: 'cthompson@email.com', city: 'Paterson', state: 'NJ', zip: '07501', stage: 'WON', estimatedValue: 7200, sourceId: fbSource.id, daysAgoCreated: 20, repIdx: 0 },
    { name: 'Barbara Garcia', phone: '201-555-0108', email: 'bgarcia@email.com', city: 'Hoboken', state: 'NJ', zip: '07030', stage: 'LOST', estimatedValue: 5000, sourceId: googleSource.id, daysAgoCreated: 25, repIdx: 1 },
    { name: 'Christopher Lee', phone: '732-555-0109', email: 'clee@email.com', city: 'New Brunswick', state: 'NJ', zip: '08901', stage: 'CONTACTED', estimatedValue: 4200, sourceId: fbSource.id, daysAgoCreated: 1, repIdx: 0 },
    { name: 'Susan Taylor', phone: '908-555-0110', email: 'staylor@email.com', city: 'Woodbridge', state: 'NJ', zip: '07095', stage: 'QUALIFIED', estimatedValue: 7800, sourceId: googleSource.id, daysAgoCreated: 5, repIdx: 1 },
    { name: 'Daniel Martinez', phone: '914-555-0111', email: 'dmartinez@email.com', city: 'Yonkers', state: 'NY', zip: '10701', stage: 'ESTIMATE_SENT', estimatedValue: 11000, sourceId: googleSource.id, daysAgoCreated: 7, repIdx: 0 },
    { name: 'Karen White', phone: '718-555-0112', email: 'kwhite@email.com', city: 'Bronx', state: 'NY', zip: '10451', stage: 'NEW', estimatedValue: 3800, sourceId: fbSource.id, daysAgoCreated: 0 },
    { name: 'Matthew Harris', phone: '610-555-0113', email: 'mharris@email.com', city: 'Philadelphia', state: 'PA', zip: '19101', stage: 'QUALIFIED', estimatedValue: 5500, sourceId: googleSource.id, daysAgoCreated: 3, repIdx: 1 },
    { name: 'Nancy Jackson', phone: '215-555-0114', email: 'njackson@email.com', city: 'Allentown', state: 'PA', zip: '18101', stage: 'WON', estimatedValue: 8900, sourceId: googleSource.id, daysAgoCreated: 30, repIdx: 0 },
    { name: 'Andrew Martin', phone: '973-555-0115', email: 'amartin@email.com', city: 'Clifton', state: 'NJ', zip: '07011', stage: 'UNQUALIFIED', estimatedValue: 1500, sourceId: fbSource.id, daysAgoCreated: 18 },
  ];

  const createdLeads = [];
  for (const ld of leadData) {
    const lead = await prisma.lead.create({
      data: {
        name: ld.name,
        phone: ld.phone,
        email: ld.email,
        city: ld.city,
        state: ld.state,
        zip: ld.zip,
        leadSourceId: ld.sourceId,
        stage: ld.stage,
        assignedRepId: ld.repIdx !== undefined ? getRepId(ld.repIdx) : null,
        estimatedValue: ld.estimatedValue,
        createdAt: daysAgo(ld.daysAgoCreated),
      },
    });

    await prisma.leadStageHistory.create({
      data: { leadId: lead.id, toStage: 'NEW', changedById: creatorId, changedAt: daysAgo(ld.daysAgoCreated) },
    });

    if (ld.stage !== 'NEW') {
      await prisma.leadStageHistory.create({
        data: { leadId: lead.id, fromStage: 'NEW', toStage: ld.stage, changedById: creatorId, changedAt: daysAgo(Math.max(0, ld.daysAgoCreated - 2)) },
      });
    }

    createdLeads.push(lead);
  }

  // Customers (from won leads)
  console.log('Seeding customers...');
  const wonLeads = createdLeads.filter((l, i) => leadData[i].stage === 'WON');
  const createdCustomers = [];

  for (const lead of wonLeads) {
    const leadInfo = leadData[createdLeads.indexOf(lead)];
    const customer = await prisma.customer.create({
      data: {
        name: lead.name,
        phone: leadInfo.phone,
        email: leadInfo.email,
        city: leadInfo.city,
        state: leadInfo.state,
        zip: leadInfo.zip,
        leadId: lead.id,
      },
    });
    createdCustomers.push({ customer, lead: leadInfo });
  }

  // Jobs
  console.log('Seeding jobs...');
  const serviceTypes = ['Blown-in Insulation', 'Rodent Exclusion + Cleanup', 'Full Attic Restoration', 'Vapor Barrier Install', 'Air Sealing'];

  if (createdCustomers.length > 0) {
    for (let i = 0; i < createdCustomers.length; i++) {
      const { customer } = createdCustomers[i];
      const repId = getRepId(i);
      const statuses = ['COMPLETED', 'COMPLETED', 'SCHEDULED', 'IN_PROGRESS'];
      const status = statuses[i % statuses.length];

      await prisma.job.create({
        data: {
          jobNumber: `JOB-${1000 + i}`,
          customerId: customer.id,
          assignedRepId: repId,
          status,
          serviceType: serviceTypes[i % serviceTypes.length],
          scheduledDate: daysAgo(i * 5 - 3),
          completedDate: status === 'COMPLETED' ? daysAgo(i * 5) : null,
          totalRevenue: 5000 + i * 1500,
          cashCollected: status === 'COMPLETED' ? 5000 + i * 1500 : 0,
          description: `${serviceTypes[i % serviceTypes.length]} for ${customer.name}`,
        },
      });
    }
  }

  // Reviews
  console.log('Seeding reviews...');
  const reviewData = [
    { platform: 'Google', rating: 5, text: 'Amazing service! The team was professional and thorough. Our attic is transformed.', days: 5 },
    { platform: 'Google', rating: 5, text: "Best decision we made. No more rodent issues and the insulation work is top notch.", days: 12 },
    { platform: 'Google', rating: 4, text: 'Great work overall. Minor scheduling delay but the results are excellent.', days: 18 },
    { platform: 'Yelp', rating: 5, text: 'Completely exceeded expectations. They found entry points we had no idea about.', days: 22 },
    { platform: 'Yelp', rating: 5, text: 'Worth every penny. Our energy bills dropped noticeably after the insulation upgrade.', days: 30 },
    { platform: 'Google', rating: 3, text: 'Work was good but communication could be better. Final result was satisfactory.', days: 35, responded: true, response: 'Thank you for the feedback! We take communication seriously and are working to improve. Glad the work met your expectations.' },
    { platform: 'Facebook', rating: 5, text: 'Hired them for rodent exclusion and full cleanup. Crew was respectful and efficient.', days: 40 },
    { platform: 'Google', rating: 5, text: 'Second time using Attic Fanatics. Always reliable, always excellent quality.', days: 45 },
    { platform: 'Google', rating: 4, text: 'Professional team, fair pricing. Would recommend to anyone dealing with attic issues.', days: 50 },
    { platform: 'Yelp', rating: 2, text: 'Had some issues with the initial estimate vs final price.', days: 55, responded: true, response: 'We sincerely apologize for the pricing discrepancy. We have reached out to make this right and have updated our estimate process.' },
  ];

  for (let i = 0; i < reviewData.length; i++) {
    const rv = reviewData[i];
    const customerId = createdCustomers.length > 0 ? createdCustomers[i % createdCustomers.length].customer.id : null;
    await prisma.review.create({
      data: {
        customerId,
        platform: rv.platform,
        rating: rv.rating,
        reviewText: rv.text,
        reviewDate: daysAgo(rv.days),
        responded: rv.responded || false,
        responseText: rv.response || null,
      },
    });
  }

  // Estimates
  console.log('Seeding estimates...');
  const estimateLeads = createdLeads.filter((l, i) => ['ESTIMATE_SENT', 'NEGOTIATING', 'WON'].includes(leadData[i].stage));

  for (let i = 0; i < estimateLeads.length; i++) {
    const lead = estimateLeads[i];
    const lineItems = [
      { description: 'Blown-in Insulation R-38', qty: 12, unit: 'bag', unitPrice: 50.75, total: 609 },
      { description: 'Rodent Entry Point Sealing', qty: 6, unit: 'hour', unitPrice: 110, total: 660 },
      { description: 'Debris Removal & Cleanup', qty: 1, unit: 'job', unitPrice: 350, total: 350 },
    ];
    const subtotal = lineItems.reduce((s, l) => s + l.total, 0);

    await prisma.estimate.create({
      data: {
        leadId: lead.id,
        number: `EST-${1000 + i}`,
        status: i === 0 ? 'SENT' : i === 1 ? 'ACCEPTED' : 'DRAFT',
        lineItems,
        subtotal,
        tax: 0,
        discount: 0,
        total: subtotal,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdById: creatorId,
      },
    });
  }

  // Memberships
  console.log('Seeding memberships...');
  if (createdCustomers.length >= 2 && basicPlan && premiumPlan) {
    await prisma.membership.create({
      data: {
        customerId: createdCustomers[0].customer.id,
        planId: basicPlan.id,
        status: 'ACTIVE',
        startDate: daysAgo(60),
        renewalDate: daysAgo(-30),
      },
    });

    await prisma.membership.create({
      data: {
        customerId: createdCustomers[1].customer.id,
        planId: premiumPlan.id,
        status: 'ACTIVE',
        startDate: daysAgo(90),
        renewalDate: daysAgo(-275),
      },
    });
  }

  // Commission Payouts
  console.log('Seeding commission payouts...');
  const commissionRule = await prisma.commissionRule.findFirst({ where: { name: 'Standard Rep Commission' } });
  const deals = await prisma.deal.findMany({ take: 5, include: { salesRep: true } });

  if (commissionRule && deals.length > 0) {
    for (const deal of deals.slice(0, 3)) {
      const exists = await prisma.commissionPayout.findUnique({ where: { dealId: deal.id } });
      if (!exists) {
        await prisma.commissionPayout.create({
          data: {
            salesRepId: deal.salesRepId,
            ruleId: commissionRule.id,
            dealId: deal.id,
            amount: deal.revenue * commissionRule.rate,
            status: deals.indexOf(deal) === 0 ? 'PAID' : 'PENDING',
            period: new Date(deal.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            paidAt: deals.indexOf(deal) === 0 ? daysAgo(5) : null,
          },
        });
      }
    }
  }

  // Territory Data
  console.log('Seeding territory data...');
  const territoryData = [
    { zipCode: '07102', city: 'Newark', state: 'NJ', dealCount: 14, revenue: 87500, leadCount: 28 },
    { zipCode: '07302', city: 'Jersey City', state: 'NJ', dealCount: 11, revenue: 72000, leadCount: 22 },
    { zipCode: '08817', city: 'Edison', state: 'NJ', dealCount: 9, revenue: 61000, leadCount: 18 },
    { zipCode: '07501', city: 'Paterson', state: 'NJ', dealCount: 8, revenue: 52000, leadCount: 16 },
    { zipCode: '07201', city: 'Elizabeth', state: 'NJ', dealCount: 12, revenue: 78000, leadCount: 24 },
    { zipCode: '08002', city: 'Cherry Hill', state: 'NJ', dealCount: 7, revenue: 49000, leadCount: 14 },
    { zipCode: '08901', city: 'New Brunswick', state: 'NJ', dealCount: 6, revenue: 41000, leadCount: 12 },
    { zipCode: '07030', city: 'Hoboken', state: 'NJ', dealCount: 4, revenue: 31000, leadCount: 9 },
    { zipCode: '10701', city: 'Yonkers', state: 'NY', dealCount: 5, revenue: 38000, leadCount: 10 },
    { zipCode: '10451', city: 'Bronx', state: 'NY', dealCount: 3, revenue: 22000, leadCount: 7 },
    { zipCode: '19101', city: 'Philadelphia', state: 'PA', dealCount: 4, revenue: 29000, leadCount: 8 },
    { zipCode: '18101', city: 'Allentown', state: 'PA', dealCount: 3, revenue: 21000, leadCount: 6 },
  ];

  for (const td of territoryData) {
    await prisma.territoryData.upsert({
      where: { zipCode: td.zipCode },
      update: { dealCount: td.dealCount, revenue: td.revenue, leadCount: td.leadCount },
      create: td,
    });
  }

  console.log('Forge seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
