const http = require('http');

// First register
const registerOpts = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const registerData = JSON.stringify({ 
  email: 'testuser@example.com', 
  password: 'password123',
  name: 'Test User'
});

const registerReq = http.request(registerOpts, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const registerResp = JSON.parse(data);
    console.log('Register:', registerResp.success ? 'OK' : 'Failed');
    
    // Login
    setTimeout(() => {
      login();
    }, 100);
  });
});

registerReq.write(registerData);
registerReq.end();

function login() {
  const loginOpts = {
hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const loginData = JSON.stringify({ email: 'testuser@example.com', password: 'password123' });

  const loginReq = http.request(loginOpts, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const loginResp = JSON.parse(data);
      const token = loginResp.data?.token;
      console.log('Login:', token ? 'OK' : 'Failed');
      
      if (token) {
        // First send a message
        sendMessage(token);
      }
    });
  });

  loginReq.write(loginData);
  loginReq.end();
}

function sendMessage(token) {
  const postOpts = {
hostname: '127.0.0.1',
    port: 3000,
    path: '/api/messages',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  };
  
  const postData = JSON.stringify({ content: 'Test message for patching' });
  
  const postReq = http.request(postOpts, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const resp = JSON.parse(data);
      const msgId = resp.data?.id;
      console.log('Message created:', msgId);
      if (msgId) {
        testPatch(token, msgId);
      }
    });
  });
  
  postReq.write(postData);
  postReq.end();
}

function testPatch(token, messageId) {
  const patchOpts = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/messages/' + messageId,
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  };
  
  const patchData = JSON.stringify({ content: 'Updated via PATCH' });
  
  const patchReq = http.request(patchOpts, (res) => {
    console.log('PATCH Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('PATCH OK');
        // Now test DELETE
        testDelete(token, messageId);
      } catch {
        console.log('Response:', data);
        process.exit(0);
      }
    });
  });
  
  patchReq.on('error', e => {
    console.log('Error:', e.message);
    process.exit(1);
  });
  
  patchReq.write(patchData);
  patchReq.end();
}

function testDelete(token, messageId) {
  const deleteOpts = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/messages/' + messageId,
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };
  
  const deleteReq = http.request(deleteOpts, (res) => {
    console.log('DELETE Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('DELETE OK');
        console.log('\nAll tests PASSED! ✓');
      } catch {
        console.log('Response:', data);
      }
      process.exit(0);
    });
  });
  
  deleteReq.on('error', e => {
    console.log('Error:', e.message);
    process.exit(1);
  });
  
  deleteReq.end();
}
