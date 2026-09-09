const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
// Serve only shipped game files, never repository metadata or development files.
const {files: runtimeFiles} = require('./runtime-files.cjs');
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8'};
const files = new Map(runtimeFiles.map(name => ['/' + name, [name, types[path.extname(name)]]]));
files.set('/', ['index.html', types['.html']]);

function createServer() {
  return http.createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end();
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400); return res.end(); }
    const entry = files.get(pathname);
    if (!entry) { res.writeHead(404); return res.end(); }
    try {
      const content = await fs.readFile(path.join(root, entry[0]));
      res.writeHead(200, { 'Content-Type': entry[1], 'Content-Length': content.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { res.writeHead(500); res.end('Could not read game file.'); }
  });
}

if (require.main === module) {
  const raw = process.argv[2] || process.env.PORT || '8765';
  const port = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Choose a port from 1 to 65535. Example: npm run dev -- 8766');
    process.exitCode = 1;
  } else {
    const server = createServer();
    server.on('error', error => {
      console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Try: npm run dev -- ${port + 1}` : error.message);
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => console.log(`AFTERIMAGE: http://localhost:${port}\nRefresh after edits. Ctrl+C stops the server.`));
  }
}
module.exports = { createServer };
