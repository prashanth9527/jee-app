const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testStatusFilter() {
    try {
        console.log('Testing status filter functionality...\n');

        // Test 1: Get all questions
        console.log('1. Testing: Get all questions');
        const allQuestions = await axios.get(`${API_BASE}/admin/questions?limit=5`);
        console.log(`   Found ${allQuestions.data.questions.length} questions`);
        console.log(`   Sample statuses: ${allQuestions.data.questions.map(q => q.status).join(', ')}\n`);

        // Test 2: Filter by status
        console.log('2. Testing: Filter by status=underreview');
        const underReviewQuestions = await axios.get(`${API_BASE}/admin/questions?status=underreview&limit=5`);
        console.log(`   Found ${underReviewQuestions.data.questions.length} questions under review`);
        console.log(`   All statuses: ${underReviewQuestions.data.questions.map(q => q.status).join(', ')}\n`);

        // Test 3: Filter by status=approved
        console.log('3. Testing: Filter by status=approved');
        const approvedQuestions = await axios.get(`${API_BASE}/admin/questions?status=approved&limit=5`);
        console.log(`   Found ${approvedQuestions.data.questions.length} approved questions`);
        console.log(`   All statuses: ${approvedQuestions.data.questions.map(q => q.status).join(', ')}\n`);

        // Test 4: Filter by status=rejected
        console.log('4. Testing: Filter by status=rejected');
        const rejectedQuestions = await axios.get(`${API_BASE}/admin/questions?status=rejected&limit=5`);
        console.log(`   Found ${rejectedQuestions.data.questions.length} rejected questions`);
        console.log(`   All statuses: ${rejectedQuestions.data.questions.map(q => q.status).join(', ')}\n`);

        console.log('✅ Status filter tests completed successfully!');

    } catch (error) {
        console.error('❌ Error testing status filter:', error.response?.data || error.message);
    }
}

async function testStatusUpdate() {
    try {
        console.log('\nTesting status update functionality...\n');

        // Get a question to test with
        const allQuestions = await axios.get(`${API_BASE}/admin/questions?limit=1`);
        if (allQuestions.data.questions.length === 0) {
            console.log('❌ No questions found to test with');
            return;
        }

        const testQuestion = allQuestions.data.questions[0];
        console.log(`Testing with question: ${testQuestion.id}`);
        console.log(`Current status: ${testQuestion.status}`);

        // Test updating status to approved
        console.log('\n1. Testing: Update status to approved');
        const approveResponse = await axios.put(`${API_BASE}/admin/questions/${testQuestion.id}/status`, {
            status: 'approved'
        });
        console.log(`   Status updated to: ${approveResponse.data.status}`);

        // Test updating status to rejected
        console.log('\n2. Testing: Update status to rejected');
        const rejectResponse = await axios.put(`${API_BASE}/admin/questions/${testQuestion.id}/status`, {
            status: 'rejected'
        });
        console.log(`   Status updated to: ${rejectResponse.data.status}`);

        // Test updating status back to underreview
        console.log('\n3. Testing: Update status back to underreview');
        const underReviewResponse = await axios.put(`${API_BASE}/admin/questions/${testQuestion.id}/status`, {
            status: 'underreview'
        });
        console.log(`   Status updated to: ${underReviewResponse.data.status}`);

        console.log('✅ Status update tests completed successfully!');

    } catch (error) {
        console.error('❌ Error testing status update:', error.response?.data || error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting status filter and approve/reject functionality tests...\n');
    
    await testStatusFilter();
    await testStatusUpdate();
    
    console.log('\n🎉 All tests completed!');
}

runTests();
