const axios = require('axios');

async function testAPI() {
  try {
    // First, let's login to get a token
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      email: 'admin@jeeapp.com',
      password: 'admin123'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');

    // Test pagination
    console.log('\n📄 Testing pagination...');
    
    const page1Response = await axios.get('http://localhost:3001/admin/questions?page=1&limit=10', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Page 1 response:', {
      questionsCount: page1Response.data.questions?.length || page1Response.data.length,
      pagination: page1Response.data.pagination,
      totalItems: page1Response.data.pagination?.totalItems || 'N/A',
      totalPages: page1Response.data.pagination?.totalPages || 'N/A'
    });

    // Test search
    console.log('\n🔍 Testing search...');
    const searchResponse = await axios.get('http://localhost:3001/admin/questions?search=velocity', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Search response:', {
      questionsCount: searchResponse.data.questions?.length || searchResponse.data.length,
      searchTerm: 'velocity'
    });

    // Test filtering by subject
    console.log('\n📚 Testing subject filter...');
    const subjectResponse = await axios.get('http://localhost:3001/admin/questions?subjectId=cmevl3bl0000euqhsqly17i5u', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Subject filter response:', {
      questionsCount: subjectResponse.data.questions?.length || subjectResponse.data.length,
      subjectId: 'cmevl3bl0000euqhsqly17i5u (Physics)'
    });

    // Test difficulty filter
    console.log('\n⭐ Testing difficulty filter...');
    const difficultyResponse = await axios.get('http://localhost:3001/admin/questions?difficulty=EASY', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Difficulty filter response:', {
      questionsCount: difficultyResponse.data.questions?.length || difficultyResponse.data.length,
      difficulty: 'EASY'
    });

    console.log('\n✅ API testing completed!');

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testAPI(); 