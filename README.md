# Beast Shop

A Free Fire account marketplace: public storefront + a real, password-protected
admin dashboard to manage listings. No npm packages required — only Node's
built-in `http`, `node:sqlite`, and `crypto` modules, so there's nothing to
compile or `npm install`.

This started as a Claude-artifact React prototype (`beast-shop-premium.jsx`).
That version only worked inside Claude.ai — it used `window.storage` (an
artifact-only API) for persistence and a hardcoded 4-digit PIN sitting in
plain-text client code. This version is the real, sellable thing: the same
visual design, rebuilt as a standalone site with a proper backend, a real
login, and shared data every visitor sees identically.

## Requirements

- Node.js 22+ (for `node:sqlite`). Check with `node --version`.

## Run it

```bash
cd beast-shop
node server.js
```

First run prints a default admin login:

```
username: admin
password: changeme123
```

Open:
- Storefront: `http://localhost:3000/`
- Admin: `http://localhost:3000/#/admin`  (also reachable via the "Admin" nav link)

**Log in and change that password immediately** — Admin → Settings → Change Password.

To set your own admin credentials on first run instead of the default:

```bash
ADMIN_USER=youradminname ADMIN_PASS=yourStrongPassword node server.js
```

(Only applies the very first time. After that, change the password from the
dashboard.)

## What's inside

- **Storefront** — hero, 3 account tiers (Prime 1–4 / 5–6 / 7–8), live product
  grid with category filters, product detail page, "Buy on WhatsApp" checkout
  link.
- **Admin dashboard** — Overview (stats), Listings (edit/delete/filter by
  tier), Add/Edit product form with client-side image upload (photos are
  resized in-browser before upload, so no file-storage setup needed), Settings
  (shop name, WhatsApp number, password change).
- All of it backed by a real SQLite database (`data/shop.db`), so every
  visitor — on any device — sees the same live catalog.

## How it works

- `db.js` — creates the database on first run, seeds 3 sample products, the
  default admin account, and default settings (shop name, WhatsApp number).
- `auth.js` — password hashing (scrypt) + a lightweight signed session token
  (HMAC-SHA256, same idea as a JWT) — no `jsonwebtoken` package needed.
- `server.js` — one process serves the static frontend (`public/`) and the
  JSON API (`/api/...`) on a single port.
- `public/js/app.js` — the whole frontend: hash-based router (`#/`, `#/shop`,
  `#/product/:id`, `#/admin`, `#/admin/listings`, etc.), all page rendering,
  and the admin dashboard logic. No build step, no framework — plain
  JavaScript.
- `public/js/icons.js` — small inline SVG icon set (no external icon library).
- `public/css/style.css` — the full visual design (colors, fonts, glow
  effects, animations) recreated from the original prototype.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `ADMIN_USER` | Admin username, first run only | `admin` |
| `ADMIN_PASS` | Admin password, first run only | `changeme123` |
| `WHATSAPP_NUMBER` | Default WhatsApp number, first run only (editable later in Admin → Settings) | `2348145242449` |
| `TOKEN_SECRET` | Secret used to sign admin login sessions | random on each restart |

**Set `TOKEN_SECRET` to a fixed random string for real deployments** —
otherwise every server restart logs every admin session out.

```bash
PORT=3000 TOKEN_SECRET=some-long-random-string node server.js
```

## Deploying (Termux → real hosting)

This is one process serving both the frontend and the API, so deployment is
simple: run `node server.js` continuously on any machine with a public IP —
a small VPS, or Oracle Cloud's Always Free tier works well. Point a domain at
it and you're done.

To keep it running after closing the terminal:

```bash
nohup node server.js > shop.log 2>&1 &
```

For production, consider `pm2` or a systemd service to auto-restart it if it
crashes or the machine reboots.

## Handing this off to a buyer

Everything a buyer needs to run their own store:
1. This whole folder.
2. Node.js 22+ installed on whatever machine/VPS they'll run it on.
3. `node server.js` — then log in and change the password immediately.
4. Update Admin → Settings with their own shop name and WhatsApp number.

There's no license key, no external account, no ongoing dependency on
anything outside this folder — it's genuinely theirs to run.

## File structure

```
beast-shop/
├── server.js              # HTTP server + API routes
├── db.js                  # SQLite schema + seeding
├── auth.js                # login verification + session tokens
├── package.json
├── data/                  # shop.db lives here (created on first run)
└── public/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── icons.js
        └── app.js
```
