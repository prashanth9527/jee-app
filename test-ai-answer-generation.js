const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testAIAnswerGeneration() {
    try {
        console.log('Testing AI Answer Generation functionality...\n');

        // Test 1: Get a question to test with
        console.log('1. Getting a question to test with...');
        const questionsResponse = await axios.get(`${API_BASE}/admin/questions?limit=1`);
        
        if (questionsResponse.data.questions.length === 0) {
            console.log('❌ No questions found to test with');
            return;
        }

        const testQuestion = questionsResponse.data.questions[0];
        console.log(`   Found question: ${testQuestion.id}`);
        console.log(`   Question: ${testQuestion.stem.substring(0, 100)}...`);
        console.log(`   Current type: ${testQuestion.isOpenEnded ? 'Open-ended' : 'MCQ'}`);
        console.log(`   Current options: ${testQuestion.options?.length || 0}`);
        console.log(`   Current explanation: ${testQuestion.explanation ? 'Yes' : 'No'}\n`);

        // Test 2: Generate answer with AI
        console.log('2. Testing AI answer generation...');
        try {
            const generateResponse = await axios.post(`${API_BASE}/admin/questions/${testQuestion.id}/generate-answer`);
            
            if (generateResponse.data.success) {
                console.log('   ✅ AI answer generation successful!');
                console.log(`   Generated explanation: ${generateResponse.data.question.explanation ? 'Yes' : 'No'}`);
                console.log(`   Generated tip_formula: ${generateResponse.data.question.tip_formula ? 'Yes' : 'No'}`);
                console.log(`   Question type: ${generateResponse.data.question.isOpenEnded ? 'Open-ended' : 'MCQ'}`);
                
                if (generateResponse.data.question.isOpenEnded) {
                    console.log(`   Numeric answer: ${generateResponse.data.question.correctNumericAnswer}`);
                    console.log(`   Tolerance: ${generateResponse.data.question.answerTolerance}`);
                } else {
                    console.log(`   Options generated: ${generateResponse.data.question.options?.length || 0}`);
                    const correctOptions = generateResponse.data.question.options?.filter(opt => opt.isCorrect) || [];
                    console.log(`   Correct options: ${correctOptions.length}`);
                }
            } else {
                console.log('   ❌ AI answer generation failed');
            }
        } catch (error) {
            console.log(`   ❌ Error generating answer: ${error.response?.data?.message || error.message}`);
        }

        console.log('\n✅ AI Answer Generation test completed!');

    } catch (error) {
        console.error('❌ Error testing AI answer generation:', error.response?.data || error.message);
    }
}

async function testQuestionTypes() {
    try {
        console.log('\nTesting different question types...\n');

        // Test MCQ questions
        console.log('1. Testing MCQ questions...');
        const mcqQuestions = await axios.get(`${API_BASE}/admin/questions?limit=5`);
        const mcqQuestion = mcqQuestions.data.questions.find(q => !q.isOpenEnded);
        
        if (mcqQuestion) {
            console.log(`   Found MCQ question: ${mcqQuestion.id}`);
            console.log(`   Options: ${mcqQuestion.options?.length || 0}`);
        } else {
            console.log('   No MCQ questions found');
        }

        // Test Open-ended questions
        console.log('\n2. Testing Open-ended questions...');
        const openEndedQuestion = mcqQuestions.data.questions.find(q => q.isOpenEnded);
        
        if (openEndedQuestion) {
            console.log(`   Found Open-ended question: ${openEndedQuestion.id}`);
            console.log(`   Numeric answer: ${openEndedQuestion.correctNumericAnswer}`);
            console.log(`   Tolerance: ${openEndedQuestion.answerTolerance}`);
        } else {
            console.log('   No Open-ended questions found');
        }

        console.log('\n✅ Question type analysis completed!');

    } catch (error) {
        console.error('❌ Error testing question types:', error.response?.data || error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting AI Answer Generation tests...\n');
    
    await testAIAnswerGeneration();
    await testQuestionTypes();
    
    console.log('\n🎉 All tests completed!');
}

runTests();
