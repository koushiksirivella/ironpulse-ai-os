// Local dev server. Static files, no build step.
//
//   npm run serve   ->  http://localhost:3000/          the current site
//                       http://localhost:3000/demo/     engine harness
//                       http://localhost:3000/admin/    operator panel
//                       http://localhost:3000/demo/?gym=j7
//
// Not for production — Vercel serves the real thing.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.csv': 'text/csv; charset=utf-8',
};

http
  .createServer((req, res) => {
    // req.url carries the query string. Joining it straight onto a path turns
    // /demo/?gym=j7 into a filename that cannot exist — which is how the
    // tenant switcher would look broken before it was ever really used.
    const { pathname } = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    // Self-destruct any legacy Service Worker (e.g. diwali-scanner-v10) that was
    // previously registered on http://localhost:3000 so it never hijacks routes.
    if (pathname === '/sw.js') {
      const killerSw = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});
`;
      res.writeHead(200, {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      });
      res.end(killerSw);
      return;
    }

    let rel = decodeURIComponent(pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    else if (!path.extname(rel)) {
      const candidateDirIndex = path.resolve(ROOT, '.' + rel, 'index.html');
      if (fs.existsSync(candidateDirIndex)) rel += '/index.html';
    }

    // Resolve first, then confirm the result is still inside the repo.
    // Without this, a request for ../.env.supabase.local is served on demand.
    const filePath = path.resolve(ROOT, '.' + rel);
    if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' }).end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' }).end(`Not found: ${rel}`);
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log(`serving ${ROOT}`);
    console.log(`  site   http://localhost:${PORT}/`);
    console.log(`  demo   http://localhost:${PORT}/demo/`);
    console.log(`  admin  http://localhost:${PORT}/admin/`);
  });
