const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = path.resolve(root, relative);
    if (!['index.html', 'styles.css', 'effects.css', 'music-player.css', 'claw-machine.css', 'script.js', 'effects.js', 'music-player.js', 'claw-machine.js', 'wishes.js'].includes(relative) && !(relative.startsWith('assets/') && file.startsWith(path.join(root, 'assets') + path.sep))) return json(res, 404, { error: 'Not found' });
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res, 404, { error: 'Not found' });
    const size = fs.statSync(file).size;
    const isAudio = path.extname(file) === '.mp3';
    const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': size, 'X-Content-Type-Options': 'nosniff' };
    if (isAudio) headers['Accept-Ranges'] = 'bytes';
    let range;
    // Serve just the requested part of the song for metadata and seeking.
    if (isAudio && req.method === 'GET' && req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start = match?.[1] ? Number(match[1]) : 0;
      let end = match?.[2] ? Number(match[2]) : size - 1;
      if (match && !match[1] && match[2]) {
        const suffix = Number(match[2]);
        start = suffix > 0 && Number.isSafeInteger(suffix) ? Math.max(0, size - suffix) : size;
        end = size - 1;
      }
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': 0 });
        return res.end();
      }
      end = Math.min(end, size - 1);
      range = { start, end };
      headers['Content-Length'] = end - start + 1;
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    }
    res.writeHead(range ? 206 : 200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file, range).on('error', () => res.destroy()).pipe(res);
  } catch (error) {
    console.error(error.message);
    if (!res.headersSent) json(res, 500, { error: 'Unable to save or load wishes' });
    else res.destroy();
  }
});
server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log('Birthday website ready on port ' + (process.env.PORT || 3000)));
