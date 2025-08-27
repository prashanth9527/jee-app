"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    await prisma.examAnswer.deleteMany();
    await prisma.examSubmission.deleteMany();
    await prisma.examPaper.deleteMany();
    await prisma.questionOption.deleteMany();
    await prisma.questionTag.deleteMany();
    await prisma.question.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.subtopic.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.otp.deleteMany();
    await prisma.user.deleteMany();
    console.log('🗑️ Cleared existing data');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
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
            trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
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
        },
    });
    console.log('👥 Created users');
    const basicPlan = await prisma.plan.create({
        data: {
            name: 'Basic Plan',
            description: 'Access to all subjects and topics',
            priceCents: 99900,
            currency: 'INR',
            interval: 'MONTH',
            stripePriceId: 'price_basic_monthly',
        },
    });
    const premiumPlan = await prisma.plan.create({
        data: {
            name: 'Premium Plan',
            description: 'Everything in Basic + Advanced features',
            priceCents: 199900,
            currency: 'INR',
            interval: 'MONTH',
            stripePriceId: 'price_premium_monthly',
        },
    });
    const yearlyPlan = await prisma.plan.create({
        data: {
            name: 'Yearly Plan',
            description: 'Best value - 2 months free',
            priceCents: 999900,
            currency: 'INR',
            interval: 'YEAR',
            stripePriceId: 'price_yearly',
        },
    });
    console.log('💳 Created subscription plans');
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
    const physics = await prisma.subject.create({
        data: {
            name: 'Physics',
            description: 'Physics for JEE Mains and Advanced',
        },
    });
    const chemistry = await prisma.subject.create({
        data: {
            name: 'Chemistry',
            description: 'Chemistry for JEE Mains and Advanced',
        },
    });
    const mathematics = await prisma.subject.create({
        data: {
            name: 'Mathematics',
            description: 'Mathematics for JEE Mains and Advanced',
        },
    });
    console.log('📚 Created subjects');
    const mechanics = await prisma.topic.create({
        data: {
            name: 'Mechanics',
            description: 'Classical mechanics and dynamics',
            subjectId: physics.id,
        },
    });
    const electricity = await prisma.topic.create({
        data: {
            name: 'Electricity & Magnetism',
            description: 'Electric and magnetic phenomena',
            subjectId: physics.id,
        },
    });
    const waves = await prisma.topic.create({
        data: {
            name: 'Waves & Optics',
            description: 'Wave phenomena and optical systems',
            subjectId: physics.id,
        },
    });
    const physicalChemistry = await prisma.topic.create({
        data: {
            name: 'Physical Chemistry',
            description: 'Physical principles in chemistry',
            subjectId: chemistry.id,
        },
    });
    const organicChemistry = await prisma.topic.create({
        data: {
            name: 'Organic Chemistry',
            description: 'Carbon compounds and reactions',
            subjectId: chemistry.id,
        },
    });
    const inorganicChemistry = await prisma.topic.create({
        data: {
            name: 'Inorganic Chemistry',
            description: 'Non-carbon compounds and elements',
            subjectId: chemistry.id,
        },
    });
    const algebra = await prisma.topic.create({
        data: {
            name: 'Algebra',
            description: 'Algebraic expressions and equations',
            subjectId: mathematics.id,
        },
    });
    const calculus = await prisma.topic.create({
        data: {
            name: 'Calculus',
            description: 'Differential and integral calculus',
            subjectId: mathematics.id,
        },
    });
    const geometry = await prisma.topic.create({
        data: {
            name: 'Geometry',
            description: 'Geometric shapes and properties',
            subjectId: mathematics.id,
        },
    });
    console.log('📖 Created topics');
    const subtopics = await Promise.all([
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
    const questions = [
        {
            stem: 'A particle moves along a straight line with velocity v = 3t² - 6t + 2 m/s. The acceleration at t = 2s is:',
            explanation: 'Acceleration is the derivative of velocity: a = dv/dt = 6t - 6. At t = 2s, a = 6(2) - 6 = 6 m/s²',
            difficulty: 'MEDIUM',
            subtopicId: subtopics[0].id,
            tagIds: [tags[1].id, tags[4].id],
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
            difficulty: 'EASY',
            subtopicId: subtopics[0].id,
            tagIds: [tags[1].id, tags[3].id],
            options: [
                { text: '1.5 s', isCorrect: false },
                { text: '2.0 s', isCorrect: true },
                { text: '2.5 s', isCorrect: false },
                { text: '3.0 s', isCorrect: false },
            ],
        },
        {
            stem: 'Two point charges +2μC and -3μC are placed 10 cm apart. The force between them is:',
            explanation: 'Using Coulomb\'s law: F = k|q₁q₂|/r² = 9×10⁹ × |2×10⁻⁶ × (-3×10⁻⁶)| / (0.1)² = 5.4 N',
            difficulty: 'MEDIUM',
            subtopicId: subtopics[3].id,
            tagIds: [tags[1].id, tags[4].id, tags[6].id],
            options: [
                { text: '3.6 N', isCorrect: false },
                { text: '5.4 N', isCorrect: true },
                { text: '7.2 N', isCorrect: false },
                { text: '9.0 N', isCorrect: false },
            ],
        },
        {
            stem: 'For an isothermal reversible process, the change in internal energy (ΔU) is:',
            explanation: 'For an isothermal process, temperature remains constant. Since internal energy depends only on temperature for an ideal gas, ΔU = 0',
            difficulty: 'MEDIUM',
            subtopicId: subtopics[5].id,
            tagIds: [tags[1].id, tags[4].id, tags[7].id],
            options: [
                { text: 'Positive', isCorrect: false },
                { text: 'Negative', isCorrect: false },
                { text: 'Zero', isCorrect: true },
                { text: 'Cannot be determined', isCorrect: false },
            ],
        },
        {
            stem: 'The roots of the equation x² - 5x + 6 = 0 are:',
            explanation: 'x² - 5x + 6 = (x-2)(x-3) = 0. Therefore, x = 2 or x = 3',
            difficulty: 'EASY',
            subtopicId: subtopics[7].id,
            tagIds: [tags[1].id, tags[3].id],
            options: [
                { text: '2, 3', isCorrect: true },
                { text: '1, 6', isCorrect: false },
                { text: '-2, -3', isCorrect: false },
                { text: '2, -3', isCorrect: false },
            ],
        },
        {
            stem: 'If A = [1 2; 3 4] and B = [2 0; 1 2], then AB is:',
            explanation: 'AB = [1×2+2×1 1×0+2×2; 3×2+4×1 3×0+4×2] = [4 4; 10 8]',
            difficulty: 'HARD',
            subtopicId: subtopics[8].id,
            tagIds: [tags[2].id, tags[5].id, tags[6].id],
            options: [
                { text: '[4 4; 10 8]', isCorrect: true },
                { text: '[2 4; 6 8]', isCorrect: false },
                { text: '[3 2; 7 6]', isCorrect: false },
                { text: '[5 4; 11 8]', isCorrect: false },
            ],
        },
        {
            stem: 'Which of the following is a functional group isomer of ethanol?',
            explanation: 'Ethanol (CH₃CH₂OH) and dimethyl ether (CH₃OCH₃) have the same molecular formula C₂H₆O but different functional groups',
            difficulty: 'MEDIUM',
            topicId: organicChemistry.id,
            tagIds: [tags[1].id, tags[4].id, tags[7].id],
            options: [
                { text: 'Methanol', isCorrect: false },
                { text: 'Dimethyl ether', isCorrect: true },
                { text: 'Acetaldehyde', isCorrect: false },
                { text: 'Acetic acid', isCorrect: false },
            ],
        },
        {
            stem: 'A wire of resistance R is cut into n equal parts. The equivalent resistance when these parts are connected in parallel is:',
            explanation: 'Each part has resistance R/n. When connected in parallel: 1/Req = n/(R/n) = n²/R. So Req = R/n²',
            difficulty: 'HARD',
            subtopicId: subtopics[4].id,
            tagIds: [tags[2].id, tags[5].id, tags[6].id],
            options: [
                { text: 'R/n', isCorrect: false },
                { text: 'R/n²', isCorrect: true },
                { text: 'nR', isCorrect: false },
                { text: 'n²R', isCorrect: false },
            ],
        },
    ];
    for (const questionData of questions) {
        const { options, tagIds, ...questionFields } = questionData;
        const question = await prisma.question.create({
            data: questionFields,
        });
        await Promise.all(options.map(option => prisma.questionOption.create({
            data: {
                text: option.text,
                isCorrect: option.isCorrect,
                questionId: question.id,
            },
        })));
        await Promise.all(tagIds.map(tagId => prisma.questionTag.create({
            data: {
                questionId: question.id,
                tagId: tagId,
            },
        })));
    }
    console.log('❓ Created questions with options');
    const examPapers = await Promise.all([
        prisma.examPaper.create({
            data: {
                title: 'Physics Practice Test - Mechanics',
                description: 'Practice test covering kinematics and dynamics',
                timeLimitMin: 60,
                subjectIds: [physics.id],
                topicIds: [mechanics.id],
            },
        }),
        prisma.examPaper.create({
            data: {
                title: 'Chemistry Practice Test - Physical Chemistry',
                description: 'Practice test covering thermodynamics and kinetics',
                timeLimitMin: 45,
                subjectIds: [chemistry.id],
                topicIds: [physicalChemistry.id],
            },
        }),
        prisma.examPaper.create({
            data: {
                title: 'Mathematics Practice Test - Algebra',
                description: 'Practice test covering quadratic equations and matrices',
                timeLimitMin: 90,
                subjectIds: [mathematics.id],
                topicIds: [algebra.id],
            },
        }),
    ]);
    console.log('📄 Created exam papers');
    const submission1 = await prisma.examSubmission.create({
        data: {
            userId: student1.id,
            examPaperId: examPapers[0].id,
            startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            submittedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
            totalQuestions: 10,
            correctCount: 7,
            scorePercent: 70.0,
        },
    });
    const submission2 = await prisma.examSubmission.create({
        data: {
            userId: student2.id,
            examPaperId: examPapers[1].id,
            startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            submittedAt: new Date(Date.now() - 0.75 * 60 * 60 * 1000),
            totalQuestions: 8,
            correctCount: 7,
            scorePercent: 87.5,
        },
    });
    console.log('📊 Created exam submissions');
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📋 Demo Data Summary:');
    console.log(`- Users: ${await prisma.user.count()} (1 admin, 2 students)`);
    console.log(`- Subjects: ${await prisma.subject.count()} (Physics, Chemistry, Mathematics)`);
    console.log(`- Topics: ${await prisma.topic.count()}`);
    console.log(`- Subtopics: ${await prisma.subtopic.count()}`);
    console.log(`- Questions: ${await prisma.question.count()}`);
    console.log(`- Tags: ${await prisma.tag.count()}`);
    console.log(`- Plans: ${await prisma.plan.count()}`);
    console.log(`- Exam Papers: ${await prisma.examPaper.count()}`);
    console.log(`- Submissions: ${await prisma.examSubmission.count()}`);
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
//# sourceMappingURL=seed.js.map