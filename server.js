import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.ico': 'image/x-icon'
};

function handleAudioProxy(req, res, targetUrl) {
  try {
    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === 'http:' ? http : https;

    const headers = {
      'User-Agent': 'SadaQuranPlayer/1.0',
      'Accept': '*/*'
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const proxyReq = client.request(parsedUrl, {
      method: 'GET',
      headers
    }, (proxyRes) => {
      const responseHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
        'Cache-Control': 'public, max-age=86400'
      };

      if (proxyRes.headers['content-type']) {
        responseHeaders['Content-Type'] = proxyRes.headers['content-type'];
      }
      if (proxyRes.headers['content-length']) {
        responseHeaders['Content-Length'] = proxyRes.headers['content-length'];
      }
      if (proxyRes.headers['content-range']) {
        responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
      }
      if (proxyRes.headers['accept-ranges']) {
        responseHeaders['Accept-Ranges'] = proxyRes.headers['accept-ranges'];
      }

      res.writeHead(proxyRes.statusCode || 200, responseHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Audio proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    proxyReq.end();
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Invalid URL' }));
  }
}

function handleApiProxy(req, res, targetUrl) {
  try {
    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === 'http:' ? http : https;

    const proxyReq = client.request(parsedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SadaQuranPlayer/1.0',
        'Accept': 'application/json',
        'Accept-Language': req.headers['accept-language'] || 'ar'
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('API proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    proxyReq.end();
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Invalid API URL' }));
  }
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept, Accept-Language'
    });
    res.end();
    return;
  }

  // Handle Proxies
  if (reqUrl.pathname === '/proxy/audio') {
    const target = reqUrl.searchParams.get('url');
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url parameter');
      return;
    }
    handleAudioProxy(req, res, target);
    return;
  }

  if (reqUrl.pathname === '/proxy/api') {
    const target = reqUrl.searchParams.get('url');
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url parameter');
      return;
    }
    handleApiProxy(req, res, target);
    return;
  }

  // Serve static files (check root first, then public folder)
  let safePath = path.normalize(reqUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(__dirname, safePath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, safePath);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('الصفحة غير موجودة (404)');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Handle Range requests for local audio files
    if (req.headers.range && (contentType.startsWith('audio/') || contentType.startsWith('video/'))) {
      const range = req.headers.range;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      file.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`مشغل صدى يعمل الآن على الرابط: http://localhost:${PORT}`);
});
