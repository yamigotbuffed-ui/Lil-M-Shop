const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'shop.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL DEFAULT 'prime1-4',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    price INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function ensureDefaultAdmin() {
  const existing = db.prepare('SELECT id FROM admin LIMIT 1').get();
  if (existing) return;

  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASS || 'changeme123';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);

  db.prepare('INSERT INTO admin (username, password_hash, salt) VALUES (?, ?, ?)')
    .run(username, hash, salt);

  console.log('----------------------------------------------------');
  console.log('Created default admin account:');
  console.log('  username:', username);
  console.log('  password:', password);
  console.log('CHANGE THIS PASSWORD after your first login (Admin > Change Password).');
  console.log('(Set ADMIN_USER / ADMIN_PASS env vars before the very first run to pick your own.)');
  console.log('----------------------------------------------------');
}

function ensureDefaultSettings() {
  const existing = db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_number'").get();
  if (!existing) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('whatsapp_number', ?)")
      .run(process.env.WHATSAPP_NUMBER || '2348145242449');
  }
  const shopName = db.prepare("SELECT value FROM settings WHERE key = 'shop_name'").get();
  if (!shopName) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('shop_name', 'LIL M SHOP')").run();
  }
}

function seedSampleProductsIfEmpty() {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (count > 0) return;

  const sample = [
    ['prime7-8', 'Grandmaster Vault Account', 'Stacked Grandmaster account, maxed evo collection, rare emote set. Built over 2 years, zero bans.', '', 185000, 'available'],
    ['prime5-6', 'Evo Arsenal Set', 'Full evo weapon skin set plus 3 evo pets, solid Diamond rank.', '', 92000, 'available'],
    ['prime1-4', 'Fresh Grind Account', 'Light on cosmetics but a solid base to build from — cheapest way into a real ranked account.', '', 12000, 'available']
  ];
  const stmt = db.prepare(`
    INSERT INTO products (category, title, description, image, price, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const row of sample) stmt.run(...row);
}

ensureDefaultAdmin();
ensureDefaultSettings();
seedSampleProductsIfEmpty();

module.exports = { db, hashPassword };
