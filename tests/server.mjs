// Servidor estático para las pruebas. Aplica las cabeceras de netlify.toml
// (la sección for = "/*"), para probar con la misma política de seguridad.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const toml = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
const bloque = toml.split('[[headers]]').find(b => /for\s*=\s*"\/\*"/.test(b)) || '';
const headers = Object.fromEntries([...bloque.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"(.*)"\s*$/gm)].filter(m => m[1] !== 'for').map(m => [m[1], m[2]]));
const TIPOS = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8' };
const port = Number(process.env.PORT || 4173);

createServer(async (req, res) => {
  try {
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = normalize(join(root, ruta));
    if (!archivo.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (!(await stat(archivo)).isFile()) throw 0;
    res.writeHead(200, { ...headers, 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream' });
    res.end(await readFile(archivo));
  } catch { res.writeHead(404, headers); res.end('No encontrado'); }
}).listen(port, () => console.log(`Linky BAIC en http://localhost:${port}`));
