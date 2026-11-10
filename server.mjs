import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)))
const dist = join(root, 'dist')
const port = Number(process.env.PORT || 4173)

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', `http://${req.headers.host}`).pathname
  if (!existsSync(dist)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Build the studio first: npm run build')
    return
  }
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  let file = join(dist, safe)
  if (!file.startsWith(dist)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html')
  const ext = extname(file)
  res.writeHead(200, {
    'Content-Type': mime[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
  })
  createReadStream(file).pipe(res)
})

server.listen(port, () => {
  console.log(`Motionmark studio running at http://localhost:${port}`)
})
