import { PrismaClient, PlanInterval, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log('Seeding subscription plans with new pricing structure...');

  // Base monthly price: Rs. 49 (4900 cents)
  const baseMonthlyPrice = 4900;

  const plans = [
    {
      name: 'JEE Monthly Plan',
      description: 'Access to JEE practice tests for 1 month',
      priceCents: baseMonthlyPrice,
      currency: 'INR',
      interval: PlanInterval.MONTH,
      planType: PlanType.MANUAL,
      discountPercent: 0,
      basePriceCents: baseMonthlyPrice,
    },
    {
      name: 'JEE 3 Months Plan',
      description: 'Access to JEE practice tests for 3 months with 5% discount',
      priceCents: Math.floor(baseMonthlyPrice * 3 * 0.95), // 5% discount on 3 months
      currency: 'INR',
      interval: PlanInterval.THREE_MONTHS,
      planType: PlanType.MANUAL,
      discountPercent: 5,
      basePriceCents: baseMonthlyPrice * 3,
    },
    {
      name: 'JEE 6 Months Plan',
      description: 'Access to JEE practice tests for 6 months with 10% discount',
      priceCents: Math.floor(baseMonthlyPrice * 6 * 0.9), // 10% discount on 6 months
      currency: 'INR',
      interval: PlanInterval.SIX_MONTHS,
      planType: PlanType.MANUAL,
      discountPercent: 10,
      basePriceCents: baseMonthlyPrice * 6,
    },
    {
      name: 'JEE 12 Months Plan',
      description: 'Access to JEE practice tests for 12 months with 20% discount',
      priceCents: Math.floor(baseMonthlyPrice * 12 * 0.8), // 20% discount on 12 months
      currency: 'INR',
      interval: PlanInterval.YEAR,
      planType: PlanType.MANUAL,
      discountPercent: 20,
      basePriceCents: baseMonthlyPrice * 12,
    },
    {
      name: 'JEE AI Monthly Plan',
      description: 'Access to AI-powered JEE practice tests for 1 month',
      priceCents: baseMonthlyPrice + 2000, // Rs. 69 for AI features
      currency: 'INR',
      interval: PlanInterval.MONTH,
      planType: PlanType.AI_ENABLED,
      discountPercent: 0,
      basePriceCents: baseMonthlyPrice + 2000,
    },
    {
      name: 'JEE AI 3 Months Plan',
      description: 'Access to AI-powered JEE practice tests for 3 months with 5% discount',
      priceCents: Math.floor((baseMonthlyPrice + 2000) * 3 * 0.95), // 5% discount on 3 months
      currency: 'INR',
      interval: PlanInterval.THREE_MONTHS,
      planType: PlanType.AI_ENABLED,
      discountPercent: 5,
      basePriceCents: (baseMonthlyPrice + 2000) * 3,
    },
    {
      name: 'JEE AI 6 Months Plan',
      description: 'Access to AI-powered JEE practice tests for 6 months with 10% discount',
      priceCents: Math.floor((baseMonthlyPrice + 2000) * 6 * 0.9), // 10% discount on 6 months
      currency: 'INR',
      interval: PlanInterval.SIX_MONTHS,
      planType: PlanType.AI_ENABLED,
      discountPercent: 10,
      basePriceCents: (baseMonthlyPrice + 2000) * 6,
    },
    {
      name: 'JEE AI 12 Months Plan',
      description: 'Access to AI-powered JEE practice tests for 12 months with 20% discount',
      priceCents: Math.floor((baseMonthlyPrice + 2000) * 12 * 0.8), // 20% discount on 12 months
      currency: 'INR',
      interval: PlanInterval.YEAR,
      planType: PlanType.AI_ENABLED,
      discountPercent: 20,
      basePriceCents: (baseMonthlyPrice + 2000) * 12,
    },
  ];

  // Delete existing plans to avoid duplicates
  await prisma.plan.deleteMany({});
  console.log('Cleared existing plans');

  // Create new plans
  for (const plan of plans) {
    const createdPlan = await prisma.plan.create({
      data: plan,
    });
    console.log(`Created plan: ${createdPlan.name} - Rs.${createdPlan.priceCents / 100}`);
  }

  console.log('Subscription plans seeded successfully!');
}

async function main() {
  try {
    await seedSubscriptionPlans();
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
