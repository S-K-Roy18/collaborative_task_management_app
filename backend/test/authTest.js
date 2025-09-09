const axios = require('axios');

const baseURL = 'http://localhost:5000/api/auth';

async function testSignup() {
  try {
    const response = await axios.post(baseURL + '/signup', {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'TestPass123',
    });
    console.log('Signup response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Signup error:', error.response.data);
    } else {
      console.error('Signup error:', error.message);
    }
  }
}

async function testLogin() {
  try {
    const response = await axios.post(baseURL + '/login', {
      email: 'testuser@example.com',
      password: 'TestPass123',
    });
    console.log('Login response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Login error:', error.response.data);
    } else {
      console.error('Login error:', error.message);
    }
  }
}

async function testForgotPassword() {
  try {
    const response = await axios.post(baseURL + '/forgot-password', {
      email: 'testuser@example.com',
    });
    console.log('Forgot Password response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Forgot Password error:', error.response.data);
    } else {
      console.error('Forgot Password error:', error.message);
    }
  }
}

async function runTests() {
  await testSignup();
  await testLogin();
  await testForgotPassword();
}

runTests();
