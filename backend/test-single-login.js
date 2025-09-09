/**
 * Test script for single login restriction functionality
 * This script demonstrates how the single login restriction works for STUDENT accounts
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust if your backend runs on different port

async function testSingleLoginRestriction() {
    console.log('🧪 Testing Single Login Restriction for Student Accounts\n');

    try {
        // Test data - you'll need to replace with actual test user credentials
        const testUser = {
            email: 'test@example.com',
            password: 'testpassword123'
        };

        console.log('1. First login attempt...');
        const login1 = await axios.post(`${BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });

        console.log('✅ First login successful');
        console.log('   Token:', login1.data.access_token.substring(0, 50) + '...');
        console.log('   User:', login1.data.user);

        const token1 = login1.data.access_token;

        console.log('\n2. Second login attempt (should invalidate first session)...');
        const login2 = await axios.post(`${BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });

        console.log('✅ Second login successful');
        console.log('   Token:', login2.data.access_token.substring(0, 50) + '...');

        const token2 = login2.data.access_token;

        console.log('\n3. Testing first token (should be invalid)...');
        try {
            await axios.get(`${BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token1}` }
            });
            console.log('❌ First token still works - this should not happen!');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ First token correctly invalidated');
            } else {
                console.log('❌ Unexpected error:', error.response?.data);
            }
        }

        console.log('\n4. Testing second token (should work)...');
        try {
            const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token2}` }
            });
            console.log('✅ Second token works correctly');
            console.log('   User data:', meResponse.data);
        } catch (error) {
            console.log('❌ Second token failed:', error.response?.data);
        }

        console.log('\n5. Testing logout...');
        try {
            await axios.post(`${BASE_URL}/auth/logout`, {}, {
                headers: { Authorization: `Bearer ${token2}` }
            });
            console.log('✅ Logout successful');
        } catch (error) {
            console.log('❌ Logout failed:', error.response?.data);
        }

        console.log('\n6. Testing token after logout (should be invalid)...');
        try {
            await axios.get(`${BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token2}` }
            });
            console.log('❌ Token still works after logout - this should not happen!');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Token correctly invalidated after logout');
            } else {
                console.log('❌ Unexpected error:', error.response?.data);
            }
        }

        console.log('\n🎉 Single login restriction test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testSingleLoginRestriction();
