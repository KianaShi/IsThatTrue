// Dev-only static server for the piece render/export page (tools/render-piece.html).
// Serves the project root and accepts POST /save?name=<file>.png, writing the
// body into assets/chess/ (or assets/chess/web/ for the small UI copies). Bound to localhost; never part of the shipped game.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = join(ROOT, 'assets', 'chess');
const PORT = Number(process.env.PORT) || 5174;
const TYPES = {
	'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
	'.mp4': 'video/mp4', '.woff2': 'font/woff2'
};

/**
 * Read a request body into one Buffer.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
const readBody = req => new Promise((res, rej) => {
	const chunks = [];
	req.on('data', c => chunks.push(c));
	req.on('end', () => res(Buffer.concat(chunks)));
	req.on('error', rej);
});

createServer(async (req, res) => {
	const url = new URL(req.url, `http://localhost:${PORT}`);
	try {
		if (req.method === 'POST' && url.pathname === '/save') {
			const name = url.searchParams.get('name') || '';
			if (!/^(web\/)?chess-[a-z-]+\.png$/.test(name)) { res.writeHead(400).end('bad name'); return; }
			const target = join(OUT, name);
			await mkdir(dirname(target), { recursive: true });
			await writeFile(target, await readBody(req));
			res.writeHead(200).end('saved ' + name);
			return;
		}
		const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
		const file = join(ROOT, rel || 'index.html');
		const fromRoot = relative(ROOT, file);
		if (fromRoot === '..' || fromRoot.startsWith('..' + sep) || isAbsolute(fromRoot)) { res.writeHead(403).end(); return; }
		const data = await readFile(file);
		res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data);
	} catch {
		res.writeHead(404).end('not found');
	}
}).listen(PORT, '127.0.0.1', () => console.log(`render tools on http://localhost:${PORT}/tools/render-piece.html`));
