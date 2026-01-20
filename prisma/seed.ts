import {
  PrismaClient,
  FunderType,
  GrantStatus,
  CommitmentType,
  CommitmentStatus,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================================================
  // 1. CREATE TEST ORGANIZATION
  // ============================================================================
  const organization = await prisma.organization.upsert({
    where: { ein: '12-3456789' },
    update: {
      name: 'Global Relief Initiative',
      mission: 'Empowering communities worldwide through sustainable development programs',
    },
    create: {
      name: 'Global Relief Initiative',
      ein: '12-3456789',
      mission: 'Empowering communities worldwide through sustainable development programs',
    },
  });
  console.log('✅ Created organization:', organization.name);

  // ============================================================================
  // 2. CREATE ORGANIZATION USER
  // ============================================================================
  const orgUser = await prisma.organizationUser.upsert({
    where: {
      organizationId_clerkUserId: {
        organizationId: organization.id,
        clerkUserId: 'user_test_123',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      clerkUserId: 'user_test_123',
      role: UserRole.OWNER,
    },
  });
  console.log('✅ Created organization user link for:', orgUser.clerkUserId);

  // ============================================================================
  // 3. CREATE PROGRAMS
  // ============================================================================
  const youthProgram = await prisma.program.upsert({
    where: { id: `seed-youth-${organization.id}` },
    update: {},
    create: {
      id: `seed-youth-${organization.id}`,
      organizationId: organization.id,
      name: 'Youth Development',
      description:
        'Comprehensive youth development program focusing on education, mentorship, and leadership skills',
      budget: 500000,
      isActive: true,
    },
  });
  console.log('✅ Created program:', youthProgram.name, '- Budget: $500,000');

  const healthProgram = await prisma.program.upsert({
    where: { id: `seed-health-${organization.id}` },
    update: {},
    create: {
      id: `seed-health-${organization.id}`,
      organizationId: organization.id,
      name: 'Community Health',
      description:
        'Community health initiatives including preventive care, wellness programs, and health education',
      budget: 750000,
      isActive: true,
    },
  });
  console.log('✅ Created program:', healthProgram.name, '- Budget: $750,000');

  const economicProgram = await prisma.program.upsert({
    where: { id: `seed-economic-${organization.id}` },
    update: {},
    create: {
      id: `seed-economic-${organization.id}`,
      organizationId: organization.id,
      name: 'Economic Empowerment',
      description:
        'Economic empowerment through job training, microloans, and entrepreneurship support',
      budget: 300000,
      isActive: true,
    },
  });
  console.log('✅ Created program:', economicProgram.name, '- Budget: $300,000');

  // ============================================================================
  // 4. CREATE FUNDERS
  // ============================================================================
  const gatesFoundation = await prisma.funder.upsert({
    where: { ein: '56-2618866' },
    update: {},
    create: {
      name: 'Gates Foundation',
      ein: '56-2618866',
      type: FunderType.PRIVATE_FOUNDATION,
      totalAssets: 53200000000,
      totalGiving: 5000000000,
      grantSizeMin: 100000,
      grantSizeMax: 10000000,
      grantSizeMedian: 500000,
      website: 'https://www.gatesfoundation.org',
    },
  });
  console.log('✅ Created funder:', gatesFoundation.name, '- Total Giving: $5B');

  const fordFoundation = await prisma.funder.upsert({
    where: { ein: '13-1684331' },
    update: {},
    create: {
      name: 'Ford Foundation',
      ein: '13-1684331',
      type: FunderType.PRIVATE_FOUNDATION,
      totalAssets: 16000000000,
      totalGiving: 600000000,
      grantSizeMin: 50000,
      grantSizeMax: 5000000,
      grantSizeMedian: 250000,
      website: 'https://www.fordfoundation.org',
    },
  });
  console.log('✅ Created funder:', fordFoundation.name, '- Total Giving: $600M');

  const kingCounty = await prisma.funder.upsert({
    where: { ein: '91-0000000' },
    update: {},
    create: {
      name: 'King County',
      ein: '91-0000000',
      type: FunderType.LOCAL,
      totalAssets: 250000000,
      totalGiving: 50000000,
      grantSizeMin: 10000,
      grantSizeMax: 500000,
      grantSizeMedian: 75000,
      website: 'https://www.kingcounty.gov',
    },
  });
  console.log('✅ Created funder:', kingCounty.name, '- Total Giving: $50M');

  const washingtonDSHS = await prisma.funder.upsert({
    where: { ein: '91-6001274' },
    update: {},
    create: {
      name: 'Washington State DSHS',
      ein: '91-6001274',
      type: FunderType.STATE,
      totalAssets: 1500000000,
      totalGiving: 200000000,
      grantSizeMin: 25000,
      grantSizeMax: 2000000,
      grantSizeMedian: 150000,
      website: 'https://www.dshs.wa.gov',
    },
  });
  console.log('✅ Created funder:', washingtonDSHS.name, '- Total Giving: $200M');

  const usDeptEducation = await prisma.funder.upsert({
    where: { ein: '52-6000341' },
    update: {},
    create: {
      name: 'U.S. Department of Education',
      ein: '52-6000341',
      type: FunderType.FEDERAL,
      totalAssets: 100000000000,
      totalGiving: 70000000000,
      grantSizeMin: 100000,
      grantSizeMax: 50000000,
      grantSizeMedian: 1000000,
      website: 'https://www.ed.gov',
    },
  });
  console.log('✅ Created funder:', usDeptEducation.name, '- Total Giving: $70B');

  // ============================================================================
  // 5. CREATE SAMPLE GRANTS
  // ============================================================================

  // PROSPECT: Youth STEM Initiative from Gates, $150,000, deadline in 45 days
  const prospectGrant = await prisma.grant.upsert({
    where: { id: `seed-prospect-${organization.id}` },
    update: {},
    create: {
      id: `seed-prospect-${organization.id}`,
      organizationId: organization.id,
      funderId: gatesFoundation.id,
      programId: youthProgram.id,
      status: GrantStatus.PROSPECT,
      amountRequested: 150000,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      notes: 'Youth STEM Initiative - Early stage opportunity identified through foundation research',
    },
  });
  console.log('✅ Created PROSPECT grant: Youth STEM Initiative ($150,000, deadline in 45 days)');

  // RESEARCHING: Community Health Pilot from Ford, $75,000, deadline in 30 days
  const researchingGrant = await prisma.grant.upsert({
    where: { id: `seed-researching-${organization.id}` },
    update: {},
    create: {
      id: `seed-researching-${organization.id}`,
      organizationId: organization.id,
      funderId: fordFoundation.id,
      programId: healthProgram.id,
      status: GrantStatus.RESEARCHING,
      amountRequested: 75000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes:
        'Community Health Pilot - Researching alignment with Ford Foundation health equity priorities',
    },
  });
  console.log('✅ Created RESEARCHING grant: Community Health Pilot ($75,000, deadline in 30 days)');

  // WRITING: After-School Program Expansion from King County, $50,000, deadline in 12 days
  const writingGrant = await prisma.grant.upsert({
    where: { id: `seed-writing-${organization.id}` },
    update: {},
    create: {
      id: `seed-writing-${organization.id}`,
      organizationId: organization.id,
      funderId: kingCounty.id,
      programId: youthProgram.id,
      status: GrantStatus.WRITING,
      amountRequested: 50000,
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      notes:
        'After-School Program Expansion - Proposal in active writing phase, draft due for internal review in 5 days',
    },
  });
  console.log(
    '✅ Created WRITING grant: After-School Program Expansion ($50,000, deadline in 12 days)'
  );

  // SUBMITTED: Workforce Training Grant from WA DSHS, $200,000, submitted 5 days ago
  const submittedGrant = await prisma.grant.upsert({
    where: { id: `seed-submitted-${organization.id}` },
    update: {},
    create: {
      id: `seed-submitted-${organization.id}`,
      organizationId: organization.id,
      funderId: washingtonDSHS.id,
      programId: economicProgram.id,
      status: GrantStatus.SUBMITTED,
      amountRequested: 200000,
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes:
        'Workforce Training Grant - Submitted for workforce development program targeting underemployed adults',
    },
  });
  console.log('✅ Created SUBMITTED grant: Workforce Training Grant ($200,000, submitted 5 days ago)');

  // PENDING: Education Innovation from US DoE, $500,000, additional info requested
  const pendingGrant = await prisma.grant.upsert({
    where: { id: `seed-pending-${organization.id}` },
    update: {},
    create: {
      id: `seed-pending-${organization.id}`,
      organizationId: organization.id,
      funderId: usDeptEducation.id,
      programId: youthProgram.id,
      status: GrantStatus.PENDING,
      amountRequested: 500000,
      submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      notes:
        'Education Innovation - Federal grant pending review, received request for additional budget clarification',
    },
  });
  console.log('✅ Created PENDING grant: Education Innovation ($500,000, additional info requested)');

  // AWARDED: 2024 Community Grant from Ford, $100,000 requested, $85,000 awarded
  const awardedGrant = await prisma.grant.upsert({
    where: { id: `seed-awarded-${organization.id}` },
    update: {},
    create: {
      id: `seed-awarded-${organization.id}`,
      organizationId: organization.id,
      funderId: fordFoundation.id,
      programId: healthProgram.id,
      status: GrantStatus.AWARDED,
      amountRequested: 100000,
      amountAwarded: 85000,
      submittedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      awardedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000),
      notes: '2024 Community Grant - Awarded for community health screening and education program',
    },
  });
  console.log(
    '✅ Created AWARDED grant: 2024 Community Grant ($100,000 requested, $85,000 awarded)'
  );

  // ============================================================================
  // 6. CREATE COMMITMENTS FOR AWARDED GRANT
  // ============================================================================

  const outcomeCommitment = await prisma.commitment.upsert({
    where: { id: `seed-outcome-${awardedGrant.id}` },
    update: {},
    create: {
      id: `seed-outcome-${awardedGrant.id}`,
      organizationId: organization.id,
      grantId: awardedGrant.id,
      type: CommitmentType.OUTCOME_METRIC,
      description: 'Serve 500 youth through health screening and education programs',
      metricName: 'Youth Served',
      metricValue: '500',
      dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      status: CommitmentStatus.IN_PROGRESS,
    },
  });
  console.log('✅ Created OUTCOME_METRIC commitment: Serve 500 youth (due in 6 months)');

  const deliverableCommitment = await prisma.commitment.upsert({
    where: { id: `seed-deliverable-${awardedGrant.id}` },
    update: {},
    create: {
      id: `seed-deliverable-${awardedGrant.id}`,
      organizationId: organization.id,
      grantId: awardedGrant.id,
      type: CommitmentType.DELIVERABLE,
      description: 'Submit quarterly progress report with program metrics and financial summary',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
      status: CommitmentStatus.PENDING,
    },
  });
  console.log('✅ Created DELIVERABLE commitment: Submit quarterly report (due in 3 months)');

  const reportCommitment = await prisma.commitment.upsert({
    where: { id: `seed-report-${awardedGrant.id}` },
    update: {},
    create: {
      id: `seed-report-${awardedGrant.id}`,
      organizationId: organization.id,
      grantId: awardedGrant.id,
      type: CommitmentType.REPORT_DUE,
      description: 'Final evaluation report with impact assessment and lessons learned',
      dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 12 months
      status: CommitmentStatus.PENDING,
    },
  });
  console.log('✅ Created REPORT_DUE commitment: Final evaluation (due in 12 months)');

  // ============================================================================
  // SEED COMPLETE
  // ============================================================================
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Organization:');
  console.log('   • Global Relief Initiative (EIN: 12-3456789)');
  console.log('   • 1 test user linked (user_test_123)');
  console.log('\n🎯 Programs (3):');
  console.log('   • Youth Development - $500,000');
  console.log('   • Community Health - $750,000');
  console.log('   • Economic Empowerment - $300,000');
  console.log('\n💰 Funders (5):');
  console.log('   • Gates Foundation (Private) - $5B giving');
  console.log('   • Ford Foundation (Private) - $600M giving');
  console.log('   • King County (Local) - $50M giving');
  console.log('   • Washington State DSHS (State) - $200M giving');
  console.log('   • U.S. Department of Education (Federal) - $70B giving');
  console.log('\n📝 Grants (6):');
  console.log('   • PROSPECT: Youth STEM Initiative - $150,000 (45 days)');
  console.log('   • RESEARCHING: Community Health Pilot - $75,000 (30 days)');
  console.log('   • WRITING: After-School Expansion - $50,000 (12 days)');
  console.log('   • SUBMITTED: Workforce Training - $200,000 (5 days ago)');
  console.log('   • PENDING: Education Innovation - $500,000');
  console.log('   • AWARDED: 2024 Community Grant - $85,000 awarded');
  console.log('\n✅ Commitments (3 for awarded grant):');
  console.log('   • Serve 500 youth (6 months)');
  console.log('   • Quarterly report (3 months)');
  console.log('   • Final evaluation (12 months)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });