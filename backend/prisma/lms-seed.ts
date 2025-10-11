import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LMS hierarchical seeding...');

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

  // Create or find streams
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

  console.log('🎯 Created streams');

  // Create demo student users
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
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      aiTestsUsed: 0,
      aiTestsLimit: 10,
      lastAiResetAt: new Date(),
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      phone: '+919876543212',
      fullName: 'Priya Sharma',
      hashedPassword: await bcrypt.hash('student123', 10),
      role: 'STUDENT',
      emailVerified: true,
      phoneVerified: true,
      streamId: neetStream.id,
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      aiTestsUsed: 0,
      aiTestsLimit: 10,
      lastAiResetAt: new Date(),
    },
  });

  console.log('👥 Created demo students');

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

  const biology = await prisma.subject.create({
    data: {
      name: 'Biology',
      description: 'Biology for NEET',
      streamId: neetStream.id,
    },
  });

  console.log('📚 Created subjects');

  // Create lessons for Physics
  const physicsLesson1 = await prisma.lesson.create({
    data: {
      name: 'Mechanics',
      description: 'Classical mechanics including kinematics, dynamics, and energy',
      subjectId: physics.id,
      order: 1,
    },
  });

  const physicsLesson2 = await prisma.lesson.create({
    data: {
      name: 'Electricity & Magnetism',
      description: 'Electric and magnetic phenomena, circuits, and electromagnetic waves',
      subjectId: physics.id,
      order: 2,
    },
  });

  const physicsLesson3 = await prisma.lesson.create({
    data: {
      name: 'Modern Physics',
      description: 'Quantum mechanics, atomic structure, and nuclear physics',
      subjectId: physics.id,
      order: 3,
    },
  });

  // Create lessons for Chemistry
  const chemLesson1 = await prisma.lesson.create({
    data: {
      name: 'Physical Chemistry',
      description: 'Thermodynamics, kinetics, and equilibrium',
      subjectId: chemistry.id,
      order: 1,
    },
  });

  const chemLesson2 = await prisma.lesson.create({
    data: {
      name: 'Organic Chemistry',
      description: 'Carbon compounds, reactions, and mechanisms',
      subjectId: chemistry.id,
      order: 2,
    },
  });

  const chemLesson3 = await prisma.lesson.create({
    data: {
      name: 'Inorganic Chemistry',
      description: 'Elements, compounds, and periodic properties',
      subjectId: chemistry.id,
      order: 3,
    },
  });

  // Create lessons for Mathematics
  const mathLesson1 = await prisma.lesson.create({
    data: {
      name: 'Algebra',
      description: 'Polynomials, equations, and algebraic structures',
      subjectId: mathematics.id,
      order: 1,
    },
  });

  const mathLesson2 = await prisma.lesson.create({
    data: {
      name: 'Calculus',
      description: 'Differential and integral calculus',
      subjectId: mathematics.id,
      order: 2,
    },
  });

  const mathLesson3 = await prisma.lesson.create({
    data: {
      name: 'Coordinate Geometry',
      description: 'Analytical geometry and conic sections',
      subjectId: mathematics.id,
      order: 3,
    },
  });

  // Create lessons for Biology
  const bioLesson1 = await prisma.lesson.create({
    data: {
      name: 'Cell Biology',
      description: 'Cell structure, function, and molecular biology',
      subjectId: biology.id,
      order: 1,
    },
  });

  const bioLesson2 = await prisma.lesson.create({
    data: {
      name: 'Genetics',
      description: 'Heredity, molecular genetics, and evolution',
      subjectId: biology.id,
      order: 2,
    },
  });

  console.log('📖 Created lessons');

  // Create topics for Physics - Mechanics
  const kinematics = await prisma.topic.create({
    data: {
      name: 'Kinematics',
      description: 'Motion in one and two dimensions',
      subjectId: physics.id,
      lessonId: physicsLesson1.id,
      order: 1,
    },
  });

  const dynamics = await prisma.topic.create({
    data: {
      name: 'Dynamics',
      description: 'Forces and Newton\'s laws of motion',
      subjectId: physics.id,
      lessonId: physicsLesson1.id,
      order: 2,
    },
  });

  const workEnergy = await prisma.topic.create({
    data: {
      name: 'Work, Energy & Power',
      description: 'Energy conservation and work-energy theorem',
      subjectId: physics.id,
      lessonId: physicsLesson1.id,
      order: 3,
    },
  });

  // Create topics for Physics - Electricity & Magnetism
  const electrostatics = await prisma.topic.create({
    data: {
      name: 'Electrostatics',
      description: 'Electric charges, fields, and potential',
      subjectId: physics.id,
      lessonId: physicsLesson2.id,
      order: 1,
    },
  });

  const currentElectricity = await prisma.topic.create({
    data: {
      name: 'Current Electricity',
      description: 'Electric current, resistance, and circuits',
      subjectId: physics.id,
      lessonId: physicsLesson2.id,
      order: 2,
    },
  });

  const magnetism = await prisma.topic.create({
    data: {
      name: 'Magnetism',
      description: 'Magnetic fields and electromagnetic induction',
      subjectId: physics.id,
      lessonId: physicsLesson2.id,
      order: 3,
    },
  });

  // Create topics for Chemistry - Physical Chemistry
  const thermodynamics = await prisma.topic.create({
    data: {
      name: 'Thermodynamics',
      description: 'Heat, work, and energy in chemical systems',
      subjectId: chemistry.id,
      lessonId: chemLesson1.id,
      order: 1,
    },
  });

  const kinetics = await prisma.topic.create({
    data: {
      name: 'Chemical Kinetics',
      description: 'Rate of chemical reactions and mechanisms',
      subjectId: chemistry.id,
      lessonId: chemLesson1.id,
      order: 2,
    },
  });

  // Create topics for Chemistry - Organic Chemistry
  const hydrocarbons = await prisma.topic.create({
    data: {
      name: 'Hydrocarbons',
      description: 'Alkanes, alkenes, alkynes, and aromatic compounds',
      subjectId: chemistry.id,
      lessonId: chemLesson2.id,
      order: 1,
    },
  });

  const functionalGroups = await prisma.topic.create({
    data: {
      name: 'Functional Groups',
      description: 'Alcohols, aldehydes, ketones, and carboxylic acids',
      subjectId: chemistry.id,
      lessonId: chemLesson2.id,
      order: 2,
    },
  });

  // Create topics for Mathematics - Algebra
  const quadraticEquations = await prisma.topic.create({
    data: {
      name: 'Quadratic Equations',
      description: 'Second degree equations and their properties',
      subjectId: mathematics.id,
      lessonId: mathLesson1.id,
      order: 1,
    },
  });

  const sequences = await prisma.topic.create({
    data: {
      name: 'Sequences & Series',
      description: 'Arithmetic and geometric progressions',
      subjectId: mathematics.id,
      lessonId: mathLesson1.id,
      order: 2,
    },
  });

  // Create topics for Mathematics - Calculus
  const limits = await prisma.topic.create({
    data: {
      name: 'Limits & Continuity',
      description: 'Limits of functions and continuity',
      subjectId: mathematics.id,
      lessonId: mathLesson2.id,
      order: 1,
    },
  });

  const derivatives = await prisma.topic.create({
    data: {
      name: 'Differentiation',
      description: 'Derivatives and their applications',
      subjectId: mathematics.id,
      lessonId: mathLesson2.id,
      order: 2,
    },
  });

  // Create topics for Biology - Cell Biology
  const cellStructure = await prisma.topic.create({
    data: {
      name: 'Cell Structure',
      description: 'Prokaryotic and eukaryotic cell organization',
      subjectId: biology.id,
      lessonId: bioLesson1.id,
      order: 1,
    },
  });

  const cellDivision = await prisma.topic.create({
    data: {
      name: 'Cell Division',
      description: 'Mitosis and meiosis processes',
      subjectId: biology.id,
      lessonId: bioLesson1.id,
      order: 2,
    },
  });

  console.log('📝 Created topics');

  // Create subtopics
  const subtopics = await Promise.all([
    // Physics - Kinematics
    prisma.subtopic.create({
      data: {
        name: 'Motion in One Dimension',
        description: 'Linear motion with constant and variable acceleration',
        topicId: kinematics.id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Motion in Two Dimensions',
        description: 'Projectile motion and circular motion',
        topicId: kinematics.id,
        order: 2,
      },
    }),

    // Physics - Dynamics
    prisma.subtopic.create({
      data: {
        name: 'Newton\'s Laws',
        description: 'Three laws of motion and their applications',
        topicId: dynamics.id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Friction',
        description: 'Static and kinetic friction, rolling friction',
        topicId: dynamics.id,
        order: 2,
      },
    }),

    // Physics - Electrostatics
    prisma.subtopic.create({
      data: {
        name: 'Electric Charges',
        description: 'Coulomb\'s law and electric field',
        topicId: electrostatics.id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Electric Potential',
        description: 'Potential energy and electric potential',
        topicId: electrostatics.id,
        order: 2,
      },
    }),

    // Chemistry - Thermodynamics
    prisma.subtopic.create({
      data: {
        name: 'First Law of Thermodynamics',
        description: 'Energy conservation in chemical systems',
        topicId: thermodynamics.id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Second Law of Thermodynamics',
        description: 'Entropy and spontaneity of reactions',
        topicId: thermodynamics.id,
        order: 2,
      },
    }),

    // Chemistry - Hydrocarbons
    prisma.subtopic.create({
      data: {
        name: 'Alkanes',
        description: 'Saturated hydrocarbons and their properties',
        topicId: hydrocarbons.id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Alkenes and Alkynes',
        description: 'Unsaturated hydrocarbons and their reactions',
        topicId: hydrocarbons.id,
        order: 2,
      },
    }),

    // Mathematics - Quadratic Equations
    prisma.subtopic.create({
      data: {
        name: 'Solving Quadratic Equations',
        description: 'Methods to find roots of quadratic equations',
        topicId: quadraticEquations.id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Nature of Roots',
        description: 'Discriminant and nature of quadratic equation roots',
        topicId: quadraticEquations.id,
        order: 2,
      },
    }),

    // Mathematics - Limits
    prisma.subtopic.create({
      data: {
        name: 'Basic Limits',
        description: 'Fundamental limit concepts and properties',
        topicId: limits.id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'L\'Hôpital\'s Rule',
        description: 'Advanced limit evaluation techniques',
        topicId: limits.id,
        order: 2,
      },
    }),

    // Biology - Cell Structure
    prisma.subtopic.create({
      data: {
        name: 'Prokaryotic Cells',
        description: 'Bacterial cell structure and organization',
        topicId: cellStructure.id,
        order: 1,
      },
    }),
    prisma.subtopic.create({
      data: {
        name: 'Eukaryotic Cells',
        description: 'Plant and animal cell structure and organelles',
        topicId: cellStructure.id,
        order: 2,
      },
    }),
  ]);

  console.log('📝 Created subtopics');

  // Create LMS Content
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
        lessonId: physicsLesson1.id,
        topicId: kinematics.id,
        subtopicId: subtopics[0].id,
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
        lessonId: physicsLesson1.id,
        topicId: kinematics.id,
        subtopicId: subtopics[0].id,
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
        lessonId: physicsLesson1.id,
        topicId: kinematics.id,
        subtopicId: subtopics[0].id,
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

    // Physics - Motion in Two Dimensions
    prisma.lMSContent.create({
      data: {
        title: 'Projectile Motion',
        description: 'Motion of objects under gravity in two dimensions',
        contentType: 'VIDEO',
        status: 'PUBLISHED',
        accessType: 'SUBSCRIPTION',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLesson1.id,
        topicId: kinematics.id,
        subtopicId: subtopics[1].id,
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

    // Chemistry - First Law of Thermodynamics
    prisma.lMSContent.create({
      data: {
        title: 'Energy and Work in Chemical Systems',
        description: 'Understanding energy changes in chemical reactions',
        contentType: 'TEXT',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: chemistry.id,
        lessonId: chemLesson1.id,
        topicId: thermodynamics.id,
        subtopicId: subtopics[6].id,
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

    // Mathematics - Solving Quadratic Equations
    prisma.lMSContent.create({
      data: {
        title: 'Quadratic Formula',
        description: 'Using the quadratic formula to solve equations',
        contentType: 'VIDEO',
        status: 'PUBLISHED',
        accessType: 'FREE',
        streamId: jeeStream.id,
        subjectId: mathematics.id,
        lessonId: mathLesson1.id,
        topicId: quadraticEquations.id,
        subtopicId: subtopics[10].id,
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

    // Biology - Prokaryotic Cells
    prisma.lMSContent.create({
      data: {
        title: 'Bacterial Cell Structure',
        description: 'Detailed study of prokaryotic cell organization',
        contentType: 'IMAGE',
        status: 'PUBLISHED',
        accessType: 'PREMIUM',
        streamId: neetStream.id,
        subjectId: biology.id,
        lessonId: bioLesson1.id,
        topicId: cellStructure.id,
        subtopicId: subtopics[14].id,
        difficulty: 'MEDIUM',
        duration: 35,
        order: 1,
        tags: ['bacteria', 'prokaryotic', 'cell-structure'],
        contentData: {
          images: [
            { url: 'https://example.com/images/bacterial-cell-1.jpg', caption: 'Bacterial cell wall structure' },
            { url: 'https://example.com/images/bacterial-cell-2.jpg', caption: 'Internal organization of bacterial cell' }
          ],
          labels: [
            { name: 'Cell Wall', description: 'Rigid outer covering providing shape and protection' },
            { name: 'Cell Membrane', description: 'Selective barrier controlling substance transport' },
            { name: 'Cytoplasm', description: 'Gel-like substance containing cellular components' },
            { name: 'Nucleoid', description: 'Region containing bacterial DNA' }
          ]
        }
      }
    }),

    // Additional content for variety
    prisma.lMSContent.create({
      data: {
        title: 'Newton\'s Laws - Interactive Simulation',
        description: 'Interactive simulation of Newton\'s laws of motion',
        contentType: 'H5P',
        status: 'PUBLISHED',
        accessType: 'SUBSCRIPTION',
        streamId: jeeStream.id,
        subjectId: physics.id,
        lessonId: physicsLesson1.id,
        topicId: dynamics.id,
        subtopicId: subtopics[2].id,
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

    prisma.lMSContent.create({
      data: {
        title: 'Chemical Bonding - Virtual Lab',
        description: 'Virtual laboratory for understanding chemical bonding',
        contentType: 'H5P',
        status: 'PUBLISHED',
        accessType: 'PREMIUM',
        streamId: jeeStream.id,
        subjectId: chemistry.id,
        lessonId: chemLesson2.id,
        topicId: hydrocarbons.id,
        subtopicId: subtopics[8].id,
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
        lessonId: mathLesson2.id,
        topicId: limits.id,
        subtopicId: subtopics[12].id,
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
    })
  ]);

  console.log('📚 Created LMS content');

  // Create progress data for student1 (JEE student)
  const student1Progress = await Promise.all([
    // Physics - Motion in One Dimension (Completed)
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

    // Physics - Projectile Motion (Not Started)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[3].id,
        status: 'NOT_STARTED',
        progress: 0,
        timeSpent: 0,
      }
    }),

    // Chemistry - Thermodynamics (Revisit)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[4].id,
        status: 'REVISIT',
        progress: 100,
        timeSpent: 1500, // 25 minutes
        startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      }
    }),

    // Mathematics - Quadratic Formula (Completed)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[5].id,
        status: 'COMPLETED',
        progress: 100,
        timeSpent: 1200, // 20 minutes
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }
    }),

    // Physics - Newton's Laws (In Progress)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[7].id,
        status: 'IN_PROGRESS',
        progress: 40,
        timeSpent: 900, // 15 minutes
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      }
    }),

    // Chemistry - Chemical Bonding (Not Started)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[8].id,
        status: 'NOT_STARTED',
        progress: 0,
        timeSpent: 0,
      }
    }),

    // Mathematics - Calculus (Completed)
    prisma.lMSProgress.create({
      data: {
        userId: student1.id,
        contentId: lmsContent[9].id,
        status: 'COMPLETED',
        progress: 100,
        timeSpent: 2400, // 40 minutes
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        lastAccessedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      }
    })
  ]);

  // Create progress data for student2 (NEET student)
  const student2Progress = await Promise.all([
    // Biology - Bacterial Cell Structure (Completed)
    prisma.lMSProgress.create({
      data: {
        userId: student2.id,
        contentId: lmsContent[6].id,
        status: 'COMPLETED',
        progress: 100,
        timeSpent: 1800, // 30 minutes
        startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastAccessedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      }
    })
  ]);

  console.log('📊 Created progress data');

  // Create higher-level progress (commented out until migration is run)
  // Note: These will be automatically calculated by the backend when the migration is run
  console.log('⚠️  Higher-level progress tracking will be available after running the database migration');

  console.log('✅ LMS hierarchical seeding completed successfully!');
  console.log('');
  console.log('📋 LMS Data Summary:');
  console.log(`- Subjects: ${await prisma.subject.count()}`);
  console.log(`- Lessons: ${await prisma.lesson.count()}`);
  console.log(`- Topics: ${await prisma.topic.count()}`);
  console.log(`- Subtopics: ${await prisma.subtopic.count()}`);
  console.log(`- LMS Content: ${await prisma.lMSContent.count()}`);
  console.log(`- Student Progress: ${await prisma.lMSProgress.count()}`);
  console.log('');
  console.log('🎯 Demo Students:');
  console.log('Student 1 (JEE): student1@example.com / student123');
  console.log('Student 2 (NEET): student2@example.com / student123');
  console.log('');
  console.log('📚 Content Types Created:');
  console.log('- Videos with transcripts and chapters');
  console.log('- Text content with sections and formulas');
  console.log('- Interactive quizzes and simulations');
  console.log('- Image-based content with labels');
  console.log('- Audio lectures with transcripts');
  console.log('- Virtual labs and experiments');
  console.log('');
  console.log('🔄 Progress Statuses Demonstrated:');
  console.log('- COMPLETED: Fully finished content');
  console.log('- IN_PROGRESS: Partially completed content');
  console.log('- REVIEW: Completed but marked for review');
  console.log('- REVISIT: Completed but needs revisiting');
  console.log('- NOT_STARTED: Not yet attempted');
}

main()
  .catch((e) => {
    console.error('❌ Error during LMS seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
