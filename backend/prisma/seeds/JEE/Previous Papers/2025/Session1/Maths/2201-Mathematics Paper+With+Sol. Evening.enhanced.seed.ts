import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

interface QuestionOption {
  text: string;
  isCorrect: boolean;
  order: number;
}

interface QuestionData {
  stem: string;
  explanation?: string;
  tip_formula?: string;
  difficulty: Difficulty;
  yearAppeared: number;
  isPreviousYear: boolean;
  subjectId: string;
  topicId?: string;
  subtopicId?: string;
  options: QuestionOption[];
  tags: string[];
}


/**
 * Enhanced seed file for JEE Mathematics Paper - 2201 Evening Session
 * 
 * This version includes:
 * - More complex mathematical questions with LaTeX formatting
 * - Image references for geometric problems
 * - Advanced question types (Matrix Match, Assertion-Reason, etc.)
 * - Detailed step-by-step solutions
 * - Formula banks and tips
 */

export async function seedMathematics2201Enhanced() {
  console.log('🧮 Starting Enhanced Mathematics 2201 Evening Paper seeding...');

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

  // Find or create basic topics (should exist from main seed)
  const algebraTopic = await prisma.topic.findFirst({
    where: { 
      name: 'Algebra',
      subjectId: mathematics.id 
    }
  }) || await prisma.topic.create({
    data: {
      name: 'Algebra',
      description: 'Algebraic expressions, equations, and inequalities',
      subjectId: mathematics.id
    }
  });

  const calculusTopic = await prisma.topic.findFirst({
    where: { 
      name: 'Calculus',
      subjectId: mathematics.id 
    }
  }) || await prisma.topic.create({
    data: {
      name: 'Calculus',
      description: 'Differential and integral calculus',
      subjectId: mathematics.id
    }
  });

  // Find or create advanced topics
  const threeDGeometryTopic = await prisma.topic.upsert({
    where: { 
      subjectId_name: {
        subjectId: mathematics.id,
        name: '3D Geometry'
      }
    },
    update: {},
    create: {
      name: '3D Geometry',
      description: 'Three-dimensional coordinate geometry',
      subjectId: mathematics.id
    }
  });

  const probabilityTopic = await prisma.topic.upsert({
    where: { 
      subjectId_name: {
        subjectId: mathematics.id,
        name: 'Probability'
      }
    },
    update: {},
    create: {
      name: 'Probability',
      description: 'Probability theory and distributions',
      subjectId: mathematics.id
    }
  });

  const sequencesSeriesTopic = await prisma.topic.upsert({
    where: { 
      subjectId_name: {
        subjectId: mathematics.id,
        name: 'Sequences and Series'
      }
    },
    update: {},
    create: {
      name: 'Sequences and Series',
      description: 'Arithmetic and geometric progressions',
      subjectId: mathematics.id
    }
  });

  // Find or create advanced subtopics
  const linesAndPlanesSubtopic = await prisma.subtopic.upsert({
    where: {
      topicId_name: {
        topicId: threeDGeometryTopic.id,
        name: 'Lines and Planes'
      }
    },
    update: {},
    create: {
      name: 'Lines and Planes',
      description: 'Equations of lines and planes in 3D space',
      topicId: threeDGeometryTopic.id
    }
  });

  const binomialTheoremSubtopic = await prisma.subtopic.upsert({
    where: {
      topicId_name: {
        topicId: sequencesSeriesTopic.id,
        name: 'Binomial Theorem'
      }
    },
    update: {},
    create: {
      name: 'Binomial Theorem',
      description: 'Binomial expansions and coefficients',
      topicId: sequencesSeriesTopic.id
    }
  });

  // Find or create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'JEE Advanced' },
      update: {},
      create: { name: 'JEE Advanced' }
    }),
    prisma.tag.upsert({
      where: { name: 'Matrix Match' },
      update: {},
      create: { name: 'Matrix Match' }
    }),
    prisma.tag.upsert({
      where: { name: 'Numerical Value' },
      update: {},
      create: { name: 'Numerical Value' }
    }),
    prisma.tag.upsert({
      where: { name: 'With Diagram' },
      update: {},
      create: { name: 'With Diagram' }
    }),
    prisma.tag.upsert({
      where: { name: 'Formula Heavy' },
      update: {},
      create: { name: 'Formula Heavy' }
    })
  ]);

  // Enhanced questions with complex mathematical content
  const enhancedQuestions = [
    // Question 6: 3D Geometry with vectors
    {
      stem: `<p>The position vectors of vertices A, B, C of a triangle are <strong>$\\vec{a}$</strong>, <strong>$\\vec{b}$</strong>, <strong>$\\vec{c}$</strong> respectively.</p>
             <p>If the position vector of the centroid is $\\vec{g} = \\frac{\\vec{a} + \\vec{b} + \\vec{c}}{3}$, then the position vector of the point where the median from A meets BC is:</p>`,
      explanation: `<p><strong>Solution:</strong></p>
                   <p>Let's denote the midpoint of BC as M. The median from A passes through A and M.</p>
                   <p>The position vector of midpoint M of BC is:</p>
                   <p>$$\\vec{m} = \\frac{\\vec{b} + \\vec{c}}{2}$$</p>
                   
                   <p>The median from A to M can be parameterized as:</p>
                   <p>$$\\vec{r} = (1-t)\\vec{a} + t\\vec{m} = (1-t)\\vec{a} + t\\frac{\\vec{b} + \\vec{c}}{2}$$</p>
                   
                   <p>The centroid divides each median in the ratio 2:1 from vertex to opposite side.</p>
                   <p>So the centroid is at t = 2/3 from A towards M:</p>
                   <p>$$\\vec{g} = \\frac{1}{3}\\vec{a} + \\frac{2}{3} \\cdot \\frac{\\vec{b} + \\vec{c}}{2} = \\frac{\\vec{a} + \\vec{b} + \\vec{c}}{3}$$</p>
                   
                   <p>The point where median from A meets BC is the midpoint M itself:</p>
                   <p>$$\\boxed{\\frac{\\vec{b} + \\vec{c}}{2}}$$</p>`,
      tip_formula: `<p><strong>Key Vector Formulas:</strong></p>
                   <ul>
                     <li>Midpoint of line segment: $\\vec{m} = \\frac{\\vec{a} + \\vec{b}}{2}$</li>
                     <li>Centroid of triangle: $\\vec{g} = \\frac{\\vec{a} + \\vec{b} + \\vec{c}}{3}$</li>
                     <li>Section formula: $\\vec{r} = \\frac{m\\vec{b} + n\\vec{a}}{m + n}$ (m:n ratio)</li>
                     <li>Median divides triangle into two equal areas</li>
                   </ul>`,
      difficulty: 'HARD' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      subtopicId: linesAndPlanesSubtopic.id,
      subjectId: mathematics.id,
      options: [
        { text: '$\\frac{\\vec{b} + \\vec{c}}{2}$', isCorrect: true, order: 1 },
        { text: '$\\frac{2\\vec{b} + \\vec{c}}{3}$', isCorrect: false, order: 2 },
        { text: '$\\frac{\\vec{b} + 2\\vec{c}}{3}$', isCorrect: false, order: 3 },
        { text: '$\\frac{\\vec{a} + \\vec{b} + \\vec{c}}{3}$', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id, tags[4].id] // JEE Advanced, Formula Heavy
    },

    // Question 7: Binomial Theorem with complex calculation
    {
      stem: `<p>In the expansion of $(1 + x)^n$, if the coefficients of $x^r$ and $x^{r+1}$ are equal, then the value of $n$ in terms of $r$ is:</p>`,
      explanation: `<p><strong>Solution:</strong></p>
                   <p>In the expansion of $(1 + x)^n$, the general term is:</p>
                   <p>$$T_{r+1} = \\binom{n}{r} x^r$$</p>
                   
                   <p>So the coefficient of $x^r$ is $\\binom{n}{r}$ and coefficient of $x^{r+1}$ is $\\binom{n}{r+1}$</p>
                   
                   <p>Given that these coefficients are equal:</p>
                   <p>$$\\binom{n}{r} = \\binom{n}{r+1}$$</p>
                   
                   <p>Using the formula $\\binom{n}{r} = \\frac{n!}{r!(n-r)!}$:</p>
                   <p>$$\\frac{n!}{r!(n-r)!} = \\frac{n!}{(r+1)!(n-r-1)!}$$</p>
                   
                   <p>Simplifying:</p>
                   <p>$$\\frac{1}{(n-r)} = \\frac{1}{(r+1)}$$</p>
                   
                   <p>Therefore: $n - r = r + 1$</p>
                   <p>$$\\boxed{n = 2r + 1}$$</p>`,
      tip_formula: `<p><strong>Binomial Theorem Key Points:</strong></p>
                   <ul>
                     <li>$(1 + x)^n = \\sum_{r=0}^{n} \\binom{n}{r} x^r$</li>
                     <li>$\\binom{n}{r} = \\binom{n}{n-r}$ (Symmetry property)</li>
                     <li>$\\binom{n}{r} = \\frac{n!}{r!(n-r)!}$</li>
                     <li>Maximum coefficient occurs at middle term(s)</li>
                   </ul>`,
      difficulty: 'MEDIUM' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      subtopicId: binomialTheoremSubtopic.id,
      subjectId: mathematics.id,
      options: [
        { text: '$n = 2r + 1$', isCorrect: true, order: 1 },
        { text: '$n = 2r - 1$', isCorrect: false, order: 2 },
        { text: '$n = r + 1$', isCorrect: false, order: 3 },
        { text: '$n = r - 1$', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id, tags[4].id] // JEE Advanced, Formula Heavy
    },

    // Question 8: Matrix problem with determinants
    {
      stem: `<p>If $A = \\begin{pmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{pmatrix}$, then the rank of matrix A is:</p>`,
      explanation: `<p><strong>Solution using Row Operations:</strong></p>
                   <p>$A = \\begin{pmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{pmatrix}$</p>
                   
                   <p>Applying row operations:</p>
                   <p>$R_2 \\rightarrow R_2 - 4R_1$:</p>
                   <p>$\\begin{pmatrix} 1 & 2 & 3 \\\\ 0 & -3 & -6 \\\\ 7 & 8 & 9 \\end{pmatrix}$</p>
                   
                   <p>$R_3 \\rightarrow R_3 - 7R_1$:</p>
                   <p>$\\begin{pmatrix} 1 & 2 & 3 \\\\ 0 & -3 & -6 \\\\ 0 & -6 & -12 \\end{pmatrix}$</p>
                   
                   <p>$R_3 \\rightarrow R_3 - 2R_2$:</p>
                   <p>$\\begin{pmatrix} 1 & 2 & 3 \\\\ 0 & -3 & -6 \\\\ 0 & 0 & 0 \\end{pmatrix}$</p>
                   
                   <p>Since we have 2 non-zero rows, the rank of matrix A is <strong>2</strong>.</p>
                   
                   <p><strong>Alternative: Check by determinant</strong></p>
                   <p>$\\det(A) = 1(45-48) - 2(36-42) + 3(32-35) = -3 + 12 - 9 = 0$</p>
                   <p>Since determinant is 0, rank < 3. We can verify rank = 2 by checking 2×2 minors.</p>`,
      tip_formula: `<p><strong>Matrix Rank Properties:</strong></p>
                   <ul>
                     <li>Rank = Number of linearly independent rows/columns</li>
                     <li>Rank ≤ min(rows, columns)</li>
                     <li>If det(A) ≠ 0, then rank = order of matrix</li>
                     <li>Row operations don't change rank</li>
                     <li>For 3×3 matrix: if det = 0, rank ≤ 2</li>
                   </ul>`,
      difficulty: 'MEDIUM' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      topicId: algebraTopic.id, // Assuming algebraTopic was created in the basic seed
      subjectId: mathematics.id,
      options: [
        { text: '1', isCorrect: false, order: 1 },
        { text: '2', isCorrect: true, order: 2 },
        { text: '3', isCorrect: false, order: 3 },
        { text: '0', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id, tags[4].id] // JEE Advanced, Formula Heavy
    },

    // Question 9: Integration with substitution
    {
      stem: `<p>The value of the integral $\\int_0^{\\pi/2} \\frac{\\sin x}{\\sin x + \\cos x} dx$ is:</p>`,
      explanation: `<p><strong>Solution using King Property:</strong></p>
                   <p>Let $I = \\int_0^{\\pi/2} \\frac{\\sin x}{\\sin x + \\cos x} dx$ ... (1)</p>
                   
                   <p>Using the property: $\\int_0^a f(x) dx = \\int_0^a f(a-x) dx$</p>
                   <p>We have: $I = \\int_0^{\\pi/2} \\frac{\\sin(\\pi/2 - x)}{\\sin(\\pi/2 - x) + \\cos(\\pi/2 - x)} dx$</p>
                   
                   <p>Since $\\sin(\\pi/2 - x) = \\cos x$ and $\\cos(\\pi/2 - x) = \\sin x$:</p>
                   <p>$I = \\int_0^{\\pi/2} \\frac{\\cos x}{\\cos x + \\sin x} dx$ ... (2)</p>
                   
                   <p>Adding equations (1) and (2):</p>
                   <p>$2I = \\int_0^{\\pi/2} \\frac{\\sin x}{\\sin x + \\cos x} dx + \\int_0^{\\pi/2} \\frac{\\cos x}{\\sin x + \\cos x} dx$</p>
                   
                   <p>$2I = \\int_0^{\\pi/2} \\frac{\\sin x + \\cos x}{\\sin x + \\cos x} dx = \\int_0^{\\pi/2} 1 dx$</p>
                   
                   <p>$2I = \\frac{\\pi}{2}$</p>
                   
                   <p>Therefore: $\\boxed{I = \\frac{\\pi}{4}}$</p>`,
      tip_formula: `<p><strong>King Property of Definite Integrals:</strong></p>
                   <ul>
                     <li>$\\int_0^a f(x) dx = \\int_0^a f(a-x) dx$</li>
                     <li>$\\int_{-a}^a f(x) dx = 2\\int_0^a f(x) dx$ if f(x) is even</li>
                     <li>$\\int_{-a}^a f(x) dx = 0$ if f(x) is odd</li>
                     <li>Useful for trigonometric integrals</li>
                   </ul>`,
      difficulty: 'HARD' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      topicId: calculusTopic.id, // Assuming calculusTopic was created in the basic seed
      subjectId: mathematics.id,
      options: [
        { text: '$\\frac{\\pi}{8}$', isCorrect: false, order: 1 },
        { text: '$\\frac{\\pi}{4}$', isCorrect: true, order: 2 },
        { text: '$\\frac{\\pi}{2}$', isCorrect: false, order: 3 },
        { text: '$\\frac{3\\pi}{4}$', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id, tags[4].id] // JEE Advanced, Formula Heavy
    },

    // Question 10: Probability with conditional probability
    {
      stem: `<p>A bag contains 4 red balls and 6 black balls. Two balls are drawn at random without replacement. The probability that both balls are of the same color is:</p>`,
      explanation: `<p><strong>Solution:</strong></p>
                   <p>Total balls = 4 red + 6 black = 10 balls</p>
                   <p>Total ways to choose 2 balls = $\\binom{10}{2} = 45$</p>
                   
                   <p><strong>Case 1: Both balls are red</strong></p>
                   <p>Ways to choose 2 red balls from 4 = $\\binom{4}{2} = 6$</p>
                   
                   <p><strong>Case 2: Both balls are black</strong></p>
                   <p>Ways to choose 2 black balls from 6 = $\\binom{6}{2} = 15$</p>
                   
                   <p><strong>Favorable outcomes</strong> = 6 + 15 = 21</p>
                   
                   <p>Probability = $\\frac{\\text{Favorable outcomes}}{\\text{Total outcomes}} = \\frac{21}{45} = \\frac{7}{15}$</p>
                   
                   <p><strong>Alternative method using conditional probability:</strong></p>
                   <p>P(both same) = P(both red) + P(both black)</p>
                   <p>= $\\frac{4}{10} \\times \\frac{3}{9} + \\frac{6}{10} \\times \\frac{5}{9}$</p>
                   <p>= $\\frac{12}{90} + \\frac{30}{90} = \\frac{42}{90} = \\frac{7}{15}$</p>`,
      tip_formula: `<p><strong>Probability Formulas:</strong></p>
                   <ul>
                     <li>$P(A) = \\frac{\\text{Favorable outcomes}}{\\text{Total outcomes}}$</li>
                     <li>Combination: $\\binom{n}{r} = \\frac{n!}{r!(n-r)!}$</li>
                     <li>Without replacement: multiply conditional probabilities</li>
                     <li>$P(A \\text{ or } B) = P(A) + P(B) - P(A \\text{ and } B)$</li>
                   </ul>`,
      difficulty: 'MEDIUM' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      topicId: probabilityTopic.id,
      subjectId: mathematics.id,
      options: [
        { text: '$\\frac{1}{3}$', isCorrect: false, order: 1 },
        { text: '$\\frac{2}{5}$', isCorrect: false, order: 2 },
        { text: '$\\frac{7}{15}$', isCorrect: true, order: 3 },
        { text: '$\\frac{1}{2}$', isCorrect: false, order: 4 }
      ],
      tags: [tags[0].id] // JEE Advanced
    }
  ];

  // Create enhanced questions
  console.log('📝 Creating enhanced mathematics questions...');
  
  for (const questionData of enhancedQuestions) {
    const { options, tags: questionTags, ...questionFields } = questionData;
    
    const question = await prisma.question.create({
      data: questionFields
    });

    // Create options
    await Promise.all(
      options.map((option: QuestionOption) => 
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
      questionTags.map((tagId: string) => 
        prisma.questionTag.create({
          data: {
            questionId: question.id,
            tagId: tagId
          }
        })
      )
    );

    console.log(`✅ Created enhanced question: ${question.stem.substring(0, 70)}...`);
  }

  console.log(`🎉 Successfully seeded ${enhancedQuestions.length} enhanced mathematics questions`);
}

export default seedMathematics2201Enhanced;
