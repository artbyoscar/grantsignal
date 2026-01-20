import { PrismaClient, FunderType, GrantStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create test organization
  const organization = await prisma.organization.upsert({
    where: { ein: '12-3456789' },
    update: {},
    create: {
      name: 'Global Relief Initiative',
      ein: '12-3456789',
      mission: 'Empowering communities through sustainable development',
    },
  });
  console.log('✅ Created organization:', organization.name);

  // Create sample funders
  const gatesFundation = await prisma.funder.upsert({
    where: { ein: '56-2618866' },
    update: {},
    create: {
      name: 'Gates Foundation',
      ein: '56-2618866',
      type: FunderType.PRIVATE_FOUNDATION,
      totalAssets: 53200000000,
      totalGiving: 5800000000,
      grantSizeMin: 100000,
      grantSizeMax: 10000000,
      grantSizeMedian: 500000,
      website: 'https://www.gatesfoundation.org',
    },
  });
  console.log('✅ Created funder:', gatesFundation.name);

  const kingCounty = await prisma.funder.upsert({
    where: { ein: '91-0000000' },
    update: {},
    create: {
      name: 'King County',
      ein: '91-0000000',
      type: FunderType.LOCAL,
      totalAssets: 250000000,
      totalGiving: 45000000,
      grantSizeMin: 10000,
      grantSizeMax: 500000,
      grantSizeMedian: 75000,
      website: 'https://www.kingcounty.gov',
    },
  });
  console.log('✅ Created funder:', kingCounty.name);

  const washingtonDSHS = await prisma.funder.upsert({
    where: { ein: '91-6001274' },
    update: {},
    create: {
      name: 'Washington State DSHS',
      ein: '91-6001274',
      type: FunderType.STATE,
      totalAssets: 1500000000,
      totalGiving: 350000000,
      grantSizeMin: 25000,
      grantSizeMax: 2000000,
      grantSizeMedian: 150000,
      website: 'https://www.dshs.wa.gov',
    },
  });
  console.log('✅ Created funder:', washingtonDSHS.name);

  // Create sample grants in different pipeline stages
  const prospectGrant = await prisma.grant.upsert({
    where: {
      id: `seed-prospect-${organization.id}`
    },
    update: {},
    create: {
      id: `seed-prospect-${organization.id}`,
      organizationId: organization.id,
      funderId: gatesFundation.id,
      status: GrantStatus.PROSPECT,
      amountRequested: 250000,
      notes: 'Early stage prospect for community health initiative',
    },
  });
  console.log('✅ Created PROSPECT grant');

  const writingGrant = await prisma.grant.upsert({
    where: {
      id: `seed-writing-${organization.id}`
    },
    update: {},
    create: {
      id: `seed-writing-${organization.id}`,
      organizationId: organization.id,
      funderId: kingCounty.id,
      status: GrantStatus.WRITING,
      amountRequested: 75000,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      notes: 'Food security program proposal in progress',
    },
  });
  console.log('✅ Created WRITING grant (deadline in 10 days)');

  const submittedGrant = await prisma.grant.upsert({
    where: {
      id: `seed-submitted-${organization.id}`
    },
    update: {},
    create: {
      id: `seed-submitted-${organization.id}`,
      organizationId: organization.id,
      funderId: washingtonDSHS.id,
      status: GrantStatus.SUBMITTED,
      amountRequested: 150000,
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      notes: 'Mental health services expansion proposal',
    },
  });
  console.log('✅ Created SUBMITTED grant');

  const awardedGrant = await prisma.grant.upsert({
    where: {
      id: `seed-awarded-${organization.id}`
    },
    update: {},
    create: {
      id: `seed-awarded-${organization.id}`,
      organizationId: organization.id,
      funderId: kingCounty.id,
      status: GrantStatus.AWARDED,
      amountRequested: 50000,
      amountAwarded: 50000,
      submittedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      awardedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      endDate: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000), // ~1 year from now
      notes: 'Youth mentorship program - currently active',
    },
  });
  console.log('✅ Created AWARDED grant ($50,000)');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nSummary:');
  console.log('- 1 Organization: Global Relief Initiative');
  console.log('- 3 Funders: Gates Foundation, King County, Washington State DSHS');
  console.log('- 4 Grants: PROSPECT, WRITING, SUBMITTED, AWARDED');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
