// Vice Cover Studio — local static server (Node 22, standard library only).
//
// Serves app/ at http://localhost:8080 so the app can be tried in desktop
// Chrome exactly as the grader's static host serves it: every file comes
// from app/, nothing is fetched from the network.
//
//   node serve.ts            (port 8080)
//   PORT=8123 node serve.ts  (another port)

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(fileURLToPath(new URL('app', import.meta.url)));
const port = Number(process.env.PORT ?? 8080);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = resolve(join(appDir, normalize(relative)));
  if (!filePath.startsWith(appDir + sep) && filePath !== appDir) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404);
    response.end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Vice Cover Studio serving app/ at http://localhost:${port}`);
});
