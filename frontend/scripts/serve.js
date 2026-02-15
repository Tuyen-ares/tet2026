#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = process.env.PORT || process.env.npm_config_port || 5000;

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mime[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  try {
    const decoded = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(PUBLIC_DIR, decoded);
    if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html');
    fs.stat(filePath, (err, stats) => {
      // If path exists and is a directory, serve index.html from that dir
      if (!err && stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (filePath.indexOf(PUBLIC_DIR) !== 0) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      // If the file doesn't exist, and request has no extension, assume SPA route
      if (err) {
        const ext = path.extname(decoded).toLowerCase();
        if (!ext) {
          // fallback to main index.html so client-side routing can handle the path
          sendFile(res, path.join(PUBLIC_DIR, 'index.html'));
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      sendFile(res, filePath);
    });
  } catch (e) {
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`Static server serving ${PUBLIC_DIR} at http://localhost:${PORT}`);
});
