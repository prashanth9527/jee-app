import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.examAnswer.deleteMany();
  await prisma.examSubmission.deleteMany();
  await prisma.examPaper.deleteMany();
  await prisma.questionTag.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.subtopic.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.referralReward.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.referralCode.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.otp.deleteMany();
  
  // Delete blog-related data first
  await prisma.blogBookmark.deleteMany();
  await prisma.blogLike.deleteMany();
  await prisma.blogComment.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.blogCategory.deleteMany();
  
  // Delete formula data
  await prisma.formula.deleteMany();
  
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared existing data');

  // Create or find admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@jeeapp.com' }
  });
  
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@jeeapp.com',
        phone: '+919876543210',
        fullName: 'Admin User',
        hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
        phoneVerified: true,
      },
    });
  }

  // Create demo student users
  const student1 = await prisma.user.create({
    data: {
      email: 'student1@example.com',
      phone: '+919876543211',
      fullName: 'Rahul Kumar',
      hashedPassword: await bcrypt.hash('student123', 10),
      role: 'STUDENT',
      emailVerified: true,
      phoneVerified: true,
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      aiTestsUsed: 0,
      aiTestsLimit: 10, // 10 AI tests per month
      lastAiResetAt: new Date(),
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@example.com',
      phone: '+919876543212',
      fullName: 'Priya Sharma',
      hashedPassword: await bcrypt.hash('student123', 10),
      role: 'STUDENT',
      emailVerified: true,
      phoneVerified: true,
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      aiTestsUsed: 0,
      aiTestsLimit: 10, // 10 AI tests per month
      lastAiResetAt: new Date(),
    },
  });

  // Create test user with the phone number from screenshot
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      phone: '+919866211858',
      fullName: 'Test User',
      hashedPassword: await bcrypt.hash('test123', 10),
      role: 'STUDENT',
      emailVerified: true,
      phoneVerified: true,
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      aiTestsUsed: 0,
      aiTestsLimit: 10,
      lastAiResetAt: new Date(),
    },
  });

  // Create expert user
  const expertUser = await prisma.user.create({
    data: {
      email: 'expert@jeeapp.com',
      phone: '+919876543213',
      fullName: 'Dr. Expert User',
      hashedPassword: await bcrypt.hash('expert123', 10),
      role: 'EXPERT',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log('👥 Created users');

  // Create subscription plans
  const manualPlan = await prisma.plan.create({
    data: {
      name: 'Manual Plan',
      description: 'Access to practice tests with database questions',
      priceCents: 4900, // 999 INR in cents
      currency: 'INR',
      interval: 'MONTH',
      planType: 'MANUAL',
      stripePriceId: 'price_manual_monthly',
    },
  });

  const aiPlan = await prisma.plan.create({
    data: {
      name: 'AI Enabled Plan',
      description: 'Access to AI-generated questions and explanations',
      priceCents: 9900, // 1999 INR in cents
      currency: 'INR',
      interval: 'MONTH',
      planType: 'AI_ENABLED',
      stripePriceId: 'price_ai_monthly',
    },
  });


  console.log('💳 Created subscription plans');

  // Create free trial plan for referral rewards
  const freeTrialPlan = await prisma.plan.create({
    data: {
      name: 'Free Trial',
      description: 'Free trial plan for referral rewards',
      priceCents: 0,
      currency: 'INR',
      interval: 'MONTH',
      planType: 'MANUAL',
      stripePriceId: 'free_trial_plan',
    },
  });

  console.log('🎁 Created free trial plan for referrals');

  // Create streams (using upsert to avoid unique constraint errors)
  const jeeStream = await prisma.stream.upsert({
    where: { code: 'JEE' },
    update: {},
    create: {
      name: 'JEE (Joint Entrance Examination)',
      description: 'Engineering entrance examination for IITs, NITs, and other engineering colleges',
      code: 'JEE',
      isActive: true,
    },
  });

  const neetStream = await prisma.stream.upsert({
    where: { code: 'NEET' },
    update: {},
    create: {
      name: 'NEET (National Eligibility cum Entrance Test)',
      description: 'Medical entrance examination for MBBS, BDS, and other medical courses',
      code: 'NEET',
      isActive: true,
    },
  });

  const clatStream = await prisma.stream.upsert({
    where: { code: 'CLAT' },
    update: {},
    create: {
      name: 'CLAT (Common Law Admission Test)',
      description: 'Law entrance examination for NLUs and other law colleges',
      code: 'CLAT',
      isActive: true,
    },
  });

  const competitiveStream = await prisma.stream.upsert({
    where: { code: 'COMPETITIVE' },
    update: {},
    create: {
      name: 'Other Competitive Exams',
      description: 'Various other competitive examinations',
      code: 'COMPETITIVE',
      isActive: true,
    },
  });

  console.log('🎯 Created streams');

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'Previous Year' } }),
    prisma.tag.create({ data: { name: 'JEE Mains' } }),
    prisma.tag.create({ data: { name: 'JEE Advanced' } }),
    prisma.tag.create({ data: { name: 'Easy' } }),
    prisma.tag.create({ data: { name: 'Medium' } }),
    prisma.tag.create({ data: { name: 'Hard' } }),
    prisma.tag.create({ data: { name: 'Formula Based' } }),
    prisma.tag.create({ data: { name: 'Conceptual' } }),
  ]);

  console.log('🏷️ Created tags');

  // Create subjects for JEE
  const physics = await prisma.subject.create({
    data: {
      name: 'Physics',
      description: 'Physics for JEE Mains and Advanced',
      streamId: jeeStream.id,
    },
  });

  const chemistry = await prisma.subject.create({
    data: {
      name: 'Chemistry',
      description: 'Chemistry for JEE Mains and Advanced',
      streamId: jeeStream.id,
    },
  });

  const mathematics = await prisma.subject.create({
    data: {
      name: 'Mathematics',
      description: 'Mathematics for JEE Mains and Advanced',
      streamId: jeeStream.id,
    },
  });

  // Create subjects for NEET
  const neetPhysics = await prisma.subject.create({
    data: {
      name: 'Physics',
      description: 'Physics for NEET',
      streamId: neetStream.id,
    },
  });

  const neetChemistry = await prisma.subject.create({
    data: {
      name: 'Chemistry',
      description: 'Chemistry for NEET',
      streamId: neetStream.id,
    },
  });

  const biology = await prisma.subject.create({
    data: {
      name: 'Biology',
      description: 'Biology for NEET',
      streamId: neetStream.id,
    },
  });

  // Create subjects for CLAT
  const english = await prisma.subject.create({
    data: {
      name: 'English',
      description: 'English for CLAT',
      streamId: clatStream.id,
    },
  });

  const logicalReasoning = await prisma.subject.create({
    data: {
      name: 'Logical Reasoning',
      description: 'Logical Reasoning for CLAT',
      streamId: clatStream.id,
    },
  });

  const legalAptitude = await prisma.subject.create({
    data: {
      name: 'Legal Aptitude',
      description: 'Legal Aptitude for CLAT',
      streamId: clatStream.id,
    },
  });

  const generalKnowledge = await prisma.subject.create({
    data: {
      name: 'General Knowledge',
      description: 'General Knowledge for CLAT',
      streamId: clatStream.id,
    },
  });

  console.log('📚 Created subjects for all streams');

  // Create lessons for Physics
  const physicsLesson1 = await prisma.lesson.create({
    data: {
      name: 'Classical Physics',
      description: 'Fundamental physics concepts and mechanics',
      subjectId: physics.id,
      order: 1,
    },
  });

  const physicsLesson2 = await prisma.lesson.create({
    data: {
      name: 'Modern Physics',
      description: 'Electricity, magnetism, waves and optics',
      subjectId: physics.id,
      order: 2,
    },
  });

  // Create lessons for Chemistry
  const chemLesson1 = await prisma.lesson.create({
    data: {
      name: 'Physical and Inorganic Chemistry',
      description: 'Physical principles and inorganic compounds',
      subjectId: chemistry.id,
      order: 1,
    },
  });

  const chemLesson2 = await prisma.lesson.create({
    data: {
      name: 'Organic Chemistry',
      description: 'Carbon compounds and organic reactions',
      subjectId: chemistry.id,
      order: 2,
    },
  });

  // Create topics for Physics
  const mechanics = await prisma.topic.create({
    data: {
      name: 'Mechanics',
      description: 'Classical mechanics and dynamics',
      subjectId: physics.id,
      lessonId: physicsLesson1.id,
      order: 1,
    },
  });

  const electricity = await prisma.topic.create({
    data: {
      name: 'Electricity & Magnetism',
      description: 'Electric and magnetic phenomena',
      subjectId: physics.id,
      lessonId: physicsLesson2.id,
      order: 1,
    },
  });

  const waves = await prisma.topic.create({
    data: {
      name: 'Waves & Optics',
      description: 'Wave phenomena and optical systems',
      subjectId: physics.id,
      lessonId: physicsLesson2.id,
      order: 2,
    },
  });

  // Create topics for Chemistry
  const physicalChemistry = await prisma.topic.create({
    data: {
      name: 'Physical Chemistry',
      description: 'Physical principles in chemistry',
      subjectId: chemistry.id,
      lessonId: chemLesson1.id,
      order: 1,
    },
  });

  const organicChemistry = await prisma.topic.create({
    data: {
      name: 'Organic Chemistry',
      description: 'Carbon compounds and reactions',
      subjectId: chemistry.id,
      lessonId: chemLesson2.id,
      order: 1,
    },
  });

  const inorganicChemistry = await prisma.topic.create({
    data: {
      name: 'Inorganic Chemistry',
      description: 'Non-carbon compounds and elements',
      subjectId: chemistry.id,
      lessonId: chemLesson1.id,
      order: 2,
    },
  });

  // Create lessons for Mathematics
  const mathLesson1 = await prisma.lesson.create({
    data: {
      name: 'Fundamentals of Mathematics',
      description: 'Basic mathematical concepts and operations',
      subjectId: mathematics.id,
      order: 1,
    },
  });

  const mathLesson2 = await prisma.lesson.create({
    data: {
      name: 'Advanced Mathematics',
      description: 'Advanced mathematical concepts and applications',
      subjectId: mathematics.id,
      order: 2,
    },
  });

  // Create lessons for Biology
  const bioLesson1 = await prisma.lesson.create({
    data: {
      name: 'Cell Biology and Genetics',
      description: 'Fundamental concepts of cell biology and genetics',
      subjectId: biology.id,
      order: 1,
    },
  });

  // Create topics for Mathematics
  const algebra = await prisma.topic.create({
    data: {
      name: 'Algebra',
      description: 'Algebraic expressions and equations',
      subjectId: mathematics.id,
      lessonId: mathLesson1.id,
      order: 1,
    },
  });

  const calculus = await prisma.topic.create({
    data: {
      name: 'Calculus',
      description: 'Differential and integral calculus',
      subjectId: mathematics.id,
      lessonId: mathLesson2.id,
      order: 1,
    },
  });

  const geometry = await prisma.topic.create({
    data: {
      name: 'Geometry',
      description: 'Geometric shapes and properties',
      subjectId: mathematics.id,
      lessonId: mathLesson1.id,
      order: 2,
    },
  });

  // Create topics for Biology (NEET)
  const cellBiology = await prisma.topic.create({
    data: {
      name: 'Cell Biology',
      description: 'Cell structure and function',
      subjectId: biology.id,
      lessonId: bioLesson1.id,
      order: 1,
    },
  });

  console.log('📖 Created topics');

  // Create subtopics
  const subtopics = await Promise.all([
    // Physics - Mechanics
    prisma.subtopic.create({
      data: {
        name: 'Kinematics',
        description: 'Motion and its description',
        topicId: mechanics.id,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Dynamics',
        description: 'Forces and motion',
        topicId: mechanics.id,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Work & Energy',
        description: 'Work, energy, and power',
        topicId: mechanics.id,
      },
    }),

    // Physics - Electricity
    prisma.subtopic.create({
      data: {
        name: 'Electrostatics',
        description: 'Electric charges and fields',
        topicId: electricity.id,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Current Electricity',
        description: 'Electric current and circuits',
        topicId: electricity.id,
      },
    }),

    // Chemistry - Physical
    prisma.subtopic.create({
      data: {
        name: 'Thermodynamics',
        description: 'Heat and energy in chemical systems',
        topicId: physicalChemistry.id,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Chemical Kinetics',
        description: 'Rate of chemical reactions',
        topicId: physicalChemistry.id,
      },
    }),

    // Mathematics - Algebra
    prisma.subtopic.create({
      data: {
        name: 'Quadratic Equations',
        description: 'Second degree equations',
        topicId: algebra.id,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Matrices',
        description: 'Matrix operations and determinants',
        topicId: algebra.id,
      },
    }),
  ]);

  console.log('📝 Created subtopics');

  // Create questions with options
  const questions = [
    // Physics - Kinematics
    {
      stem: 'A particle moves along a straight line with velocity v = 3t² - 6t + 2 m/s. The acceleration at t = 2s is:',
      explanation: 'Acceleration is the derivative of velocity: a = dv/dt = 6t - 6. At t = 2s, a = 6(2) - 6 = 6 m/s²',
      difficulty: 'MEDIUM' as const,
      subtopicId: subtopics[0].id, // Kinematics
      tagIds: [tags[1].id, tags[4].id], // JEE Mains, Medium
      options: [
        { text: '2 m/s²', isCorrect: false },
        { text: '4 m/s²', isCorrect: false },
        { text: '6 m/s²', isCorrect: true },
        { text: '8 m/s²', isCorrect: false },
      ],
    },
    {
      stem: 'A ball is thrown vertically upwards with a velocity of 20 m/s. The time taken to reach the maximum height is:',
      explanation: 'Using v = u - gt, at maximum height v = 0. So 0 = 20 - 9.8t, giving t = 20/9.8 ≈ 2.04s',
      difficulty: 'EASY' as const,
      subtopicId: subtopics[0].id,
      tagIds: [tags[1].id, tags[3].id], // JEE Mains, Easy
      options: [
        { text: '1.5 s', isCorrect: false },
        { text: '2.0 s', isCorrect: true },
        { text: '2.5 s', isCorrect: false },
        { text: '3.0 s', isCorrect: false },
      ],
    },

    // Physics - Electrostatics
    {
      stem: 'Two point charges +2μC and -3μC are placed 10 cm apart. The force between them is:',
      explanation: 'Using Coulomb\'s law: F = k|q₁q₂|/r² = 9×10⁹ × |2×10⁻⁶ × (-3×10⁻⁶)| / (0.1)² = 5.4 N',
      difficulty: 'MEDIUM' as const,
      subtopicId: subtopics[3].id, // Electrostatics
      tagIds: [tags[1].id, tags[4].id, tags[6].id], // JEE Mains, Medium, Formula Based
      options: [
        { text: '3.6 N', isCorrect: false },
        { text: '5.4 N', isCorrect: true },
        { text: '7.2 N', isCorrect: false },
        { text: '9.0 N', isCorrect: false },
      ],
    },

    // Chemistry - Thermodynamics
    {
      stem: 'For an isothermal reversible process, the change in internal energy (ΔU) is:',
      explanation: 'For an isothermal process, temperature remains constant. Since internal energy depends only on temperature for an ideal gas, ΔU = 0',
      difficulty: 'MEDIUM' as const,
      subtopicId: subtopics[5].id, // Thermodynamics
      tagIds: [tags[1].id, tags[4].id, tags[7].id], // JEE Mains, Medium, Conceptual
      options: [
        { text: 'Positive', isCorrect: false },
        { text: 'Negative', isCorrect: false },
        { text: 'Zero', isCorrect: true },
        { text: 'Cannot be determined', isCorrect: false },
      ],
    },

    // Mathematics - Quadratic Equations
    {
      stem: 'The roots of the equation x² - 5x + 6 = 0 are:',
      explanation: 'x² - 5x + 6 = (x-2)(x-3) = 0. Therefore, x = 2 or x = 3',
      difficulty: 'EASY' as const,
      subtopicId: subtopics[7].id, // Quadratic Equations
      tagIds: [tags[1].id, tags[3].id], // JEE Mains, Easy
      options: [
        { text: '2, 3', isCorrect: true },
        { text: '1, 6', isCorrect: false },
        { text: '-2, -3', isCorrect: false },
        { text: '2, -3', isCorrect: false },
      ],
    },

    // Mathematics - Matrices
    {
      stem: 'If A = [1 2; 3 4] and B = [2 0; 1 2], then AB is:',
      explanation: 'AB = [1×2+2×1 1×0+2×2; 3×2+4×1 3×0+4×2] = [4 4; 10 8]',
      difficulty: 'HARD' as const,
      subtopicId: subtopics[8].id, // Matrices
      tagIds: [tags[2].id, tags[5].id, tags[6].id], // JEE Advanced, Hard, Formula Based
      options: [
        { text: '[4 4; 10 8]', isCorrect: true },
        { text: '[2 4; 6 8]', isCorrect: false },
        { text: '[3 2; 7 6]', isCorrect: false },
        { text: '[5 4; 11 8]', isCorrect: false },
      ],
    },

    // Chemistry - Organic Chemistry
    {
      stem: 'Which of the following is a functional group isomer of ethanol?',
      explanation: 'Ethanol (CH₃CH₂OH) and dimethyl ether (CH₃OCH₃) have the same molecular formula C₂H₆O but different functional groups',
      difficulty: 'MEDIUM' as const,
      topicId: organicChemistry.id,
      tagIds: [tags[1].id, tags[4].id, tags[7].id], // JEE Mains, Medium, Conceptual
      options: [
        { text: 'Methanol', isCorrect: false },
        { text: 'Dimethyl ether', isCorrect: true },
        { text: 'Acetaldehyde', isCorrect: false },
        { text: 'Acetic acid', isCorrect: false },
      ],
    },

    // Physics - Current Electricity
    {
      stem: 'A wire of resistance R is cut into n equal parts. The equivalent resistance when these parts are connected in parallel is:',
      explanation: 'Each part has resistance R/n. When connected in parallel: 1/Req = n/(R/n) = n²/R. So Req = R/n²',
      difficulty: 'HARD' as const,
      subtopicId: subtopics[4].id, // Current Electricity
      tagIds: [tags[2].id, tags[5].id, tags[6].id], // JEE Advanced, Hard, Formula Based
      options: [
        { text: 'R/n', isCorrect: false },
        { text: 'R/n²', isCorrect: true },
        { text: 'nR', isCorrect: false },
        { text: 'n²R', isCorrect: false },
      ],
    },
  ];

  // Create questions and their options
  for (const questionData of questions) {
    const { options, tagIds, ...questionFields } = questionData;
    
    const question = await prisma.question.create({
      data: questionFields,
    });

    // Create options for the question
    await Promise.all(
      options.map(option =>
        prisma.questionOption.create({
          data: {
            text: option.text,
            isCorrect: option.isCorrect,
            questionId: question.id,
          },
        })
      )
    );

    // Create question-tag relationships
    await Promise.all(
      tagIds.map(tagId =>
        prisma.questionTag.create({
          data: {
            questionId: question.id,
            tagId: tagId,
          },
        })
      )
    );
  }

  console.log('❓ Created questions with options');

  // Create Previous Year Questions
  const pyq1 = await prisma.question.create({
    data: {
      stem: 'A particle moves in a straight line with constant acceleration. If the initial velocity is 5 m/s and the final velocity after 10 seconds is 25 m/s, what is the acceleration?',
      explanation: 'Using the equation v = u + at, where v = final velocity, u = initial velocity, a = acceleration, t = time. 25 = 5 + a(10), so a = 2 m/s².',
      difficulty: 'EASY',
      yearAppeared: 2023,
      isPreviousYear: true,
      subjectId: physics.id,
      topicId: mechanics.id,
      options: {
        create: [
          { text: '1 m/s²', isCorrect: false, order: 0 },
          { text: '2 m/s²', isCorrect: true, order: 1 },
          { text: '3 m/s²', isCorrect: false, order: 2 },
          { text: '4 m/s²', isCorrect: false, order: 3 }
        ]
      }
    }
  });

  const pyq2 = await prisma.question.create({
    data: {
      stem: 'What is the IUPAC name of CH₃-CH₂-CH=CH₂?',
      explanation: 'The compound has 4 carbon atoms with a double bond at position 1. The IUPAC name is 1-Butene.',
      difficulty: 'MEDIUM',
      yearAppeared: 2022,
      isPreviousYear: true,
      subjectId: chemistry.id,
      topicId: organicChemistry.id,
      options: {
        create: [
          { text: 'Propene', isCorrect: false, order: 0 },
          { text: '1-Butene', isCorrect: true, order: 1 },
          { text: '2-Butene', isCorrect: false, order: 2 },
          { text: 'Butane', isCorrect: false, order: 3 }
        ]
      }
    }
  });

  const pyq3 = await prisma.question.create({
    data: {
      stem: 'If the roots of the quadratic equation x² - 5x + 6 = 0 are α and β, then what is the value of α² + β²?',
      explanation: 'For a quadratic equation ax² + bx + c = 0, if roots are α and β, then α + β = -b/a = 5 and αβ = c/a = 6. Now, α² + β² = (α + β)² - 2αβ = 25 - 12 = 13.',
      difficulty: 'HARD',
      yearAppeared: 2021,
      isPreviousYear: true,
      subjectId: mathematics.id,
      topicId: algebra.id,
      options: {
        create: [
          { text: '11', isCorrect: false, order: 0 },
          { text: '13', isCorrect: true, order: 1 },
          { text: '15', isCorrect: false, order: 2 },
          { text: '17', isCorrect: false, order: 3 }
        ]
      }
    }
  });

  const pyq4 = await prisma.question.create({
    data: {
      stem: 'A ball is thrown vertically upwards with a velocity of 20 m/s. What is the maximum height reached by the ball? (Take g = 10 m/s²)',
      explanation: 'Using the equation v² = u² - 2gh, where v = final velocity (0 at max height), u = initial velocity, g = acceleration due to gravity, h = height. 0 = 400 - 20h, so h = 20 m.',
      difficulty: 'MEDIUM',
      yearAppeared: 2023,
      isPreviousYear: true,
      subjectId: physics.id,
      topicId: mechanics.id,
      options: {
        create: [
          { text: '15 m', isCorrect: false, order: 0 },
          { text: '20 m', isCorrect: true, order: 1 },
          { text: '25 m', isCorrect: false, order: 2 },
          { text: '30 m', isCorrect: false, order: 3 }
        ]
      }
    }
  });

  const pyq5 = await prisma.question.create({
    data: {
      stem: 'Which of the following is a strong electrolyte?',
      explanation: 'HCl is a strong acid that completely dissociates in water, making it a strong electrolyte. The other options are weak electrolytes or non-electrolytes.',
      difficulty: 'EASY',
      yearAppeared: 2022,
      isPreviousYear: true,
      subjectId: chemistry.id,
      topicId: physicalChemistry.id,
      options: {
        create: [
          { text: 'Acetic acid', isCorrect: false, order: 0 },
          { text: 'HCl', isCorrect: true, order: 1 },
          { text: 'NH₄OH', isCorrect: false, order: 2 },
          { text: 'H₂O', isCorrect: false, order: 3 }
        ]
      }
    }
  });

  console.log('📚 Created Previous Year Questions');

  // Get all questions for assignment to exam papers
  const allQuestions = await prisma.question.findMany({
    include: {
      subtopic: {
        include: {
          topic: true
        }
      },
      topic: true
    }
  });

  // Group questions by subject/topic
  const physicsQuestions = allQuestions.filter((q: any) => 
    q.subtopic?.topic?.subjectId === physics.id || q.topic?.subjectId === physics.id
  );
  const chemistryQuestions = allQuestions.filter((q: any) => 
    q.subtopic?.topic?.subjectId === chemistry.id || q.topic?.subjectId === chemistry.id
  );
  const mathQuestions = allQuestions.filter((q: any) => 
    q.subtopic?.topic?.subjectId === mathematics.id || q.topic?.subjectId === mathematics.id
  );

  // Create some exam papers with assigned questions
  const examPapers = await Promise.all([
    prisma.examPaper.create({
      data: {
        title: 'Physics Practice Test - Mechanics',
        description: 'Practice test covering kinematics and dynamics',
        timeLimitMin: 60, // 60 minutes
        subjectIds: [physics.id],
        topicIds: [mechanics.id],
        questionIds: physicsQuestions.slice(0, 5).map((q: any) => q.id), // Assign first 5 physics questions
      },
    }),
    prisma.examPaper.create({
      data: {
        title: 'Chemistry Practice Test - Physical Chemistry',
        description: 'Practice test covering thermodynamics and kinetics',
        timeLimitMin: 45,
        subjectIds: [chemistry.id],
        topicIds: [physicalChemistry.id],
        questionIds: chemistryQuestions.slice(0, 4).map((q: any) => q.id), // Assign first 4 chemistry questions
      },
    }),
    prisma.examPaper.create({
      data: {
        title: 'Mathematics Practice Test - Algebra',
        description: 'Practice test covering quadratic equations and matrices',
        timeLimitMin: 90,
        subjectIds: [mathematics.id],
        topicIds: [algebra.id],
        questionIds: mathQuestions.slice(0, 6).map((q: any) => q.id), // Assign first 6 math questions
      },
    }),
  ]);

  console.log('📄 Created exam papers');

  // Create some sample exam submissions
  const submission1 = await prisma.examSubmission.create({
    data: {
      userId: student1.id,
      examPaperId: examPapers[0].id,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      submittedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      totalQuestions: examPapers[0].questionIds.length,
      correctCount: 3,
      scorePercent: 60.0,
    },
  });

  const submission2 = await prisma.examSubmission.create({
    data: {
      userId: student2.id,
      examPaperId: examPapers[1].id,
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      submittedAt: new Date(Date.now() - 0.75 * 60 * 60 * 1000), // 45 minutes ago
      totalQuestions: examPapers[1].questionIds.length,
      correctCount: 3,
      scorePercent: 75.0,
    },
  });

  console.log('📊 Created exam submissions');

  // Create sample LMS content
  console.log('📚 Creating LMS content...');

  const lmsContent1 = await prisma.lMSContent.create({
    data: {
      title: 'Introduction to Physics - Mechanics',
      description: 'Fundamental concepts of mechanics including Newton\'s laws, kinematics, and dynamics.',
      contentType: 'VIDEO',
      status: 'PUBLISHED',
      accessType: 'FREE',
      streamId: jeeStream.id,
      subjectId: physics.id,
      topicId: mechanics.id,
      difficulty: 'MEDIUM',
      duration: 45,
      tags: ['mechanics', 'newton', 'kinematics', 'fundamentals'],
      contentData: {
        videoUrl: 'https://example.com/videos/mechanics-intro.mp4',
        transcript: 'Welcome to our introduction to mechanics...'
      }
    }
  });

  const lmsContent2 = await prisma.lMSContent.create({
    data: {
      title: 'Chemical Bonding Fundamentals',
      description: 'Understanding ionic, covalent, and metallic bonds in chemistry.',
      contentType: 'TEXT',
      status: 'PUBLISHED',
      accessType: 'SUBSCRIPTION',
      streamId: jeeStream.id,
      subjectId: chemistry.id,
      topicId: organicChemistry.id,
      difficulty: 'EASY',
      duration: 30,
      tags: ['bonding', 'ionic', 'covalent', 'fundamentals'],
      contentData: {
        content: 'Chemical bonding is the force that holds atoms together in compounds...',
        sections: [
          { title: 'Ionic Bonds', content: 'Ionic bonds form between metals and non-metals...' },
          { title: 'Covalent Bonds', content: 'Covalent bonds form when atoms share electrons...' }
        ]
      }
    }
  });

  const lmsContent3 = await prisma.lMSContent.create({
    data: {
      title: 'NEET Biology - Cell Structure',
      description: 'Detailed study of cell structure and organelles for NEET preparation.',
      contentType: 'IMAGE',
      status: 'PUBLISHED',
      accessType: 'PREMIUM',
      streamId: neetStream.id,
      subjectId: biology.id,
      topicId: cellBiology.id,
      difficulty: 'HARD',
      duration: 60,
      tags: ['cell', 'organelles', 'structure', 'neet'],
      contentData: {
        images: [
          { url: 'https://example.com/images/cell-structure-1.jpg', caption: 'Animal Cell Structure' },
          { url: 'https://example.com/images/cell-structure-2.jpg', caption: 'Plant Cell Structure' }
        ]
      }
    }
  });

  const lmsContent4 = await prisma.lMSContent.create({
    data: {
      title: 'Mathematics Quiz - Algebra',
      description: 'Interactive quiz to test your algebra knowledge.',
      contentType: 'QUIZ',
      status: 'PUBLISHED',
      accessType: 'FREE',
      streamId: jeeStream.id,
      subjectId: mathematics.id,
      topicId: algebra.id,
      difficulty: 'MEDIUM',
      duration: 20,
      tags: ['algebra', 'quiz', 'practice', 'math'],
      contentData: {
        questions: [
          {
            question: 'What is the solution to x + 5 = 10?',
            options: ['x = 5', 'x = 15', 'x = 2', 'x = -5'],
            correctAnswer: 0
          },
          {
            question: 'Simplify: 2x + 3x',
            options: ['5x', '6x', '5x²', '6x²'],
            correctAnswer: 0
          }
        ]
      }
    }
  });

  console.log('📚 Created LMS content');

  // ========================================
  // BLOG CATEGORIES
  // ========================================
  console.log('📝 Creating blog categories...');

  const studyTipsCategory = await prisma.blogCategory.create({
    data: {
      name: 'Study Tips',
      slug: 'study-tips',
      description: 'Effective study strategies and learning techniques',
      color: '#3B82F6',
      icon: 'academic-cap',
      sortOrder: 1,
    },
  });

  const examPreparationCategory = await prisma.blogCategory.create({
    data: {
      name: 'Exam Preparation',
      slug: 'exam-preparation',
      description: 'Comprehensive guides for competitive exam preparation',
      color: '#10B981',
      icon: 'book-open',
      sortOrder: 2,
    },
  });

  const careerGuidanceCategory = await prisma.blogCategory.create({
    data: {
      name: 'Career Guidance',
      slug: 'career-guidance',
      description: 'Career advice and professional development',
      color: '#8B5CF6',
      icon: 'briefcase',
      sortOrder: 3,
    },
  });

  const motivationCategory = await prisma.blogCategory.create({
    data: {
      name: 'Motivation & Success',
      slug: 'motivation-success',
      description: 'Inspirational stories and motivational content',
      color: '#F59E0B',
      icon: 'fire',
      sortOrder: 4,
    },
  });

  const technologyCategory = await prisma.blogCategory.create({
    data: {
      name: 'Technology',
      slug: 'technology',
      description: 'Latest trends in educational technology',
      color: '#EF4444',
      icon: 'chip',
      sortOrder: 5,
    },
  });

  console.log('📝 Created blog categories');

  // ========================================
  // BLOG POSTS
  // ========================================
  console.log('📰 Creating blog posts...');

  // Get admin user for author
  const blogAuthor = await prisma.user.findUnique({
    where: { email: 'admin@jeeapp.com' },
  });

  if (blogAuthor) {
    // Study Tips Blog Posts
    await prisma.blog.create({
      data: {
        title: '10 Effective Study Techniques for JEE Preparation',
        slug: '10-effective-study-techniques-jee-preparation',
        excerpt: 'Discover proven study methods that will help you excel in JEE preparation and achieve your dream of getting into a top engineering college.',
        content: `
          <h2>Introduction</h2>
          <p>Preparing for JEE (Joint Entrance Examination) requires dedication, discipline, and the right study techniques. In this comprehensive guide, we'll explore 10 proven study methods that have helped thousands of students achieve success in JEE.</p>
          
          <h3>1. Active Recall</h3>
          <p>Active recall involves actively stimulating memory during the learning process. Instead of passively reading notes, test yourself regularly on the material you've studied.</p>
          
          <h3>2. Spaced Repetition</h3>
          <p>Review material at increasing intervals over time. This technique helps move information from short-term to long-term memory.</p>
          
          <h3>3. Practice Problems</h3>
          <p>Solve as many practice problems as possible. JEE is all about application, and regular practice builds both speed and accuracy.</p>
          
          <h3>4. Time Management</h3>
          <p>Create a realistic study schedule that balances all three subjects (Physics, Chemistry, Mathematics) effectively.</p>
          
          <h3>5. Conceptual Understanding</h3>
          <p>Focus on understanding concepts rather than memorizing formulas. This approach will help you solve novel problems during the exam.</p>
          
          <h3>6. Regular Revision</h3>
          <p>Set aside dedicated time for revision. Regular review of previously studied topics ensures retention.</p>
          
          <h3>7. Mock Tests</h3>
          <p>Take full-length mock tests regularly to simulate exam conditions and identify areas for improvement.</p>
          
          <h3>8. Error Analysis</h3>
          <p>Analyze your mistakes thoroughly. Understanding why you made an error helps prevent similar mistakes in the future.</p>
          
          <h3>9. Healthy Lifestyle</h3>
          <p>Maintain a balanced diet, regular exercise, and adequate sleep. Physical health directly impacts mental performance.</p>
          
          <h3>10. Positive Mindset</h3>
          <p>Stay motivated and maintain a positive attitude throughout your preparation journey.</p>
          
          <h2>Conclusion</h2>
          <p>Success in JEE requires a combination of hard work, smart study techniques, and consistent effort. Implement these strategies gradually and adapt them to your learning style for the best results.</p>
        `,
        metaTitle: '10 Effective Study Techniques for JEE Preparation | JEE Study Guide',
        metaDescription: 'Master JEE preparation with these 10 proven study techniques. Learn active recall, spaced repetition, and other effective methods for competitive exam success.',
        metaKeywords: 'JEE preparation, study techniques, competitive exams, engineering entrance, study tips',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
        categoryId: studyTipsCategory.id,
        authorId: blogAuthor.id,
        streamId: jeeStream.id,
        tags: ['JEE', 'Study Tips', 'Preparation', 'Engineering', 'Competitive Exams'],
      },
    });

    await prisma.blog.create({
      data: {
        title: 'NEET Biology: Complete Study Plan for Medical Aspirants',
        slug: 'neet-biology-complete-study-plan-medical-aspirants',
        excerpt: 'A comprehensive study plan for NEET Biology covering all important topics, preparation strategies, and time management tips for medical entrance exam success.',
        content: `
          <h2>NEET Biology Study Plan Overview</h2>
          <p>Biology carries the highest weightage in NEET (720 marks out of 720), making it crucial for your success. This comprehensive study plan will guide you through systematic preparation.</p>
          
          <h3>Class 11 Biology Topics</h3>
          <ul>
            <li><strong>Diversity in Living World:</strong> Classification, taxonomy, and biodiversity</li>
            <li><strong>Structural Organization:</strong> Cell structure, tissues, and organ systems</li>
            <li><strong>Plant Physiology:</strong> Photosynthesis, respiration, and transport</li>
            <li><strong>Human Physiology:</strong> All 11 organ systems in detail</li>
          </ul>
          
          <h3>Class 12 Biology Topics</h3>
          <ul>
            <li><strong>Reproduction:</strong> Sexual and asexual reproduction in plants and animals</li>
            <li><strong>Genetics and Evolution:</strong> Heredity, molecular basis, and evolution</li>
            <li><strong>Biology and Human Welfare:</strong> Health, diseases, and biotechnology</li>
            <li><strong>Biotechnology:</strong> Principles, processes, and applications</li>
            <li><strong>Ecology and Environment:</strong> Ecosystems, biodiversity, and conservation</li>
          </ul>
          
          <h3>Study Strategy</h3>
          <p>Allocate 60% of your study time to Biology, focusing on NCERT textbooks as the primary resource. Supplement with reference books for deeper understanding.</p>
          
          <h3>Daily Schedule</h3>
          <p>Dedicate 6-8 hours daily to Biology, including 4 hours for theory and 2-4 hours for practice questions and revision.</p>
          
          <h3>Revision Plan</h3>
          <p>Weekly revision of completed topics and monthly full revision of all chapters to ensure retention.</p>
        `,
        metaTitle: 'NEET Biology Study Plan | Complete Guide for Medical Entrance',
        metaDescription: 'Master NEET Biology with our comprehensive study plan. Cover all Class 11 & 12 topics, preparation strategies, and tips for medical entrance success.',
        metaKeywords: 'NEET Biology, medical entrance, study plan, preparation, NCERT, competitive exams',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
        categoryId: examPreparationCategory.id,
        authorId: blogAuthor.id,
        streamId: neetStream.id,
        tags: ['NEET', 'Biology', 'Medical Entrance', 'Study Plan', 'NCERT'],
      },
    });

    await prisma.blog.create({
      data: {
        title: 'Career Options After Engineering: Beyond Traditional Paths',
        slug: 'career-options-after-engineering-beyond-traditional-paths',
        excerpt: 'Explore diverse career opportunities available to engineering graduates, from traditional roles to emerging fields like data science, entrepreneurship, and consulting.',
        content: `
          <h2>Traditional Engineering Careers</h2>
          <p>While many engineering graduates pursue traditional roles in their field of specialization, there's a growing trend toward diverse career paths.</p>
          
          <h3>Core Engineering Roles</h3>
          <ul>
            <li><strong>Software Engineering:</strong> Development, testing, and maintenance of software systems</li>
            <li><strong>Mechanical Engineering:</strong> Design, manufacturing, and maintenance of mechanical systems</li>
            <li><strong>Civil Engineering:</strong> Infrastructure development, construction, and urban planning</li>
            <li><strong>Electrical Engineering:</strong> Power systems, electronics, and telecommunications</li>
          </ul>
          
          <h2>Emerging Career Paths</h2>
          
          <h3>Technology and Innovation</h3>
          <ul>
            <li><strong>Data Science:</strong> Analyzing large datasets to drive business decisions</li>
            <li><strong>Artificial Intelligence:</strong> Developing intelligent systems and machine learning models</li>
            <li><strong>Cybersecurity:</strong> Protecting digital assets and information systems</li>
            <li><strong>Cloud Computing:</strong> Designing and managing cloud infrastructure</li>
          </ul>
          
          <h3>Business and Management</h3>
          <ul>
            <li><strong>Management Consulting:</strong> Advising organizations on strategic decisions</li>
            <li><strong>Product Management:</strong> Leading product development and strategy</li>
            <li><strong>Investment Banking:</strong> Financial analysis and advisory services</li>
            <li><strong>Entrepreneurship:</strong> Starting and scaling technology companies</li>
          </ul>
          
          <h3>Creative and Design</h3>
          <ul>
            <li><strong>UX/UI Design:</strong> Creating user-friendly digital interfaces</li>
            <li><strong>Technical Writing:</strong> Communicating complex technical concepts</li>
            <li><strong>Digital Marketing:</strong> Promoting products and services online</li>
            <li><strong>Game Development:</strong> Creating interactive entertainment experiences</li>
          </ul>
          
          <h2>Skills to Develop</h2>
          <p>Regardless of the career path you choose, focus on developing these essential skills:</p>
          <ul>
            <li>Problem-solving and analytical thinking</li>
            <li>Communication and teamwork</li>
            <li>Adaptability and continuous learning</li>
            <li>Leadership and project management</li>
          </ul>
          
          <h2>Conclusion</h2>
          <p>Engineering education provides a strong foundation for diverse career opportunities. Stay open to exploring different paths and continuously upgrade your skills to remain competitive in the evolving job market.</p>
        `,
        metaTitle: 'Career Options After Engineering | Beyond Traditional Paths',
        metaDescription: 'Discover diverse career opportunities for engineering graduates. Explore traditional roles, emerging tech careers, business paths, and creative fields.',
        metaKeywords: 'engineering careers, career guidance, job opportunities, technology careers, entrepreneurship',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        categoryId: careerGuidanceCategory.id,
        authorId: blogAuthor.id,
        streamId: jeeStream.id,
        tags: ['Career Guidance', 'Engineering', 'Job Opportunities', 'Technology', 'Future Careers'],
      },
    });

    await prisma.blog.create({
      data: {
        title: 'Staying Motivated During Competitive Exam Preparation',
        slug: 'staying-motivated-during-competitive-exam-preparation',
        excerpt: 'Learn how to maintain motivation and mental well-being during the challenging journey of competitive exam preparation with practical tips and strategies.',
        content: `
          <h2>The Challenge of Long-term Preparation</h2>
          <p>Preparing for competitive exams like JEE, NEET, or other entrance tests is a marathon, not a sprint. Maintaining motivation over months or years of preparation can be challenging but is crucial for success.</p>
          
          <h3>Understanding Motivation</h3>
          <p>Motivation comes in two forms:</p>
          <ul>
            <li><strong>Intrinsic Motivation:</strong> Driven by internal factors like passion and interest</li>
            <li><strong>Extrinsic Motivation:</strong> Driven by external factors like rewards and recognition</li>
          </ul>
          
          <h3>Strategies to Stay Motivated</h3>
          
          <h4>1. Set Clear Goals</h4>
          <p>Define both short-term and long-term goals. Break down your preparation into manageable milestones and celebrate achievements along the way.</p>
          
          <h4>2. Create a Vision Board</h4>
          <p>Visualize your success by creating a board with images of your dream college, career goals, and motivational quotes.</p>
          
          <h4>3. Find Your "Why"</h4>
          <p>Identify your core reasons for pursuing this path. Whether it's making your family proud, achieving financial stability, or following your passion, keep these reasons at the forefront.</p>
          
          <h4>4. Maintain a Study Routine</h4>
          <p>Consistency builds momentum. Establish a daily routine that becomes second nature over time.</p>
          
          <h4>5. Connect with Like-minded People</h4>
          <p>Join study groups, online communities, or forums where you can share experiences and learn from others on similar journeys.</p>
          
          <h4>6. Take Care of Your Mental Health</h4>
          <p>Regular exercise, adequate sleep, and healthy eating habits directly impact your mental state and motivation levels.</p>
          
          <h4>7. Celebrate Small Wins</h4>
          <p>Acknowledge and celebrate progress, no matter how small. Every step forward is a step closer to your goal.</p>
          
          <h4>8. Learn from Failures</h4>
          <p>View setbacks as learning opportunities rather than failures. Each mistake teaches you something valuable.</p>
          
          <h4>9. Stay Inspired</h4>
          <p>Read success stories, watch motivational videos, or listen to podcasts that inspire you to keep going.</p>
          
          <h4>10. Practice Gratitude</h4>
          <p>Regularly reflect on the positive aspects of your life and the opportunities you have. Gratitude can shift your perspective and boost motivation.</p>
          
          <h3>Dealing with Low Motivation</h3>
          <p>It's normal to experience periods of low motivation. When this happens:</p>
          <ul>
            <li>Take a short break and engage in activities you enjoy</li>
            <li>Revisit your goals and remind yourself why you started</li>
            <li>Seek support from family, friends, or mentors</li>
            <li>Adjust your study plan if it's becoming overwhelming</li>
          </ul>
          
          <h2>Conclusion</h2>
          <p>Motivation is not a constant state but a skill that can be developed and maintained. By implementing these strategies and being kind to yourself during challenging times, you can sustain the motivation needed to achieve your competitive exam goals.</p>
        `,
        metaTitle: 'Staying Motivated During Competitive Exam Preparation | Success Tips',
        metaDescription: 'Learn how to maintain motivation during competitive exam preparation. Discover practical strategies for mental well-being and sustained success.',
        metaKeywords: 'exam motivation, competitive exams, study motivation, mental health, success tips',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        categoryId: motivationCategory.id,
        authorId: blogAuthor.id,
        tags: ['Motivation', 'Exam Preparation', 'Mental Health', 'Success', 'Study Tips'],
      },
    });

    await prisma.blog.create({
      data: {
        title: 'The Future of Online Learning: AI and Personalized Education',
        slug: 'future-online-learning-ai-personalized-education',
        excerpt: 'Explore how artificial intelligence is revolutionizing online education, creating personalized learning experiences, and shaping the future of learning.',
        content: `
          <h2>Introduction to AI in Education</h2>
          <p>Artificial Intelligence is transforming the educational landscape, making learning more personalized, efficient, and accessible than ever before.</p>
          
          <h3>Current Applications of AI in Education</h3>
          
          <h4>1. Personalized Learning Paths</h4>
          <p>AI algorithms analyze student performance and learning patterns to create customized study plans that adapt to individual needs and pace.</p>
          
          <h4>2. Intelligent Tutoring Systems</h4>
          <p>AI-powered tutors provide instant feedback, answer questions, and guide students through complex topics 24/7.</p>
          
          <h4>3. Automated Assessment</h4>
          <p>Machine learning models can evaluate essays, code, and complex problem-solving approaches with increasing accuracy.</p>
          
          <h4>4. Learning Analytics</h4>
          <p>AI systems track student engagement, identify learning gaps, and predict performance to enable proactive intervention.</p>
          
          <h3>Emerging Technologies</h3>
          
          <h4>Natural Language Processing (NLP)</h4>
          <p>NLP enables more sophisticated interactions between students and educational platforms, allowing for natural conversation-based learning.</p>
          
          <h4>Computer Vision</h4>
          <p>Visual recognition technology can analyze student behavior, attention levels, and engagement during online sessions.</p>
          
          <h4>Virtual and Augmented Reality</h4>
          <p>AI-enhanced VR/AR creates immersive learning environments that adapt to student responses and provide realistic simulations.</p>
          
          <h3>Benefits of AI-Powered Education</h3>
          <ul>
            <li><strong>Personalization:</strong> Tailored learning experiences for each student</li>
            <li><strong>Accessibility:</strong> Breaking down barriers for students with disabilities</li>
            <li><strong>Scalability:</strong> Providing quality education to millions simultaneously</li>
            <li><strong>Efficiency:</strong> Automated administrative tasks and instant feedback</li>
            <li><strong>Data-Driven Insights:</strong> Evidence-based improvements in teaching methods</li>
          </ul>
          
          <h3>Challenges and Considerations</h3>
          
          <h4>Privacy and Data Security</h4>
          <p>Protecting student data while leveraging it for personalized learning requires robust security measures and ethical guidelines.</p>
          
          <h4>Digital Divide</h4>
          <p>Ensuring equitable access to AI-powered educational tools across different socioeconomic groups.</p>
          
          <h4>Teacher-Student Relationship</h4>
          <p>Balancing technology with human interaction to maintain the emotional and social aspects of education.</p>
          
          <h3>The Future Landscape</h3>
          <p>As AI technology continues to evolve, we can expect:</p>
          <ul>
            <li>More sophisticated adaptive learning systems</li>
            <li>Integration of AI across all educational levels</li>
            <li>New forms of assessment and credentialing</li>
            <li>Global collaboration through AI-powered platforms</li>
          </ul>
          
          <h2>Conclusion</h2>
          <p>AI is not replacing teachers but enhancing their capabilities and creating new possibilities for personalized, effective education. The future of learning lies in the thoughtful integration of artificial intelligence with human expertise.</p>
        `,
        metaTitle: 'Future of Online Learning: AI and Personalized Education | EdTech Trends',
        metaDescription: 'Discover how AI is revolutionizing online education. Explore personalized learning, intelligent tutoring, and the future of educational technology.',
        metaKeywords: 'AI in education, online learning, personalized education, educational technology, EdTech, future of learning',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
        categoryId: technologyCategory.id,
        authorId: blogAuthor.id,
        tags: ['AI', 'Online Learning', 'EdTech', 'Personalized Education', 'Future Technology'],
      },
    });

    // Add more blogs for pagination testing
    await prisma.blog.create({
      data: {
        title: 'Mathematics: Mastering Calculus for JEE Main 2024',
        slug: 'mathematics-mastering-calculus-jee-main-2024',
        excerpt: 'A comprehensive guide to mastering calculus concepts essential for JEE Main 2024. Learn limits, derivatives, and integration techniques.',
        content: `
          <h2>Mastering Calculus for JEE Main 2024</h2>
          <p>Calculus forms a significant portion of the Mathematics section in JEE Main. Understanding the fundamental concepts and mastering problem-solving techniques is crucial for success.</p>
          
          <h3>Limits and Continuity</h3>
          <p>Master the concept of limits and understand how they form the foundation of calculus. Practice problems involving trigonometric, exponential, and logarithmic limits.</p>
          
          <h3>Differentiation</h3>
          <p>Learn derivative rules and their applications. Focus on implicit differentiation, logarithmic differentiation, and parametric differentiation.</p>
          
          <h3>Integration</h3>
          <p>Master various integration techniques including substitution, integration by parts, and partial fractions. Practice definite integrals and their applications.</p>
        `,
        metaTitle: 'Mathematics: Mastering Calculus for JEE Main 2024',
        metaDescription: 'Comprehensive guide to mastering calculus concepts for JEE Main 2024. Learn limits, derivatives, and integration techniques.',
        metaKeywords: 'calculus, JEE Main, mathematics, limits, derivatives, integration',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        categoryId: studyTipsCategory.id,
        authorId: blogAuthor.id,
        tags: ['Mathematics', 'Calculus', 'JEE Main', 'Study Tips'],
      },
    });

    await prisma.blog.create({
      data: {
        title: 'Physics: Understanding Electromagnetic Waves for NEET',
        slug: 'physics-understanding-electromagnetic-waves-neet',
        excerpt: 'Master electromagnetic waves concepts for NEET preparation. Learn about wave properties, spectrum, and applications in medical imaging.',
        content: `
          <h2>Electromagnetic Waves in NEET Physics</h2>
          <p>Electromagnetic waves are crucial for NEET preparation, especially for students aspiring to join medical colleges. Understanding these concepts is essential for both Physics and Biology sections.</p>
          
          <h3>Properties of Electromagnetic Waves</h3>
          <p>Learn about the transverse nature of EM waves, their speed in vacuum, and how they don't require a medium to propagate.</p>
          
          <h3>Electromagnetic Spectrum</h3>
          <p>Understand the complete spectrum from radio waves to gamma rays, their wavelengths, frequencies, and applications in medicine and technology.</p>
          
          <h3>Medical Applications</h3>
          <p>Study how X-rays, MRI, and other imaging techniques work using electromagnetic waves principles.</p>
        `,
        metaTitle: 'Physics: Understanding Electromagnetic Waves for NEET',
        metaDescription: 'Master electromagnetic waves concepts for NEET preparation. Learn wave properties, spectrum, and medical applications.',
        metaKeywords: 'electromagnetic waves, NEET, physics, medical imaging, spectrum',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1635070041409-e63e36f27ef3?w=800',
        categoryId: examPreparationCategory.id,
        authorId: blogAuthor.id,
        streamId: neetStream.id,
        tags: ['Physics', 'Electromagnetic Waves', 'NEET', 'Medical Physics'],
      },
    });

    await prisma.blog.create({
      data: {
        title: 'Chemistry: Organic Reactions Every JEE Aspirant Must Know',
        slug: 'chemistry-organic-reactions-jee-aspirant-must-know',
        excerpt: 'Essential organic chemistry reactions for JEE preparation. Master reaction mechanisms and synthetic pathways for success.',
        content: `
          <h2>Essential Organic Chemistry Reactions for JEE</h2>
          <p>Organic chemistry is a scoring subject in JEE if you understand the reaction mechanisms and patterns. Here are the most important reactions you must master.</p>
          
          <h3>Substitution Reactions</h3>
          <p>Learn SN1, SN2, and nucleophilic substitution reactions. Understand the factors affecting reaction rates and stereochemistry.</p>
          
          <h3>Elimination Reactions</h3>
          <p>Master E1 and E2 elimination reactions. Practice predicting the major products and understanding regioselectivity.</p>
          
          <h3>Addition Reactions</h3>
          <p>Study electrophilic and nucleophilic addition reactions. Focus on Markovnikov's rule and anti-Markovnikov additions.</p>
        `,
        metaTitle: 'Chemistry: Organic Reactions Every JEE Aspirant Must Know',
        metaDescription: 'Essential organic chemistry reactions for JEE preparation. Master reaction mechanisms and synthetic pathways.',
        metaKeywords: 'organic chemistry, JEE, reactions, mechanisms, synthesis',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
        categoryId: studyTipsCategory.id,
        authorId: blogAuthor.id,
        streamId: jeeStream.id,
        tags: ['Chemistry', 'Organic Reactions', 'JEE', 'Mechanisms'],
      },
    });

    await prisma.blog.create({
      data: {
        title: 'Biology: Cell Division and Genetics for NEET 2024',
        slug: 'biology-cell-division-genetics-neet-2024',
        excerpt: 'Comprehensive study of cell division and genetics concepts for NEET 2024. Master mitosis, meiosis, and inheritance patterns.',
        content: `
          <h2>Cell Division and Genetics for NEET 2024</h2>
          <p>Cell division and genetics form the backbone of Biology section in NEET. Understanding these concepts is crucial for medical aspirants.</p>
          
          <h3>Mitosis and Meiosis</h3>
          <p>Learn the phases of mitosis and meiosis, their significance, and differences. Understand the importance of each phase in cell cycle.</p>
          
          <h3>Mendelian Genetics</h3>
          <p>Master the laws of inheritance, Punnett squares, and genetic crosses. Practice problems involving monohybrid and dihybrid crosses.</p>
          
          <h3>Non-Mendelian Inheritance</h3>
          <p>Study incomplete dominance, codominance, multiple alleles, and sex-linked inheritance patterns.</p>
        `,
        metaTitle: 'Biology: Cell Division and Genetics for NEET 2024',
        metaDescription: 'Comprehensive study of cell division and genetics for NEET 2024. Master mitosis, meiosis, and inheritance patterns.',
        metaKeywords: 'cell division, genetics, NEET, mitosis, meiosis, inheritance',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
        categoryId: examPreparationCategory.id,
        authorId: blogAuthor.id,
        streamId: neetStream.id,
        tags: ['Biology', 'Cell Division', 'Genetics', 'NEET'],
      },
    });

    await prisma.blog.create({
      data: {
        title: 'Career Options After Engineering: Beyond Traditional Roles',
        slug: 'career-options-after-engineering-beyond-traditional-roles',
        excerpt: 'Explore diverse career paths available to engineering graduates. Discover opportunities in entrepreneurship, consulting, and emerging fields.',
        content: `
          <h2>Diverse Career Paths for Engineering Graduates</h2>
          <p>Engineering opens doors to numerous career opportunities beyond traditional engineering roles. Let's explore the diverse paths available to engineering graduates.</p>
          
          <h3>Entrepreneurship and Startups</h3>
          <p>Many engineers are founding successful startups. Learn about the entrepreneurial journey and how to start your own venture.</p>
          
          <h3>Consulting and Advisory</h3>
          <p>Engineering consultants work with companies to solve complex problems and improve processes across various industries.</p>
          
          <h3>Research and Development</h3>
          <p>Join R&D teams in companies or research institutions to work on cutting-edge technologies and innovations.</p>
          
          <h3>Management and Leadership</h3>
          <p>Transition into management roles where your technical background provides a competitive advantage in leading technical teams.</p>
        `,
        metaTitle: 'Career Options After Engineering: Beyond Traditional Roles',
        metaDescription: 'Explore diverse career paths for engineering graduates. Discover opportunities in entrepreneurship, consulting, and emerging fields.',
        metaKeywords: 'engineering careers, entrepreneurship, consulting, career guidance, engineering jobs',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        categoryId: careerGuidanceCategory.id,
        authorId: blogAuthor.id,
        streamId: jeeStream.id,
        tags: ['Career Guidance', 'Engineering', 'Entrepreneurship', 'Consulting'],
      },
    });

    await prisma.blog.create({
      data: {
        title: 'Motivation: Overcoming Exam Anxiety and Building Confidence',
        slug: 'motivation-overcoming-exam-anxiety-building-confidence',
        excerpt: 'Learn effective strategies to overcome exam anxiety and build confidence for competitive exams. Mental preparation is as important as academic preparation.',
        content: `
          <h2>Overcoming Exam Anxiety: A Complete Guide</h2>
          <p>Exam anxiety is common among students preparing for competitive exams. Learning to manage stress and build confidence is crucial for success.</p>
          
          <h3>Understanding Exam Anxiety</h3>
          <p>Recognize the signs of anxiety and understand that some level of stress is normal and can even be beneficial for performance.</p>
          
          <h3>Breathing and Relaxation Techniques</h3>
          <p>Practice deep breathing, meditation, and progressive muscle relaxation to manage anxiety during exams.</p>
          
          <h3>Building Confidence</h3>
          <p>Set realistic goals, celebrate small achievements, and maintain a positive mindset throughout your preparation.</p>
          
          <h3>Exam Day Strategies</h3>
          <p>Learn how to stay calm and focused during the actual exam. Practice time management and question prioritization.</p>
        `,
        metaTitle: 'Motivation: Overcoming Exam Anxiety and Building Confidence',
        metaDescription: 'Learn effective strategies to overcome exam anxiety and build confidence for competitive exams.',
        metaKeywords: 'exam anxiety, motivation, confidence building, stress management, mental preparation',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featuredImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        categoryId: motivationCategory.id,
        authorId: blogAuthor.id,
        tags: ['Motivation', 'Exam Anxiety', 'Confidence', 'Mental Health'],
      },
    });

    console.log('📰 Created blog posts');
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('📋 Demo Data Summary:');
  console.log(`- Users: ${await prisma.user.count()} (1 admin, 2 students)`);
  console.log(`- Streams: ${await prisma.stream.count()} (JEE, NEET, CLAT)`);
  console.log(`- Subjects: ${await prisma.subject.count()} (Physics, Chemistry, Mathematics, Biology)`);
  console.log(`- Topics: ${await prisma.topic.count()}`);
  console.log(`- Subtopics: ${await prisma.subtopic.count()}`);
  console.log(`- Questions: ${await prisma.question.count()}`);
  console.log(`- Tags: ${await prisma.tag.count()}`);
  console.log(`- Plans: ${await prisma.plan.count()}`);
  console.log(`- Exam Papers: ${await prisma.examPaper.count()}`);
  console.log(`- Submissions: ${await prisma.examSubmission.count()}`);
  // Create sample formulas
  console.log('📐 Creating sample formulas...');
  
  const formulas = await Promise.all([
    // Physics Formulas
    prisma.formula.create({
      data: {
        title: 'Newton\'s Second Law',
        formula: 'F = ma',
        description: 'Force equals mass times acceleration',
        subject: 'Physics',
        tags: ['mechanics', 'force', 'acceleration'],
        topicId: mechanics.id,
      },
    }),
    prisma.formula.create({
      data: {
        title: 'Kinematic Equation - Final Velocity',
        formula: 'v = u + at',
        description: 'Final velocity equals initial velocity plus acceleration times time',
        subject: 'Physics',
        tags: ['kinematics', 'velocity', 'acceleration'],
        topicId: mechanics.id,
      },
    }),
    prisma.formula.create({
      data: {
        title: 'Work Done',
        formula: 'W = F ⋅ d ⋅ cos(θ)',
        description: 'Work equals force times displacement times cosine of angle',
        subject: 'Physics',
        tags: ['work', 'energy', 'force'],
        topicId: mechanics.id,
      },
    }),
    prisma.formula.create({
      data: {
        title: 'Electric Field Strength',
        formula: 'E = F/q',
        description: 'Electric field strength equals force divided by charge',
        subject: 'Physics',
        tags: ['electricity', 'electric-field', 'charge'],
        topicId: electricity.id,
      },
    }),
    
    // Chemistry Formulas
    prisma.formula.create({
      data: {
        title: 'Ideal Gas Law',
        formula: 'PV = nRT',
        description: 'Pressure times volume equals moles times gas constant times temperature',
        subject: 'Chemistry',
        tags: ['gas-laws', 'thermodynamics', 'ideal-gas'],
        topicId: physicalChemistry.id,
      },
    }),
    prisma.formula.create({
      data: {
        title: 'Rate of Reaction',
        formula: 'Rate = k[A]^m[B]^n',
        description: 'Rate of reaction equals rate constant times concentration raised to power',
        subject: 'Chemistry',
        tags: ['kinetics', 'rate', 'concentration'],
        topicId: physicalChemistry.id,
      },
    }),
    prisma.formula.create({
      data: {
        title: 'pH Calculation',
        formula: 'pH = -log[H⁺]',
        description: 'pH equals negative logarithm of hydrogen ion concentration',
        subject: 'Chemistry',
        tags: ['acid-base', 'pH', 'concentration'],
        topicId: physicalChemistry.id,
      },
    }),
    
    // Mathematics Formulas
    prisma.formula.create({
      data: {
        title: 'Quadratic Formula',
        formula: 'x = (-b ± √(b² - 4ac)) / 2a',
        description: 'Solution for quadratic equation ax² + bx + c = 0',
        subject: 'Mathematics',
        tags: ['quadratic', 'algebra', 'roots'],
        topicId: algebra.id,
      },
    }),
    prisma.formula.create({
      data: {
        title: 'Derivative of xⁿ',
        formula: 'd/dx(xⁿ) = nx^(n-1)',
        description: 'Power rule for differentiation',
        subject: 'Mathematics',
        tags: ['calculus', 'derivative', 'power-rule'],
        topicId: calculus.id,
      },
    }),
    prisma.formula.create({
      data: {
        title: 'Distance Formula',
        formula: 'd = √((x₂-x₁)² + (y₂-y₁)²)',
        description: 'Distance between two points in coordinate geometry',
        subject: 'Mathematics',
        tags: ['coordinate-geometry', 'distance', 'points'],
        topicId: geometry.id,
      },
    }),
  ]);

  console.log(`📐 Created ${formulas.length} formulas`);

  console.log('📊 Database Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Subjects: ${await prisma.subject.count()}`);
  console.log(`- Topics: ${await prisma.topic.count()}`);
  console.log(`- Subtopics: ${await prisma.subtopic.count()}`);
  console.log(`- Questions: ${await prisma.question.count()}`);
  console.log(`- Tags: ${await prisma.tag.count()}`);
  console.log(`- Plans: ${await prisma.plan.count()}`);
  console.log(`- Streams: ${await prisma.stream.count()}`);
  console.log(`- LMS Content: ${await prisma.lMSContent.count()}`);
  console.log(`- Blog Categories: ${await prisma.blogCategory.count()}`);
  console.log(`- Blog Posts: ${await prisma.blog.count()}`);
  console.log(`- Formulas: ${await prisma.formula.count()}`);
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('Admin: admin@jeeapp.com / admin123');
  console.log('Student 1: student1@example.com / student123');
  console.log('Student 2: student2@example.com / student123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 