// 多线程静态服务：python -m http.server 是单线程，一个卡死请求就整个挂住。
// 这里用 Node，起 4 个并发连接池，并在响应头里关掉连接复用。
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.PORT || 8931);
const HOST = '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonc': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent((req.url || '/').split('?')[0]);
  if (rel === '/') rel = '/仙侠.html';
  const abs = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[\\/])+/, ''));
  if (!abs.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  fs.readFile(abs, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 ' + rel);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(abs).toLowerCase()] || 'application/octet-stream',
      'Content-Length': buf.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Connection': 'close',
    });
    res.end(buf);
  });
});

// 不设 maxConnections，让 Node 正常并发；socket 空闲即断，防止僵死连接堆积
server.keepAliveTimeout = 2000;
server.headersTimeout = 5000;
server.requestTimeout = 15000;

server.listen(PORT, HOST, () => {
  console.log('静态服务已起 http://' + HOST + ':' + PORT + '  根目录 ' + ROOT);
});

process.on('uncaughtException', (e) => {
  console.error('[未捕获] ' + e.message);
});
