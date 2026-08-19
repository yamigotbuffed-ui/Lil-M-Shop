const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { db } = require('./db');
const { verifyLogin, issueToken, verifyToken, changePassword } = require('./auth');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Access-Control-Allow-Origin': '*', ...headers });
  res.end(body);
}

function sendJSON(res, status, data) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8' });
}

function readJSONBody(req, maxBytes = 8 * 1024 * 1024) { // 8MB cap — product images are base64 data URLs
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload too large (max 8MB — try a smaller image)'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function getAuth(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return verifyToken(token);
}

function requireAuth(req, res) {
  const payload = getAuth(req);
  if (!payload) {
    sendJSON(res, 401, { error: 'Unauthorized' });
    return null;
  }
  return payload;
}

const PRODUCT_FIELDS = ['category', 'title', 'description', 'image', 'price', 'status'];

function serializeProduct(row) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    image: row.image,
    price: row.price,
    status: row.status,
    createdAt: row.created_at
  };
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

async function handleAPI(req, res, urlPath) {
  // ---- Public ----
  if (urlPath === '/api/products' && req.method === 'GET') {
    const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
    return sendJSON(res, 200, rows.map(serializeProduct));
  }

  if (urlPath === '/api/settings' && req.method === 'GET') {
    return sendJSON(res, 200, getSettings());
  }

  if (urlPath === '/api/admin/login' && req.method === 'POST') {
    let body;
    try { body = await readJSONBody(req); } catch (e) { return sendJSON(res, 400, { error: e.message }); }
    const { username, password } = body;
    if (!username || !password) return sendJSON(res, 400, { error: 'Username and password required' });
    if (!verifyLogin(username, password)) return sendJSON(res, 401, { error: 'Invalid credentials' });
    const token = issueToken(username);
    return sendJSON(res, 200, { token });
  }

  // ---- Everything below requires a valid admin token ----
  if (urlPath.startsWith('/api/admin/')) {
    const auth = requireAuth(req, res);
    if (!auth) return;

    if (urlPath === '/api/admin/products' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
      return sendJSON(res, 200, rows.map(serializeProduct));
    }

    if (urlPath === '/api/admin/products' && req.method === 'POST') {
      let body;
      try { body = await readJSONBody(req); } catch (e) { return sendJSON(res, 400, { error: e.message }); }
      if (!body.title || body.price == null) return sendJSON(res, 400, { error: 'title and price are required' });

      const cols = PRODUCT_FIELDS.filter(f => f in body);
      const values = cols.map(c => body[c]);
      const placeholders = cols.map(() => '?').join(', ');
      const info = db.prepare(`INSERT INTO products (${cols.join(', ')}) VALUES (${placeholders})`).run(...values);
      const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
      return sendJSON(res, 201, serializeProduct(row));
    }

    const idMatch = urlPath.match(/^\/api\/admin\/products\/(\d+)$/);
    if (idMatch && req.method === 'PUT') {
      const id = Number(idMatch[1]);
      let body;
      try { body = await readJSONBody(req); } catch (e) { return sendJSON(res, 400, { error: e.message }); }

      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      if (!existing) return sendJSON(res, 404, { error: 'Not found' });

      const cols = PRODUCT_FIELDS.filter(f => f in body);
      if (cols.length === 0) return sendJSON(res, 400, { error: 'No fields to update' });
      const setClause = cols.map(c => `${c} = ?`).join(', ');
      const values = cols.map(c => body[c]);
      db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`).run(...values, id);

      const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      return sendJSON(res, 200, serializeProduct(row));
    }

    if (idMatch && req.method === 'DELETE') {
      const id = Number(idMatch[1]);
      const info = db.prepare('DELETE FROM products WHERE id = ?').run(id);
      if (info.changes === 0) return sendJSON(res, 404, { error: 'Not found' });
      return sendJSON(res, 200, { deleted: id });
    }

    if (urlPath === '/api/admin/change-password' && req.method === 'POST') {
      let body;
      try { body = await readJSONBody(req); } catch (e) { return sendJSON(res, 400, { error: e.message }); }
      if (!body.newPassword || body.newPassword.length < 8) {
        return sendJSON(res, 400, { error: 'newPassword must be at least 8 characters' });
      }
      changePassword(auth.sub, body.newPassword);
      return sendJSON(res, 200, { ok: true });
    }

    if (urlPath === '/api/admin/settings' && req.method === 'PUT') {
      let body;
      try { body = await readJSONBody(req); } catch (e) { return sendJSON(res, 400, { error: e.message }); }
      const allowed = ['shop_name', 'whatsapp_number'];
      const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
      for (const key of allowed) {
        if (key in body) upsert.run(key, String(body[key]));
      }
      return sendJSON(res, 200, getSettings());
    }

    return sendJSON(res, 404, { error: 'Not found' });
  }

  return sendJSON(res, 404, { error: 'Not found' });
}

function serveStatic(req, res, urlPath) {
  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return send(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      const fallback = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallback, (err2, data) => {
        if (err2) return send(res, 404, 'Not found');
        send(res, 200, data, { 'Content-Type': MIME['.html'] });
      });
      return;
    }
    const ext = path.extname(filePath);
    fs.readFile(filePath, (err3, data) => {
      if (err3) return send(res, 500, 'Server error');
      send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    });
  });
}

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (req.method === 'OPTIONS') {
    return send(res, 204, '', {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
  }

  if (urlPath.startsWith('/api/')) {
    try {
      await handleAPI(req, res, urlPath);
    } catch (err) {
      console.error(err);
      sendJSON(res, 500, { error: 'Server error' });
    }
    return;
  }

  serveStatic(req, res, urlPath);
});

server.listen(PORT, () => {
  console.log(`Lil M Shop server running at http://localhost:${PORT}`);
});
