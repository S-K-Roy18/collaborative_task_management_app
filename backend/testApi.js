// Simple API test script
const http = require('http');

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('Testing API Endpoints...\n');

  // Test 1: Root endpoint
  console.log('1. Testing GET /');
  let res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/' });
  console.log(`   Status: ${res.status}`);
  console.log(`   Response: ${res.body}\n`);

  // Test 2: Signup
  console.log('2. Testing POST /api/auth/signup');
  const signupBody = JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'test123456' });
  res = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(signupBody) }
  }, signupBody);
  console.log(`   Status: ${res.status}`);
  console.log(`   Response: ${res.body}\n`);

  // Extract token if signup successful
  let token = null;
  try {
    const parsed = JSON.parse(res.body);
    if (parsed.token) token = parsed.token;
  } catch (e) {}

  if (token) {
    // Test 3: Login
    console.log('3. Testing POST /api/auth/login');
    const loginBody = JSON.stringify({ email: 'test@example.com', password: 'test123456' });
    res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
    }, loginBody);
    console.log(`   Status: ${res.status}`);
    console.log(`   Response: ${res.body}\n`);

    // Test 4: Get workspaces
    console.log('4. Testing GET /api/workspace/my-workspaces');
    res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/workspace/my-workspaces',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response: ${res.body}\n`);
  }

  console.log('All tests completed!');
}

runTests().catch(console.error);

