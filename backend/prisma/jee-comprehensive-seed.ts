import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive JEE LMS seeding...');

  // Clear existing LMS data
  await prisma.lMSProgress.deleteMany();
  await prisma.subjectProgress.deleteMany();
  await prisma.topicProgress.deleteMany();
  await prisma.subtopicProgress.deleteMany();
  await prisma.lMSContent.deleteMany();
  await prisma.subtopic.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.subject.deleteMany();

  console.log('🗑️ Cleared existing LMS data');

  // Create or find JEE stream
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

  // Create demo student
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      email: 'student1@example.com',
      phone: '+919876543211',
      fullName: 'Rahul Kumar',
      hashedPassword: await bcrypt.hash('student123', 10),
      role: 'STUDENT',
      emailVerified: true,
      phoneVerified: true,
      streamId: jeeStream.id,
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      aiTestsUsed: 0,
      aiTestsLimit: 10,
      lastAiResetAt: new Date(),
    },
  });

  console.log('👥 Created demo student');

  // Create subjects
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

  console.log('📚 Created subjects');

  // Create lessons for Physics (5 lessons)
  const physicsLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        name: 'Mechanics',
        description: 'Classical mechanics including kinematics, dynamics, and energy',
        subjectId: physics.id,
        order: 1,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Thermodynamics',
        description: 'Heat, temperature, and energy transfer',
        subjectId: physics.id,
        order: 2,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Electricity & Magnetism',
        description: 'Electric and magnetic phenomena, circuits, and electromagnetic waves',
        subjectId: physics.id,
        order: 3,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Waves & Optics',
        description: 'Wave phenomena, light, and optical systems',
        subjectId: physics.id,
        order: 4,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Modern Physics',
        description: 'Quantum mechanics, atomic structure, and nuclear physics',
        subjectId: physics.id,
        order: 5,
      },
    }),
  ]);

  // Create lessons for Chemistry (5 lessons)
  const chemistryLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        name: 'Physical Chemistry',
        description: 'Thermodynamics, kinetics, and equilibrium',
        subjectId: chemistry.id,
        order: 1,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Organic Chemistry',
        description: 'Carbon compounds, reactions, and mechanisms',
        subjectId: chemistry.id,
        order: 2,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Inorganic Chemistry',
        description: 'Elements, compounds, and periodic properties',
        subjectId: chemistry.id,
        order: 3,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Analytical Chemistry',
        description: 'Quantitative and qualitative analysis',
        subjectId: chemistry.id,
        order: 4,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Environmental Chemistry',
        description: 'Environmental processes and pollution',
        subjectId: chemistry.id,
        order: 5,
      },
    }),
  ]);

  // Create lessons for Mathematics (5 lessons)
  const mathLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        name: 'Algebra',
        description: 'Polynomials, equations, and algebraic structures',
        subjectId: mathematics.id,
        order: 1,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Calculus',
        description: 'Differential and integral calculus',
        subjectId: mathematics.id,
        order: 2,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Coordinate Geometry',
        description: 'Analytical geometry and conic sections',
        subjectId: mathematics.id,
        order: 3,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Trigonometry',
        description: 'Trigonometric functions and identities',
        subjectId: mathematics.id,
        order: 4,
      },
    }),
    prisma.lesson.create({
      data: {
        name: 'Statistics & Probability',
        description: 'Data analysis and probability theory',
        subjectId: mathematics.id,
        order: 5,
      },
    }),
  ]);

  console.log('📖 Created lessons');

  // Create topics for Physics - Mechanics
  const mechanicsTopics = await Promise.all([
    prisma.topic.create({
      data: {
        name: 'Kinematics',
        description: 'Motion in one and two dimensions',
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Dynamics',
        description: 'Forces and Newton\'s laws of motion',
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Work, Energy & Power',
        description: 'Energy conservation and work-energy theorem',
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        order: 3,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Rotational Motion',
        description: 'Angular motion and rotational dynamics',
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        order: 4,
      },
    }),
  ]);

  // Create topics for Physics - Thermodynamics
  const thermodynamicsTopics = await Promise.all([
    prisma.topic.create({
      data: {
        name: 'Heat & Temperature',
        description: 'Thermal properties and heat transfer',
        subjectId: physics.id,
        lessonId: physicsLessons[1].id,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Laws of Thermodynamics',
        description: 'Energy conservation and entropy',
        subjectId: physics.id,
        lessonId: physicsLessons[1].id,
        order: 2,
      },
    }),
  ]);

  // Create topics for Physics - Electricity & Magnetism
  const electricityTopics = await Promise.all([
    prisma.topic.create({
      data: {
        name: 'Electrostatics',
        description: 'Electric charges, fields, and potential',
        subjectId: physics.id,
        lessonId: physicsLessons[2].id,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Current Electricity',
        description: 'Electric current, resistance, and circuits',
        subjectId: physics.id,
        lessonId: physicsLessons[2].id,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Magnetism',
        description: 'Magnetic fields and electromagnetic induction',
        subjectId: physics.id,
        lessonId: physicsLessons[2].id,
        order: 3,
      },
    }),
  ]);

  // Create topics for Chemistry - Physical Chemistry
  const physicalChemTopics = await Promise.all([
    prisma.topic.create({
      data: {
        name: 'Thermodynamics',
        description: 'Heat, work, and energy in chemical systems',
        subjectId: chemistry.id,
        lessonId: chemistryLessons[0].id,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Chemical Kinetics',
        description: 'Rate of chemical reactions and mechanisms',
        subjectId: chemistry.id,
        lessonId: chemistryLessons[0].id,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Chemical Equilibrium',
        description: 'Dynamic equilibrium and Le Chatelier\'s principle',
        subjectId: chemistry.id,
        lessonId: chemistryLessons[0].id,
        order: 3,
      },
    }),
  ]);

  // Create topics for Chemistry - Organic Chemistry
  const organicChemTopics = await Promise.all([
    prisma.topic.create({
      data: {
        name: 'Hydrocarbons',
        description: 'Alkanes, alkenes, alkynes, and aromatic compounds',
        subjectId: chemistry.id,
        lessonId: chemistryLessons[1].id,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Functional Groups',
        description: 'Alcohols, aldehydes, ketones, and carboxylic acids',
        subjectId: chemistry.id,
        lessonId: chemistryLessons[1].id,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Reaction Mechanisms',
        description: 'Substitution, elimination, and addition reactions',
        subjectId: chemistry.id,
        lessonId: chemistryLessons[1].id,
        order: 3,
      },
    }),
  ]);

  // Create topics for Mathematics - Algebra
  const algebraTopics = await Promise.all([
    prisma.topic.create({
      data: {
        name: 'Quadratic Equations',
        description: 'Second degree equations and their properties',
        subjectId: mathematics.id,
        lessonId: mathLessons[0].id,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Sequences & Series',
        description: 'Arithmetic and geometric progressions',
        subjectId: mathematics.id,
        lessonId: mathLessons[0].id,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Complex Numbers',
        description: 'Complex number operations and properties',
        subjectId: mathematics.id,
        lessonId: mathLessons[0].id,
        order: 3,
      },
    }),
  ]);

  // Create topics for Mathematics - Calculus
  const calculusTopics = await Promise.all([
    prisma.topic.create({
      data: {
        name: 'Limits & Continuity',
        description: 'Limits of functions and continuity',
        subjectId: mathematics.id,
        lessonId: mathLessons[1].id,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Differentiation',
        description: 'Derivatives and their applications',
        subjectId: mathematics.id,
        lessonId: mathLessons[1].id,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Integration',
        description: 'Indefinite and definite integrals',
        subjectId: mathematics.id,
        lessonId: mathLessons[1].id,
        order: 3,
      },
    }),
  ]);

  console.log('📝 Created topics');

  // Create subtopics for Kinematics
  const kinematicsSubtopics = await Promise.all([
    prisma.subtopic.create({
      data: {
        name: 'Motion in One Dimension',
        description: 'Linear motion with constant and variable acceleration',
        topicId: mechanicsTopics[0].id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Motion in Two Dimensions',
        description: 'Projectile motion and circular motion',
        topicId: mechanicsTopics[0].id,
        order: 2,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Relative Motion',
        description: 'Motion observed from different reference frames',
        topicId: mechanicsTopics[0].id,
        order: 3,
      },
    }),
  ]);

  // Create subtopics for Dynamics
  const dynamicsSubtopics = await Promise.all([
    prisma.subtopic.create({
      data: {
        name: 'Newton\'s Laws',
        description: 'Three laws of motion and their applications',
        topicId: mechanicsTopics[1].id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Friction',
        description: 'Static and kinetic friction, rolling friction',
        topicId: mechanicsTopics[1].id,
        order: 2,
      },
    }),
  ]);

  // Create subtopics for Electrostatics
  const electrostaticsSubtopics = await Promise.all([
    prisma.subtopic.create({
      data: {
        name: 'Electric Charges',
        description: 'Coulomb\'s law and electric field',
        topicId: electricityTopics[0].id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Electric Potential',
        description: 'Potential energy and electric potential',
        topicId: electricityTopics[0].id,
        order: 2,
      },
    }),
  ]);

  // Create subtopics for Hydrocarbons
  const hydrocarbonsSubtopics = await Promise.all([
    prisma.subtopic.create({
      data: {
        name: 'Alkanes',
        description: 'Saturated hydrocarbons and their properties',
        topicId: organicChemTopics[0].id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Alkenes and Alkynes',
        description: 'Unsaturated hydrocarbons and their reactions',
        topicId: organicChemTopics[0].id,
        order: 2,
      },
    }),
  ]);

  // Create subtopics for Quadratic Equations
  const quadraticSubtopics = await Promise.all([
    prisma.subtopic.create({
      data: {
        name: 'Solving Quadratic Equations',
        description: 'Methods to find roots of quadratic equations',
        topicId: algebraTopics[0].id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Nature of Roots',
        description: 'Discriminant and nature of quadratic equation roots',
        topicId: algebraTopics[0].id,
        order: 2,
      },
    }),
  ]);

  console.log('📝 Created subtopics');

  // Create comprehensive LMS Content
  const lmsContent = await Promise.all([
    // Physics - Motion in One Dimension
    prisma.lMSContent.create({
      data: {
        title: 'Introduction to Motion',
        description: 'Basic concepts of motion, displacement, velocity, and acceleration',
        contentType: 'VIDEO',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        topicId: mechanicsTopics[0].id,
        subtopicId: kinematicsSubtopics[0].id,
        difficulty: 'EASY',
        duration: 30,
        order: 1,
        tags: ['motion', 'kinematics', 'basics'],
        contentData: {
          videoUrl: 'https://example.com/videos/motion-intro.mp4',
          transcript: 'Welcome to our introduction to motion. In this video, we will explore the fundamental concepts...',
          chapters: [
            { title: 'What is Motion?', timestamp: '00:00' },
            { title: 'Displacement vs Distance', timestamp: '05:30' },
            { title: 'Velocity and Speed', timestamp: '12:15' },
            { title: 'Acceleration', timestamp: '18:45' }
          ]
        }
      }
    }),

    prisma.lMSContent.create({
      data: {
        title: 'Equations of Motion',
        description: 'Derivation and application of kinematic equations',
        contentType: 'TEXT',
        status: 'PUBLISHED',
        accessType: 'SUBSCRIPTION',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        topicId: mechanicsTopics[0].id,
        subtopicId: kinematicsSubtopics[0].id,
        difficulty: 'MEDIUM',
        duration: 45,
        order: 2,
        tags: ['equations', 'kinematics', 'derivation'],
        contentData: {
          content: 'The equations of motion are fundamental tools in physics...',
          sections: [
            { title: 'First Equation: v = u + at', content: 'This equation relates final velocity to initial velocity...' },
            { title: 'Second Equation: s = ut + ½at²', content: 'This equation gives displacement as a function of time...' },
            { title: 'Third Equation: v² = u² + 2as', content: 'This equation relates velocity to displacement...' }
          ],
          formulas: [
            { name: 'v = u + at', description: 'Final velocity equation' },
            { name: 's = ut + ½at²', description: 'Displacement equation' },
            { name: 'v² = u² + 2as', description: 'Velocity-displacement relation' }
          ]
        }
      }
    }),

    prisma.lMSContent.create({
      data: {
        title: 'Motion in One Dimension - Practice Problems',
        description: 'Solve problems involving motion in one dimension',
        contentType: 'QUIZ',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        topicId: mechanicsTopics[0].id,
        subtopicId: kinematicsSubtopics[0].id,
        difficulty: 'MEDIUM',
        duration: 20,
        order: 3,
        tags: ['practice', 'problems', 'kinematics'],
        contentData: {
          questions: [
            {
              question: 'A car accelerates from rest at 2 m/s² for 10 seconds. What is its final velocity?',
              options: ['10 m/s', '20 m/s', '30 m/s', '40 m/s'],
              correctAnswer: 1,
              explanation: 'Using v = u + at, where u = 0, a = 2 m/s², t = 10s, we get v = 0 + 2(10) = 20 m/s'
            },
            {
              question: 'A ball is thrown vertically upward with velocity 20 m/s. How high does it go?',
              options: ['10 m', '20 m', '30 m', '40 m'],
              correctAnswer: 1,
              explanation: 'Using v² = u² + 2as, at maximum height v = 0, so 0 = 400 - 2(10)h, giving h = 20 m'
            }
          ]
        }
      }
    }),

    // Physics - Projectile Motion
    prisma.lMSContent.create({
      data: {
        title: 'Projectile Motion',
        description: 'Motion of objects under gravity in two dimensions',
        contentType: 'VIDEO',
        status: 'PUBLISHED',
        accessType: 'SUBSCRIPTION',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        topicId: mechanicsTopics[0].id,
        subtopicId: kinematicsSubtopics[1].id,
        difficulty: 'HARD',
        duration: 60,
        order: 1,
        tags: ['projectile', 'motion', 'gravity'],
        contentData: {
          videoUrl: 'https://example.com/videos/projectile-motion.mp4',
          transcript: 'Projectile motion is a classic example of motion in two dimensions...',
          chapters: [
            { title: 'Horizontal and Vertical Components', timestamp: '00:00' },
            { title: 'Time of Flight', timestamp: '15:30' },
            { title: 'Maximum Height', timestamp: '25:45' },
            { title: 'Range of Projectile', timestamp: '35:20' }
          ]
        }
      }
    }),

    // Physics - Newton's Laws
    prisma.lMSContent.create({
      data: {
        title: 'Newton\'s Laws - Interactive Simulation',
        description: 'Interactive simulation of Newton\'s laws of motion',
        contentType: 'H5P',
        status: 'PUBLISHED',
        accessType: 'SUBSCRIPTION',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        topicId: mechanicsTopics[1].id,
        subtopicId: dynamicsSubtopics[0].id,
        difficulty: 'MEDIUM',
        duration: 45,
        order: 1,
        tags: ['newton', 'laws', 'simulation', 'interactive'],
        contentData: {
          simulationUrl: 'https://example.com/simulations/newton-laws',
          instructions: 'Use the simulation to explore Newton\'s three laws of motion...',
          activities: [
            { title: 'First Law Demo', description: 'Observe objects at rest and in motion' },
            { title: 'Second Law Experiment', description: 'Change force and mass to see acceleration' },
            { title: 'Third Law Pairs', description: 'Identify action-reaction force pairs' }
          ]
        }
      }
    }),

    // Physics - Electrostatics
    prisma.lMSContent.create({
      data: {
        title: 'Coulomb\'s Law',
        description: 'Understanding electric forces between charges',
        contentType: 'TEXT',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLessons[2].id,
        topicId: electricityTopics[0].id,
        subtopicId: electrostaticsSubtopics[0].id,
        difficulty: 'MEDIUM',
        duration: 40,
        order: 1,
        tags: ['coulomb', 'electric-force', 'charges'],
        contentData: {
          content: 'Coulomb\'s law describes the electrostatic force between two point charges...',
          sections: [
            { title: 'Mathematical Form', content: 'F = k|q₁q₂|/r² where k is Coulomb\'s constant...' },
            { title: 'Direction of Force', content: 'Like charges repel, unlike charges attract...' },
            { title: 'Superposition Principle', content: 'Net force is the vector sum of individual forces...' }
          ]
        }
      }
    }),

    // Chemistry - Thermodynamics
    prisma.lMSContent.create({
      data: {
        title: 'First Law of Thermodynamics',
        description: 'Energy conservation in chemical systems',
        contentType: 'TEXT',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: chemistry.id,
        lessonId: chemistryLessons[0].id,
        topicId: physicalChemTopics[0].id,
        difficulty: 'MEDIUM',
        duration: 40,
        order: 1,
        tags: ['thermodynamics', 'energy', 'first-law'],
        contentData: {
          content: 'The first law of thermodynamics is a statement of energy conservation...',
          sections: [
            { title: 'Internal Energy', content: 'Internal energy is the total energy of a system...' },
            { title: 'Heat and Work', content: 'Heat and work are two ways energy can be transferred...' },
            { title: 'First Law Statement', content: 'ΔU = Q - W, where ΔU is change in internal energy...' }
          ]
        }
      }
    }),

    // Chemistry - Hydrocarbons
    prisma.lMSContent.create({
      data: {
        title: 'Alkanes - Properties and Reactions',
        description: 'Understanding saturated hydrocarbons',
        contentType: 'VIDEO',
        status: 'PUBLISHED',
        accessType: 'SUBSCRIPTION',
        streamId: jeeStream.id,
        subjectId: chemistry.id,
        lessonId: chemistryLessons[1].id,
        topicId: organicChemTopics[0].id,
        subtopicId: hydrocarbonsSubtopics[0].id,
        difficulty: 'EASY',
        duration: 35,
        order: 1,
        tags: ['alkanes', 'hydrocarbons', 'organic'],
        contentData: {
          videoUrl: 'https://example.com/videos/alkanes.mp4',
          transcript: 'Alkanes are the simplest class of organic compounds...',
          chapters: [
            { title: 'Structure of Alkanes', timestamp: '00:00' },
            { title: 'Physical Properties', timestamp: '10:15' },
            { title: 'Chemical Reactions', timestamp: '20:30' }
          ]
        }
      }
    }),

    // Mathematics - Quadratic Equations
    prisma.lMSContent.create({
      data: {
        title: 'Quadratic Formula',
        description: 'Using the quadratic formula to solve equations',
        contentType: 'VIDEO',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: mathematics.id,
        lessonId: mathLessons[0].id,
        topicId: algebraTopics[0].id,
        subtopicId: quadraticSubtopics[0].id,
        difficulty: 'EASY',
        duration: 25,
        order: 1,
        tags: ['quadratic', 'formula', 'algebra'],
        contentData: {
          videoUrl: 'https://example.com/videos/quadratic-formula.mp4',
          transcript: 'The quadratic formula is a powerful tool for solving quadratic equations...',
          chapters: [
            { title: 'Derivation of Formula', timestamp: '00:00' },
            { title: 'Using the Formula', timestamp: '08:15' },
            { title: 'Practice Examples', timestamp: '15:30' }
          ]
        }
      }
    }),

    // Mathematics - Limits
    prisma.lMSContent.create({
      data: {
        title: 'Introduction to Limits',
        description: 'Understanding the concept of limits in calculus',
        contentType: 'TEXT',
        status: 'PUBLISHED',
        accessType: 'SUBSCRIPTION',
        streamId: jeeStream.id,
        subjectId: mathematics.id,
        lessonId: mathLessons[1].id,
        topicId: calculusTopics[0].id,
        difficulty: 'MEDIUM',
        duration: 50,
        order: 1,
        tags: ['limits', 'calculus', 'introduction'],
        contentData: {
          content: 'Limits are fundamental to understanding calculus...',
          sections: [
            { title: 'What is a Limit?', content: 'A limit describes the behavior of a function...' },
            { title: 'Evaluating Limits', content: 'Various techniques for finding limits...' },
            { title: 'Limit Laws', content: 'Properties that make limit evaluation easier...' }
          ]
        }
      }
    }),

    // Additional content for variety
    prisma.lMSContent.create({
      data: {
        title: 'Chemical Bonding - Virtual Lab',
        description: 'Virtual laboratory for understanding chemical bonding',
        contentType: 'H5P',
        status: 'PUBLISHED',
        accessType: 'PREMIUM',
        streamId: jeeStream.id,
        subjectId: chemistry.id,
        lessonId: chemistryLessons[1].id,
        topicId: organicChemTopics[0].id,
        subtopicId: hydrocarbonsSubtopics[1].id,
        difficulty: 'HARD',
        duration: 60,
        order: 1,
        tags: ['bonding', 'virtual-lab', 'interactive'],
        contentData: {
          labUrl: 'https://example.com/labs/chemical-bonding',
          experiments: [
            { title: 'Ionic Bond Formation', description: 'Observe electron transfer between atoms' },
            { title: 'Covalent Bond Sharing', description: 'Explore electron sharing in molecules' },
            { title: 'Bond Strength Comparison', description: 'Compare different types of bonds' }
          ]
        }
      }
    }),

    prisma.lMSContent.create({
      data: {
        title: 'Calculus Fundamentals - Audio Lecture',
        description: 'Audio lecture covering basic calculus concepts',
        contentType: 'AUDIO',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: mathematics.id,
        lessonId: mathLessons[1].id,
        topicId: calculusTopics[0].id,
        difficulty: 'MEDIUM',
        duration: 50,
        order: 1,
        tags: ['calculus', 'limits', 'audio', 'lecture'],
        contentData: {
          audioUrl: 'https://example.com/audio/calculus-fundamentals.mp3',
          transcript: 'Welcome to our audio lecture on calculus fundamentals...',
          chapters: [
            { title: 'What are Limits?', timestamp: '00:00' },
            { title: 'Evaluating Limits', timestamp: '12:30' },
            { title: 'Limit Laws', timestamp: '25:15' },
            { title: 'Continuity', timestamp: '38:45' }
          ]
        }
      }
    }),

    // Direct lesson content (not under topics)
    prisma.lMSContent.create({
      data: {
        title: 'Mechanics Overview',
        description: 'Complete overview of classical mechanics',
        contentType: 'TEXT',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        difficulty: 'EASY',
        duration: 30,
        order: 0,
        tags: ['mechanics', 'overview', 'introduction'],
        contentData: {
          content: 'Classical mechanics is the branch of physics that deals with the motion of objects...',
          sections: [
            { title: 'Historical Development', content: 'From Galileo to Newton...' },
            { title: 'Key Concepts', content: 'Force, mass, acceleration, and energy...' },
            { title: 'Applications', content: 'Real-world applications of mechanics...' }
          ]
        }
      }
    }),

    // Direct topic content (not under subtopics)
    prisma.lMSContent.create({
      data: {
        title: 'Kinematics Fundamentals',
        description: 'Basic concepts of motion without going into subtopics',
        contentType: 'VIDEO',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLessons[0].id,
        topicId: mechanicsTopics[0].id,
        difficulty: 'EASY',
        duration: 25,
        order: 0,
        tags: ['kinematics', 'fundamentals', 'motion'],
        contentData: {
          videoUrl: 'https://example.com/videos/kinematics-fundamentals.mp4',
          transcript: 'Kinematics is the study of motion without considering its causes...',
          chapters: [
            { title: 'Position and Displacement', timestamp: '00:00' },
            { title: 'Velocity and Speed', timestamp: '08:30' },
            { title: 'Acceleration', timestamp: '16:45' }
          ]
        }
      }
    })
  ]);

  console.log('📚 Created comprehensive LMS content');

  // Create progress data for student1
  const student1Progress = await Promise.all([
    // Physics - Introduction to Motion (Completed)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[0].id,
        status: 'COMPLETED',
        progress: 100,
        timeSpent: 1800, // 30 minutes
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        lastAccessedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      }
    }),

    // Physics - Equations of Motion (In Progress)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[1].id,
        status: 'IN_PROGRESS',
        progress: 65,
        timeSpent: 1200, // 20 minutes
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      }
    }),

    // Physics - Practice Problems (Review)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[2].id,
        status: 'REVIEW',
        progress: 100,
        timeSpent: 900, // 15 minutes
        startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      }
    }),

    // Mathematics - Quadratic Formula (Completed)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[8].id,
        status: 'COMPLETED',
        progress: 100,
        timeSpent: 1200, // 20 minutes
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }
    }),

    // Chemistry - Thermodynamics (Revisit)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[6].id,
        status: 'REVISIT',
        progress: 100,
        timeSpent: 1500, // 25 minutes
        startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      }
    })
  ]);

  console.log('📊 Created progress data');

  console.log('✅ Comprehensive JEE LMS seeding completed successfully!');
  console.log('');
  console.log('📋 JEE LMS Data Summary:');
  console.log(`- Subjects: ${await prisma.subject.count()}`);
  console.log(`- Lessons: ${await prisma.lesson.count()}`);
  console.log(`- Topics: ${await prisma.topic.count()}`);
  console.log(`- Subtopics: ${await prisma.subtopic.count()}`);
  console.log(`- LMS Content: ${await prisma.lMSContent.count()}`);
  console.log(`- Student Progress: ${await prisma.lMSProgress.count()}`);
  console.log('');
  console.log('🎯 Demo Student:');
  console.log('Student 1 (JEE): student1@example.com / student123');
  console.log('');
  console.log('📚 Content Structure:');
  console.log('- Physics: 5 lessons, 9 topics, 6 subtopics, 8 content items');
  console.log('- Chemistry: 5 lessons, 6 topics, 4 subtopics, 4 content items');
  console.log('- Mathematics: 5 lessons, 6 topics, 4 subtopics, 4 content items');
  console.log('');
  console.log('🔄 Progress Statuses:');
  console.log('- COMPLETED: Fully finished content');
  console.log('- IN_PROGRESS: Partially completed content');
  console.log('- REVIEW: Completed but marked for review');
  console.log('- REVISIT: Completed but needs revisiting');
  console.log('- NOT_STARTED: Not yet attempted');
}

main()
  .catch((e) => {
    console.error('❌ Error during JEE LMS seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
