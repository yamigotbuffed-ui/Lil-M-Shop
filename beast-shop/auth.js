const crypto = require('node:crypto');
const { db, hashPassword } = require('./db');

const SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function verifyLogin(username, password) {
  const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
  if (!admin) return false;
  const hash = hashPassword(password, admin.salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(admin.password_hash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function issueToken(username) {
  const payload = { sub: username, exp: Date.now() + TOKEN_TTL_MS };
  const payloadStr = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64url');
  return `${payloadStr}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [payloadStr, sig] = token.split('.');
  if (!payloadStr || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

function changePassword(username, newPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(newPassword, salt);
  db.prepare('UPDATE admin SET password_hash = ?, salt = ? WHERE username = ?')
    .run(hash, salt, username);
}

module.exports = { verifyLogin, issueToken, verifyToken, changePassword };
