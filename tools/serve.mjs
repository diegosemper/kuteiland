// Kleine lokale webserver om het spel te testen, ook op je telefoon via wifi.
// Gebruik: npm start   (of: node tools/serve.mjs)
import http from 'node:http';
import os from 'node:os';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.md': 'text/plain; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(join(ROOT, path));
    if (file !== ROOT && !file.startsWith(ROOT + sep)) throw new Error('buiten de map');
    const info = await stat(file);
    if (!info.isFile()) throw new Error('geen bestand');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Niet gevonden. Net als de rest van de wereld.');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\nKuteiland draait.\n');
  console.log(`  Op deze computer:  http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  Op je telefoon:    http://${a.address}:${PORT}   (zelfde wifi)`);
    }
  }
  console.log('\nStoppen: Ctrl+C\n');
});
