import http from 'http';

const data = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/spin/sample1',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (err) => { console.error('ERR', err); process.exit(1); });
req.write(data);
req.end();
