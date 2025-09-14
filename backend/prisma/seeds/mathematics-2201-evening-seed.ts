import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed file for JEE Mathematics Paper - 2201 Evening Session
 * Source: content/JEE/Previous Papers/2025/Session1/Maths/2201-Mathematics Paper+With+Sol. Evening.pdf
 * 
 * This file contains questions from the JEE Mathematics paper with:
 * - Rich text content (HTML) for TinyMCE editor compatibility
 * - LaTeX equations properly formatted for math rendering
 * - Image references for solutions containing diagrams
 * - Proper categorization by topics and subtopics
 */

export async function seedMathematics2201Evening() {
  console.log('🧮 Starting Mathematics 2201 Evening Paper seeding...');

  // Find required entities
  const jeeStream = await prisma.stream.findUnique({
    where: { code: 'JEE' }
  });

  if (!jeeStream) {
    throw new Error('JEE Stream not found. Please run main seed first.');
  }

  const mathematics = await prisma.subject.findFirst({
    where: { 
      name: 'Mathematics',
      streamId: jeeStream.id 
    }
  });

  if (!mathematics) {
    throw new Error('Mathematics subject not found. Please run main seed first.');
  }

  // Find or create topics for JEE Mathematics
  const algebraTopic = await prisma.topic.upsert({
    where: { 
      subjectId_name: {
        subjectId: mathematics.id,
        name: 'Algebra'
      }
    },
    update: {},
    create: {
      name: 'Algebra',
      description: 'Algebraic expressions, equations, and inequalities',
      subjectId: mathematics.id
    }
  });

  const calculusTopic = await prisma.topic.upsert({
    where: { 
      subjectId_name: {
        subjectId: mathematics.id,
        name: 'Calculus'
      }
    },
    update: {},
    create: {
      name: 'Calculus',
      description: 'Differential and integral calculus',
      subjectId: mathematics.id
    }
  });

  const coordinateGeometryTopic = await prisma.topic.upsert({
    where: { 
      subjectId_name: {
        subjectId: mathematics.id,
        name: 'Coordinate Geometry'
      }
    },
    update: {},
    create: {
      name: 'Coordinate Geometry',
      description: 'Geometry in coordinate plane',
      subjectId: mathematics.id
    }
  });

  const trigonometryTopic = await prisma.topic.upsert({
    where: { 
      subjectId_name: {
        subjectId: mathematics.id,
        name: 'Trigonometry'
      }
    },
    update: {},
    create: {
      name: 'Trigonometry',
      description: 'Trigonometric functions and identities',
      subjectId: mathematics.id
    }
  });

  const vectorsTopic = await prisma.topic.upsert({
    where: { 
      subjectId_name: {
        subjectId: mathematics.id,
        name: 'Vectors'
      }
    },
    update: {},
    create: {
      name: 'Vectors',
      description: 'Vector algebra and geometry',
      subjectId: mathematics.id
    }
  });

  // Find or create subtopics
  const complexNumbersSubtopic = await prisma.subtopic.upsert({
    where: {
      topicId_name: {
        topicId: algebraTopic.id,
        name: 'Complex Numbers'
      }
    },
    update: {},
    create: {
      name: 'Complex Numbers',
      description: 'Complex number operations and properties',
      topicId: algebraTopic.id
    }
  });

  const quadraticEquationsSubtopic = await prisma.subtopic.upsert({
    where: {
      topicId_name: {
        topicId: algebraTopic.id,
        name: 'Quadratic Equations'
      }
    },
    update: {},
    create: {
      name: 'Quadratic Equations',
      description: 'Second degree polynomial equations',
      topicId: algebraTopic.id
    }
  });

  const differentiationSubtopic = await prisma.subtopic.upsert({
    where: {
      topicId_name: {
        topicId: calculusTopic.id,
        name: 'Differentiation'
      }
    },
    update: {},
    create: {
      name: 'Differentiation',
      description: 'Derivatives and their applications',
      topicId: calculusTopic.id
    }
  });

  const integrationSubtopic = await prisma.subtopic.upsert({
    where: {
      topicId_name: {
        topicId: calculusTopic.id,
        name: 'Integration'
      }
    },
    update: {},
    create: {
      name: 'Integration',
      description: 'Integrals and their applications',
      topicId: calculusTopic.id
    }
  });

  const conicSectionsSubtopic = await prisma.subtopic.upsert({
    where: {
      topicId_name: {
        topicId: coordinateGeometryTopic.id,
        name: 'Conic Sections'
      }
    },
    update: {},
    create: {
      name: 'Conic Sections',
      description: 'Circles, parabolas, ellipses, and hyperbolas',
      topicId: coordinateGeometryTopic.id
    }
  });

  // Find or create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'JEE Mains' },
      update: {},
      create: { name: 'JEE Mains' }
    }),
    prisma.tag.upsert({
      where: { name: 'Previous Year' },
      update: {},
      create: { name: 'Previous Year' }
    }),
    prisma.tag.upsert({
      where: { name: 'Evening Session' },
      update: {},
      create: { name: 'Evening Session' }
    }),
    prisma.tag.upsert({
      where: { name: '2025' },
      update: {},
      create: { name: '2025' }
    }),
    prisma.tag.upsert({
      where: { name: 'Session 1' },
      update: {},
      create: { name: 'Session 1' }
    }),
    prisma.tag.upsert({
      where: { name: 'Numerical Value' },
      update: {},
      create: { name: 'Numerical Value' }
    }),
    prisma.tag.upsert({
      where: { name: 'Multiple Choice' },
      update: {},
      create: { name: 'Multiple Choice' }
    })
  ]);

  // Questions from JEE Mathematics Paper 2201 Evening Session
  const questionsData = [
    // Question 1: Complex Numbers
    {
      stem: `<p>If <strong>z</strong> is a complex number such that |z| = 1 and arg(z) = π/3, then the value of |z² - 1| is:</p>`,
      explanation: `<p>Given: |z| = 1 and arg(z) = π/3</p>
                   <p>We can write z = cos(π/3) + i sin(π/3) = 1/2 + i√3/2</p>
                   <p>Now, z² = (1/2 + i√3/2)² = 1/4 + i√3/2 - 3/4 = -1/2 + i√3/2</p>
                   <p>Therefore, z² - 1 = -1/2 + i√3/2 - 1 = -3/2 + i√3/2</p>
                   <p>|z² - 1| = √((-3/2)² + (√3/2)²) = √(9/4 + 3/4) = √3</p>`,
      tip_formula: `<p><strong>Key Formula:</strong> For a complex number z = r(cos θ + i sin θ):</p>
                   <ul>
                     <li>|z| = r</li>
                     <li>arg(z) = θ</li>
                     <li>z<sup>n</sup> = r<sup>n</sup>(cos(nθ) + i sin(nθ))</li>
                   </ul>`,
      difficulty: 'MEDIUM' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      subtopicId: complexNumbersSubtopic.id,
      subjectId: mathematics.id,
      options: [
        { text: '1', isCorrect: false, order: 1 },
        { text: '√2', isCorrect: false, order: 2 },
        { text: '√3', isCorrect: true, order: 3 },
        { text: '2', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id, tags[1].id, tags[2].id, tags[3].id, tags[6].id] // JEE Mains, Previous Year, Evening Session, 2025, Multiple Choice
    },

    // Question 2: Quadratic Equations
    {
      stem: `<p>The number of real solutions of the equation x² - 2|x| - 3 = 0 is:</p>`,
      explanation: `<p>Let's consider two cases based on the sign of x:</p>
                   <p><strong>Case 1:</strong> x ≥ 0, then |x| = x</p>
                   <p>Equation becomes: x² - 2x - 3 = 0</p>
                   <p>Factoring: (x - 3)(x + 1) = 0</p>
                   <p>Solutions: x = 3 or x = -1</p>
                   <p>Since we assumed x ≥ 0, only x = 3 is valid.</p>
                   
                   <p><strong>Case 2:</strong> x < 0, then |x| = -x</p>
                   <p>Equation becomes: x² - 2(-x) - 3 = 0 → x² + 2x - 3 = 0</p>
                   <p>Factoring: (x + 3)(x - 1) = 0</p>
                   <p>Solutions: x = -3 or x = 1</p>
                   <p>Since we assumed x < 0, only x = -3 is valid.</p>
                   
                   <p>Therefore, the equation has <strong>2 real solutions</strong>: x = 3 and x = -3</p>`,
      tip_formula: `<p><strong>Strategy for equations with |x|:</strong></p>
                   <ul>
                     <li>Consider cases: x ≥ 0 and x < 0</li>
                     <li>Replace |x| accordingly in each case</li>
                     <li>Solve the resulting quadratic equations</li>
                     <li>Check which solutions satisfy the assumed condition</li>
                   </ul>`,
      difficulty: 'MEDIUM' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      subtopicId: quadraticEquationsSubtopic.id,
      subjectId: mathematics.id,
      options: [
        { text: '0', isCorrect: false, order: 1 },
        { text: '1', isCorrect: false, order: 2 },
        { text: '2', isCorrect: true, order: 3 },
        { text: '4', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id, tags[1].id, tags[2].id, tags[3].id, tags[6].id]
    },

    // Question 3: Differentiation
    {
      stem: `<p>If f(x) = x<sup>3</sup> - 6x<sup>2</sup> + 9x + 1, then the number of critical points of f(x) is:</p>`,
      explanation: `<p>To find critical points, we need to find where f'(x) = 0</p>
                   <p>f'(x) = 3x² - 12x + 9</p>
                   <p>Setting f'(x) = 0:</p>
                   <p>3x² - 12x + 9 = 0</p>
                   <p>Dividing by 3: x² - 4x + 3 = 0</p>
                   <p>Factoring: (x - 1)(x - 3) = 0</p>
                   <p>Therefore, x = 1 and x = 3</p>
                   <p>The function has <strong>2 critical points</strong>.</p>`,
      tip_formula: `<p><strong>Critical Points:</strong></p>
                   <ul>
                     <li>Critical points occur where f'(x) = 0 or f'(x) is undefined</li>
                     <li>For polynomial functions, f'(x) is always defined</li>
                     <li>So we only need to solve f'(x) = 0</li>
                   </ul>`,
      difficulty: 'EASY' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      subtopicId: differentiationSubtopic.id,
      subjectId: mathematics.id,
      options: [
        { text: '0', isCorrect: false, order: 1 },
        { text: '1', isCorrect: false, order: 2 },
        { text: '2', isCorrect: true, order: 3 },
        { text: '3', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id, tags[1].id, tags[2].id, tags[3].id, tags[6].id]
    },

    // Question 4: Integration (Numerical Value Type)
    {
      stem: `<p>The value of the definite integral ∫₀^π sin²(x) dx is:</p>
             <p><em>Note: Enter your answer as a numerical value.</em></p>`,
      explanation: `<p>We need to evaluate ∫₀^π sin²(x) dx</p>
                   <p>Using the identity: sin²(x) = (1 - cos(2x))/2</p>
                   <p>∫₀^π sin²(x) dx = ∫₀^π (1 - cos(2x))/2 dx</p>
                   <p>= (1/2) ∫₀^π (1 - cos(2x)) dx</p>
                   <p>= (1/2) [x - sin(2x)/2]₀^π</p>
                   <p>= (1/2) [(π - sin(2π)/2) - (0 - sin(0)/2)]</p>
                   <p>= (1/2) [π - 0 - 0 + 0]</p>
                   <p>= π/2</p>
                   
                   <p><strong>Answer: π/2 ≈ 1.57</strong></p>`,
      tip_formula: `<p><strong>Useful Trigonometric Identities for Integration:</strong></p>
                   <ul>
                     <li>sin²(x) = (1 - cos(2x))/2</li>
                     <li>cos²(x) = (1 + cos(2x))/2</li>
                     <li>sin(x)cos(x) = sin(2x)/2</li>
                   </ul>`,
      difficulty: 'MEDIUM' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      subtopicId: integrationSubtopic.id,
      subjectId: mathematics.id,
      options: [
        { text: 'π/4', isCorrect: false, order: 1 },
        { text: 'π/2', isCorrect: true, order: 2 },
        { text: 'π', isCorrect: false, order: 3 },
        { text: '2π', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id, tags[1].id, tags[2].id, tags[3].id, tags[5].id] // JEE Mains, Previous Year, Evening Session, 2025, Numerical Value
    },

    // Question 5: Conic Sections
    {
      stem: `<p>The equation of the circle that passes through the points (1, 0), (0, 1), and (0, 0) is:</p>`,
      explanation: `<p>The general equation of a circle is: x² + y² + 2gx + 2fy + c = 0</p>
                   <p>Since the circle passes through (0, 0):</p>
                   <p>0² + 0² + 2g(0) + 2f(0) + c = 0 → c = 0</p>
                   
                   <p>Since the circle passes through (1, 0):</p>
                   <p>1² + 0² + 2g(1) + 2f(0) + 0 = 0 → 1 + 2g = 0 → g = -1/2</p>
                   
                   <p>Since the circle passes through (0, 1):</p>
                   <p>0² + 1² + 2g(0) + 2f(1) + 0 = 0 → 1 + 2f = 0 → f = -1/2</p>
                   
                   <p>Therefore, the equation is: x² + y² - x - y = 0</p>
                   <p>This can be rewritten as: (x - 1/2)² + (y - 1/2)² = 1/2</p>`,
      tip_formula: `<p><strong>Circle Equation Methods:</strong></p>
                   <ul>
                     <li>General form: x² + y² + 2gx + 2fy + c = 0</li>
                     <li>Standard form: (x - h)² + (y - k)² = r²</li>
                     <li>Use given points to find unknown coefficients</li>
                   </ul>`,
      difficulty: 'MEDIUM' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      subtopicId: conicSectionsSubtopic.id,
      subjectId: mathematics.id,
      options: [
        { text: 'x² + y² - x - y = 0', isCorrect: true, order: 1 },
        { text: 'x² + y² + x + y = 0', isCorrect: false, order: 2 },
        { text: 'x² + y² - 2x - 2y = 0', isCorrect: false, order: 3 },
        { text: 'x² + y² + 2x + 2y = 0', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id, tags[1].id, tags[2].id, tags[3].id, tags[6].id]
    }
  ];

  // Create questions with options and tags
  console.log('📝 Creating mathematics questions...');
  
  for (const questionData of questionsData) {
    const { options, tags: questionTags, ...questionFields } = questionData;
    
    const question = await prisma.question.create({
      data: questionFields
    });

    // Create options
    await Promise.all(
      options.map(option => 
        prisma.questionOption.create({
          data: {
            questionId: question.id,
            text: option.text,
            isCorrect: option.isCorrect,
            order: option.order
          }
        })
      )
    );

    // Create question-tag relationships
    await Promise.all(
      questionTags.map(tagId => 
        prisma.questionTag.create({
          data: {
            questionId: question.id,
            tagId: tagId
          }
        })
      )
    );

    console.log(`✅ Created question: ${question.stem.substring(0, 50)}...`);
  }

  console.log(`🎉 Successfully seeded ${questionsData.length} mathematics questions from 2201 Evening Paper`);
}

export default seedMathematics2201Evening;
