const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function signupAndGetToken() {
  try {
    console.log('Attempting signup...');
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'testuser2@example.com',
      password: 'TestPassword123',
    }),
    });
    console.log('Signup response status:', res.status);
    const data = await res.json();
    console.log('Signup response data:', data);
    if (data.token) {
      console.log('Signup successful, token received');
      return data.token;
    }
    // If user already exists, try login
    console.log('Signup failed or user exists, trying login...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testuser2@example.com',
      password: 'TestPassword123',
    }),
    });
    console.log('Login response status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login response data:', loginData);
    return loginData.token;
  } catch (error) {
    console.error('Error in signupAndGetToken:', error);
    return null;
  }
}

async function testCreateWorkspace(token) {
  const response = await fetch(`${API_BASE}/workspace/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Test Workspace',
      description: 'Test description',
    }),
  });
  const data = await response.json();
  console.log('Create Workspace Response:', data);
  return data.workspace; // Return workspace for further tests
}

async function testGetWorkspace(token, workspaceId) {
  const response = await fetch(`${API_BASE}/workspace/${workspaceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log('Get Workspace Response:', data);
}

async function testUpdateWorkspace(token, workspaceId) {
  const response = await fetch(`${API_BASE}/workspace/${workspaceId}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Updated Test Workspace',
      description: 'Updated description',
    }),
  });
  const data = await response.json();
  console.log('Update Workspace Response:', data);
}

async function testRegenerateCode(token, workspaceId) {
  const response = await fetch(`${API_BASE}/workspace/${workspaceId}/regenerate-code`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log('Regenerate Code Response:', data);
  return data.inviteCode; // Return new code
}

async function testJoinWorkspace(token, inviteCode) {
  const response = await fetch(`${API_BASE}/workspace/join/${inviteCode}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log('Join Workspace Response:', data);
}

async function signupAndGetToken2() {
  try {
    console.log('Attempting signup for second user...');
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User 2',
        email: 'testuser3@example.com',
        password: 'TestPassword123',
      }),
    });
    console.log('Signup2 response status:', res.status);
    const data = await res.json();
    console.log('Signup2 response data:', data);
    if (data.token) {
      console.log('Signup2 successful, token received');
      return data.token;
    }
    // If user already exists, try login
    console.log('Signup2 failed or user exists, trying login...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser3@example.com',
        password: 'TestPassword123',
      }),
    });
    console.log('Login2 response status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login2 response data:', loginData);
    return loginData.token;
  } catch (error) {
    console.error('Error in signupAndGetToken2:', error);
    return null;
  }
}

async function runTests() {
  try {
    const token = await signupAndGetToken();
    if (!token) {
      console.error('Failed to get JWT token for user 1');
      return;
    }
    const workspace = await testCreateWorkspace(token);
    if (!workspace) {
      console.error('Failed to create workspace');
      return;
    }
    const workspaceId = workspace.id;
    const inviteCode = workspace.inviteCode;

    await testGetWorkspace(token, workspaceId);
    await testUpdateWorkspace(token, workspaceId);
    const newInviteCode = await testRegenerateCode(token, workspaceId);

    // Test join with second user
    const token2 = await signupAndGetToken2();
    if (token2) {
      console.log('Joining workspace with invite code:', inviteCode);
      await testJoinWorkspace(token2, inviteCode); // Use original code
    } else {
      console.error('Failed to get token for user 2');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTests();
