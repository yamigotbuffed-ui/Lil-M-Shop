/* ===================== Lil M Shop — frontend app ===================== */

const CATEGORIES = [
  { id: 'prime1-4', label: 'PRIME 1–4', tagline: 'Starter-ranked, fast turnaround', icon: 'shield', grad: 'linear-gradient(135deg,#8a5a2c,#d9a154)', glow: '#d9a154' },
  { id: 'prime5-6', label: 'PRIME 5–6', tagline: 'Mid-tier, stacked skins', icon: 'gem', grad: 'linear-gradient(135deg,#5a3fae,#b24bff)', glow: '#b24bff' },
  { id: 'prime7-8', label: 'PRIME 7–8', tagline: 'Top-tier, max flex', icon: 'crown', grad: 'linear-gradient(135deg,#c9971f,#ffe27a)', glow: '#ffd54a' },
];
function catInfo(id){ return CATEGORIES.find(c => c.id === id) || CATEGORIES[0]; }
function nairaFmt(n){ return '₦' + Number(n || 0).toLocaleString('en-NG'); }
function esc(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

let PRODUCTS = [];
let SETTINGS = { shop_name: 'BEAST SHOP', whatsapp_number: '' };
let TOKEN = localStorage.getItem('beast_admin_token') || null;
let ADMIN_PRODUCTS = [];

const app = document.getElementById('app');

/* ---------- API helper ---------- */
async function api(path, options = {}){
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(options.headers || {})
    }
  });
  if (res.status === 401){
    TOKEN = null;
    localStorage.removeItem('beast_admin_token');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------- image resize (client-side, matches original) ---------- */
function resizeImageFile(file, maxDim = 720, quality = 0.85){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim){ height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height > maxDim){ width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- nav ---------- */
function renderNav(route){
  document.getElementById('brand-flame').innerHTML = icon('flame', 18);
  document.querySelector('#brand-flame').style.color = '#fff';
  document.getElementById('brand-name-el').innerHTML = `${esc(SETTINGS.shop_name || 'BEAST SHOP')}<span class="brand-tag f-mono">MARKET</span>`;

  const links = [
    { r: '#/', label: 'Home', ic: 'home' },
    { r: '#/shop', label: 'Shop', ic: 'bag' },
    { r: '#/admin', label: 'Admin', ic: 'lock' },
  ];
  const linkHTML = links.map(l => {
    const key = l.r.replace('#/', ''); // '', 'shop', 'admin'
    const active = key === '' ? route === '' : route.startsWith(key);
    return `<a href="${l.r}" class="nav-link${active ? ' active' : ''}">${icon(l.ic,15)} ${l.label}</a>`;
  }).join('');
  document.getElementById('nav-links').innerHTML = linkHTML;
  document.getElementById('nav-mobile').innerHTML = linkHTML;
  document.getElementById('nav-toggle').innerHTML = icon('menu', 22);
}

document.getElementById('brand-btn').addEventListener('click', () => location.hash = '#/');
document.getElementById('nav-toggle').addEventListener('click', () => {
  document.getElementById('nav-mobile').classList.toggle('open');
});

function renderFooter(){
  document.getElementById('site-footer').innerHTML =
    `<span class="f-mono">${esc(SETTINGS.shop_name || 'BEAST SHOP')} · Free Fire accounts bought &amp; sold · open 24/7</span>`;
}

/* ---------- rank badge ---------- */
function rankBadgeHTML(catId, size = 44){
  const c = catInfo(catId);
  return `<div class="rank-badge badge-float" style="width:${size}px;height:${size}px;background:${c.grad};box-shadow:0 0 18px ${c.glow}55;color:#0A0A0F">${icon(c.icon, Math.round(size*0.52))}</div>`;
}

/* ==================================================================
   PAGE: HOME
================================================================== */
function renderHome(){
  app.innerHTML = `
    <div class="page-enter">
      <div class="hero scanline">
        <div class="hero-grid" style="position:absolute;inset:0;opacity:.6"></div>
        <div class="hero-orb hero-orb-a"></div>
        <div class="hero-orb hero-orb-two hero-orb-b"></div>
        <div class="hero-glow"></div>
        <div class="hero-inner">
          <div class="hero-pill premium-glass"><span class="status-dot"></span>${icon('flame',13)} LIVE MARKET · TOP FREE FIRE ACCOUNT STORE</div>
          <h1 class="f-display shimmer-text">OWN THE RANK.<br>SKIP THE GRIND.</h1>
          <p>Verified Free Fire accounts, bought and sold in bulk. Pick a tier, pay on WhatsApp, get your login in minutes.</p>
          <a href="#/shop" class="btn btn-blood buy-pulse">Browse accounts ${icon('arrowRight',18)}</a>
          <div class="hero-trust f-mono">
            <span>${icon('check',14)} 5K+ subscribers</span>
            <span>${icon('check',14)} Verified seller</span>
            <span>${icon('check',14)} Instant handover</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="f-display">Choose your tier</h2>
        <p class="sub">Every account is graded so you know exactly what you're getting.</p>
        <div class="tier-grid">
          ${CATEGORIES.map(c => `
            <a href="#/shop/${c.id}" class="tier-card premium-card shine-sweep">
              <div class="glow" style="background:${c.grad}"></div>
              ${rankBadgeHTML(c.id, 46)}
              <div class="label f-display">${c.label}</div>
              <div class="tagline">${c.tagline}</div>
              <span class="cta">Shop this tier ${icon('chevronRight',14)}</span>
            </a>
          `).join('')}
        </div>
      </div>

      <div class="section" style="padding-top:0">
        <div class="feature-grid">
          ${[
            ['Verified stock','Every account is checked by us before it\'s listed — no fakes, no bans waiting to happen.'],
            ['Fast handover','Pay on WhatsApp, get login details straight away. No waiting around.'],
            ['Buy or sell','We buy accounts too — bulk deals welcome. Message us your offer.'],
          ].map(([t,d]) => `
            <div class="feature-card premium-card">
              <div class="t f-display">${t}</div>
              <div class="d">${d}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ==================================================================
   PAGE: SHOP
================================================================== */
function renderShop(activeCat){
  const shown = !activeCat || activeCat === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCat);
  app.innerHTML = `
    <div class="page-enter section" style="padding-top:32px">
      <h1 class="f-display" style="font-size:1.5rem;margin:0 0 4px">Shop accounts</h1>
      <div class="shop-header">
        <p class="sub" style="margin:0">${PRODUCTS.length} account${PRODUCTS.length===1?'':'s'} in stock right now.</p>
        <span class="live-pill f-mono"><span class="status-dot"></span> STOCK UPDATED LIVE</span>
      </div>
      <div class="cat-tabs">
        <button class="cat-tab${(!activeCat||activeCat==='all')?' active':''}" data-cat="all">All accounts</button>
        ${CATEGORIES.map(c => `<button class="cat-tab${activeCat===c.id?' active':''}" data-cat="${c.id}">${icon(c.icon,15)} ${c.label}</button>`).join('')}
      </div>
      <div id="shop-grid"></div>
    </div>
  `;
  const grid = document.getElementById('shop-grid');
  if (shown.length === 0){
    grid.innerHTML = `<div class="empty-block">${icon('imageOff',32)}<div>No accounts listed${activeCat && activeCat!=='all' ? ' in this tier' : ''} yet — check back soon.</div></div>`;
  } else {
    grid.innerHTML = `<div class="product-grid">${shown.map(productCardHTML).join('')}</div>`;
  }
  app.querySelectorAll('.cat-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      location.hash = cat === 'all' ? '#/shop' : `#/shop/${cat}`;
    });
  });
}

function productCardHTML(p){
  const cat = catInfo(p.category);
  const sold = p.status === 'sold';
  return `
    <a href="#/product/${p.id}" class="product-card premium-card shine-sweep product-card-hover">
      <div class="imgwrap">
        ${p.image ? `<img class="product-image" src="${p.image}" alt="${esc(p.title)}" style="${sold?'filter:grayscale(1);opacity:.4':''}">` : `<div class="noimg">${icon('imageOff',28)}</div>`}
        <div class="badge-pos">${rankBadgeHTML(p.category,40)}</div>
        ${sold ? `<div class="sold-overlay"><span class="f-display">SOLD OUT</span></div>` : ''}
      </div>
      <div class="body">
        <div class="cat-label f-mono">${cat.label}</div>
        <h3>${esc(p.title)}</h3>
        <p class="desc">${esc(p.description) || ''}</p>
        <div class="footer-row">
          <span class="price f-mono">${nairaFmt(p.price)}</span>
          <span class="details-link">Details ${icon('chevronRight',14)}</span>
        </div>
      </div>
    </a>
  `;
}

/* ==================================================================
   PAGE: PRODUCT DETAIL
================================================================== */
function renderProduct(id){
  const product = PRODUCTS.find(p => String(p.id) === String(id));
  if (!product){
    app.innerHTML = `
      <div class="page-enter section center" style="max-width:672px">
        This listing isn't available anymore.
        <div style="margin-top:16px"><a href="#/shop" style="color:var(--coral);font-weight:600">Back to shop</a></div>
      </div>`;
    return;
  }
  const cat = catInfo(product.category);
  const sold = product.status === 'sold';
  const waText = encodeURIComponent(`Hi ${SETTINGS.shop_name || 'Lil M Shop'}! I want to buy: "${product.title}" (${cat.label}) — ${nairaFmt(product.price)}`);
  const waLink = `https://wa.me/${SETTINGS.whatsapp_number}?text=${waText}`;

  app.innerHTML = `
    <div class="page-enter section" style="padding-top:32px;max-width:896px">
      <button class="back-link" id="back-btn">${icon('chevronLeft',16)} Back to shop</button>
      <div class="product-detail">
        <div class="product-detail-img premium-card scanline">
          ${product.image ? `<img src="${product.image}" alt="${esc(product.title)}" style="${sold?'filter:grayscale(1);opacity:.4':''}">` : `<div class="noimg" style="height:100%">${icon('imageOff',40)}</div>`}
          <div style="position:absolute;top:16px;left:16px">${rankBadgeHTML(product.category,52)}</div>
        </div>
        <div class="product-detail-info">
          <div class="cat-label f-mono">${cat.label} · ${cat.tagline}</div>
          <h1 class="f-display">${esc(product.title)}</h1>
          <p class="desc">${esc(product.description) || 'No extra details provided for this listing.'}</p>
          <span class="price f-mono">${nairaFmt(product.price)}</span>
          ${sold
            ? `<button class="btn btn-block" disabled style="background:rgba(255,255,255,0.05);color:var(--ashDim)">${icon('ban',18)} Unavailable</button>`
            : `<a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-blood btn-block buy-pulse">${icon('message',18)} Buy now on WhatsApp</a>`
          }
        </div>
      </div>
    </div>
  `;
  document.getElementById('back-btn').addEventListener('click', () => {
    location.hash = product.category ? `#/shop/${product.category}` : '#/shop';
  });
}

/* ==================================================================
   ADMIN — LOGIN
================================================================== */
function renderAdminLogin(){
  app.innerHTML = `
    <div class="page-enter admin-gate-wrap">
      <div class="admin-gate-box premium-glass">
        <div class="head"><span>${icon('layout',20)}</span><span class="f-display" style="font-size:0.9rem;letter-spacing:.1em">CONTROL ROOM</span></div>
        <p class="sub">Log in to manage ${esc(SETTINGS.shop_name || 'Lil M Shop')} listings.</p>
        <form id="login-form">
          <div class="field">
            <label>Username</label>
            <input type="text" id="li-username" autocomplete="username" required>
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" id="li-password" autocomplete="current-password" required>
          </div>
          <div class="form-error" id="li-error">Invalid credentials.</div>
          <button type="submit" class="btn btn-cyan btn-block">${icon('lock',16)} Unlock</button>
        </form>
      </div>
    </div>
  `;
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('li-error');
    errEl.classList.remove('show');
    try{
      const data = await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username: document.getElementById('li-username').value.trim(),
          password: document.getElementById('li-password').value
        })
      });
      TOKEN = data.token;
      localStorage.setItem('beast_admin_token', TOKEN);
      await loadAdminProducts();
      renderAdminDashboard('overview');
    }catch(err){
      errEl.textContent = err.message;
      errEl.classList.add('show');
    }
  });
}

/* ==================================================================
   ADMIN — DASHBOARD
================================================================== */
async function loadAdminProducts(){
  ADMIN_PRODUCTS = await api('/api/admin/products');
}

function adminLogout(){
  TOKEN = null;
  localStorage.removeItem('beast_admin_token');
  location.hash = '#/admin';
}

function renderAdminDashboard(tab, editId){
  app.innerHTML = `
    <div class="page-enter">
      <div class="admin-header">
        <div class="flex items-center gap-2">${icon('layout',20)}<span class="f-display" style="font-size:0.9rem;letter-spacing:.1em">CONTROL ROOM</span></div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" id="admin-view-store">${icon('store',14)} View storefront</button>
          <button class="btn btn-ghost btn-sm" id="admin-logout-btn">Log out</button>
        </div>
      </div>
      <div class="admin-tabs">
        <button class="admin-tab${tab==='overview'?' active':''}" data-tab="overview">${icon('layout',15)} Overview</button>
        <button class="admin-tab${tab==='listings'?' active':''}" data-tab="listings">${icon('package',15)} Listings</button>
        <button class="admin-tab${tab==='form'?' active':''}" data-tab="form">${icon('plus',15)} Add product</button>
        <button class="admin-tab${tab==='settings'?' active':''}" data-tab="settings">${icon('lock',15)} Settings</button>
      </div>
      <div id="admin-body"></div>
    </div>
  `;
  document.getElementById('admin-view-store').addEventListener('click', () => location.hash = '#/');
  document.getElementById('admin-logout-btn').addEventListener('click', adminLogout);
  app.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tab;
      location.hash = t === 'form' ? '#/admin/form' : `#/admin/${t}`;
    });
  });

  const body = document.getElementById('admin-body');
  if (tab === 'overview') renderAdminOverview(body);
  else if (tab === 'listings') renderAdminListings(body);
  else if (tab === 'form') renderAdminForm(body, editId);
  else if (tab === 'settings') renderAdminSettings(body);
}

function renderAdminOverview(body){
  const totalValue = ADMIN_PRODUCTS.filter(p => p.status === 'available').reduce((s,p) => s + p.price, 0);
  const soldCount = ADMIN_PRODUCTS.filter(p => p.status === 'sold').length;
  const prime78Count = ADMIN_PRODUCTS.filter(p => p.category === 'prime7-8').length;
  const stat = (ic, color, value, label) => `
    <div class="stat-card" style="border:1px solid ${color}40;background:${color}18">
      <div style="color:${color};margin-bottom:8px">${icon(ic,18)}</div>
      <div class="val f-mono">${value}</div>
      <div class="lbl">${label}</div>
    </div>`;
  body.innerHTML = `
    <div class="stat-grid">
      ${stat('package','#00E5C7', ADMIN_PRODUCTS.length, 'Total listings')}
      ${stat('trendingUp','#3fe07a', nairaFmt(totalValue), 'Available stock value')}
      ${stat('ban','#E4142B', soldCount, 'Sold out')}
      ${stat('crown','#B24BFF', prime78Count, 'Prime 7–8 listings')}
    </div>
    ${ADMIN_PRODUCTS.length === 0
      ? `<div class="empty-block">No listings yet. <a href="#/admin/form" style="color:var(--violet);font-weight:600;text-decoration:underline">Add your first product</a>.</div>`
      : `<div>
          ${ADMIN_PRODUCTS.slice(0,5).map(p => `
            <div class="recent-row premium-card">
              <span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title)}</span>
              <span class="f-mono" style="color:var(--coral)">${nairaFmt(p.price)}</span>
            </div>
          `).join('')}
          ${ADMIN_PRODUCTS.length > 5 ? `<a href="#/admin/listings" style="font-size:0.78rem;font-weight:600;color:var(--violet)">View all ${ADMIN_PRODUCTS.length} listings →</a>` : ''}
        </div>`
    }
  `;
}

function renderAdminListings(body, filter){
  filter = filter || 'all';
  const list = filter === 'all' ? ADMIN_PRODUCTS : ADMIN_PRODUCTS.filter(p => p.category === filter);
  body.innerHTML = `
    <div class="flex wrap items-center gap-2" style="margin-bottom:20px">
      <a href="#/admin/form" class="btn btn-violet btn-sm">${icon('plus',16)} Add product</a>
      <div class="flex gap-2" style="overflow-x:auto">
        <button class="cat-tab${filter==='all'?' active':''}" data-f="all" style="${filter==='all'?'background:rgba(255,255,255,0.1);border-color:var(--lineStrong);color:#fff':''}">All</button>
        ${CATEGORIES.map(c => `<button class="cat-tab${filter===c.id?' active':''}" data-f="${c.id}">${c.label}</button>`).join('')}
      </div>
    </div>
    <div id="listing-rows"></div>
  `;
  const rows = document.getElementById('listing-rows');
  if (list.length === 0){
    rows.innerHTML = `<div class="empty-block">No listings here yet.</div>`;
  } else {
    rows.innerHTML = list.map(p => {
      const cat = catInfo(p.category);
      return `
        <div class="listing-row premium-card">
          <div class="listing-thumb">${p.image ? `<img src="${p.image}" alt="">` : icon('imageOff',18)}</div>
          <div class="listing-info">
            <div class="listing-cat f-mono">${icon(cat.icon,11)} ${cat.label}${p.status==='sold' ? '<span class="sold-chip">SOLD</span>' : ''}</div>
            <div class="listing-title">${esc(p.title)}</div>
            <div class="listing-price f-mono">${nairaFmt(p.price)}</div>
          </div>
          <div class="listing-actions">
            <button class="icon-btn" style="color:var(--cyan)" data-edit="${p.id}">${icon('pencil',15)}</button>
            <button class="icon-btn" style="color:#ff6b7d" data-del="${p.id}">${icon('trash',15)}</button>
          </div>
        </div>`;
    }).join('');
  }
  body.querySelectorAll('.cat-tab[data-f]').forEach(btn => {
    btn.addEventListener('click', () => renderAdminListings(body, btn.dataset.f));
  });
  body.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => { location.hash = `#/admin/form/${btn.dataset.edit}`; });
  });
  body.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.del, body, filter));
  });
}

function confirmDelete(id, listBody, filter){
  const product = ADMIN_PRODUCTS.find(p => String(p.id) === String(id));
  if (!product) return;
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="confirm-box">
      <div style="color:var(--blood);margin-bottom:8px">${icon('trash',28)}</div>
      <p style="font-weight:600;margin:0 0 4px">Delete this listing?</p>
      <p class="sub" style="margin:0 0 20px">"${esc(product.title)}" will be removed permanently.</p>
      <div class="flex gap-3">
        <button class="btn btn-ghost" style="flex:1" id="cd-cancel">Cancel</button>
        <button class="btn" style="flex:1;background:var(--blood);color:#fff" id="cd-confirm">Delete</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  wrap.querySelector('#cd-cancel').addEventListener('click', () => wrap.remove());
  wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
  wrap.querySelector('#cd-confirm').addEventListener('click', async () => {
    try{
      await api(`/api/admin/products/${id}`, { method: 'DELETE' });
      await loadAdminProducts();
      await refreshPublicProducts();
      toast('Listing deleted');
      wrap.remove();
      renderAdminListings(listBody, filter);
    }catch(err){ toast(err.message); }
  });
}

function renderAdminForm(body, editId){
  const editingProduct = editId ? ADMIN_PRODUCTS.find(p => String(p.id) === String(editId)) : null;
  const form = editingProduct
    ? { ...editingProduct }
    : { title: '', category: 'prime1-4', price: '', description: '', image: '', status: 'available' };

  body.innerHTML = `
    <div class="admin-form">
      <div class="kicker f-display">${editingProduct ? 'EDIT LISTING' : 'NEW LISTING'}</div>
      <div class="field">
        <label class="field-label">Product image</label>
        <div class="img-upload-box" id="img-box">
          ${form.image ? `<img src="${form.image}" alt="preview">` : `<div class="img-upload-placeholder">${icon('upload',22)}<div style="font-size:0.78rem;margin-top:4px">Tap to upload photo</div></div>`}
        </div>
        <input type="file" accept="image/*" id="img-input" class="hidden">
      </div>
      <div class="field">
        <label class="field-label">Title</label>
        <input type="text" id="f-title" value="${esc(form.title)}" placeholder="e.g. Grandmaster Vault Account">
      </div>
      <div class="field">
        <label class="field-label">Category</label>
        <div class="cat-picker" id="cat-picker">
          ${CATEGORIES.map(c => `
            <button type="button" class="cat-pick-btn" data-cat="${c.id}" style="${form.category===c.id ? `background:${c.grad};color:#0A0A0F;border-color:transparent` : ''}">
              ${icon(c.icon,16)} ${c.label}
            </button>`).join('')}
        </div>
      </div>
      <div class="field">
        <label class="field-label">Price (₦)</label>
        <input type="number" min="0" id="f-price" value="${esc(form.price)}" placeholder="15000">
      </div>
      <div class="field">
        <label class="field-label">Description</label>
        <textarea id="f-desc" rows="3" placeholder="Level, skins, linked email, extras...">${esc(form.description)}</textarea>
      </div>
      <div class="field">
        <label class="field-label">Status</label>
        <div class="status-picker" id="status-picker">
          <button type="button" class="status-pick-btn" data-status="available" style="${form.status==='available' ? 'background:#3fe07a;color:#0A0A0F;border-color:transparent' : ''}">${icon('eye',15)} Available</button>
          <button type="button" class="status-pick-btn" data-status="sold" style="${form.status==='sold' ? 'background:#E4142B;color:#fff;border-color:transparent' : ''}">${icon('eyeOff',15)} Sold out</button>
        </div>
      </div>
      <div class="form-error" id="form-err"></div>
      <div class="flex gap-3" style="padding-top:8px">
        <a href="#/admin/listings" class="btn btn-ghost" style="flex:1">Cancel</a>
        <button type="button" id="save-btn" class="btn btn-violet" style="flex:1">${icon('check',16)} Save listing</button>
      </div>
    </div>
  `;

  let state = { ...form, category: form.category || 'prime1-4', status: form.status || 'available' };

  const imgBox = document.getElementById('img-box');
  const imgInput = document.getElementById('img-input');
  imgBox.addEventListener('click', () => imgInput.click());
  imgInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    imgBox.innerHTML = `<div style="color:var(--violet)" class="spin">${icon('loader',24)}</div>`;
    try{
      const dataUrl = await resizeImageFile(file);
      state.image = dataUrl;
      imgBox.innerHTML = `<img src="${dataUrl}" alt="preview">`;
    }catch{
      imgBox.innerHTML = `<div class="img-upload-placeholder">${icon('upload',22)}<div style="font-size:0.78rem;margin-top:4px">Tap to upload photo</div></div>`;
      toast("Couldn't read that image");
    }
  });

  document.getElementById('cat-picker').querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.cat;
      document.getElementById('cat-picker').querySelectorAll('[data-cat]').forEach(b => {
        const c = catInfo(b.dataset.cat);
        b.style.cssText = b.dataset.cat === state.category ? `background:${c.grad};color:#0A0A0F;border-color:transparent` : '';
      });
    });
  });
  document.getElementById('status-picker').querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.status = btn.dataset.status;
      document.getElementById('status-picker').querySelectorAll('[data-status]').forEach(b => {
        if (b.dataset.status === 'available') b.style.cssText = state.status === 'available' ? 'background:#3fe07a;color:#0A0A0F;border-color:transparent' : '';
        else b.style.cssText = state.status === 'sold' ? 'background:#E4142B;color:#fff;border-color:transparent' : '';
      });
    });
  });

  document.getElementById('save-btn').addEventListener('click', async () => {
    const title = document.getElementById('f-title').value.trim();
    const price = document.getElementById('f-price').value;
    const errEl = document.getElementById('form-err');
    errEl.classList.remove('show');
    if (!title || price === '' || Number(price) < 0){
      errEl.textContent = 'Title and a valid price are required.';
      errEl.classList.add('show');
      return;
    }
    const payload = {
      title,
      category: state.category,
      price: Number(price),
      description: document.getElementById('f-desc').value.trim(),
      image: state.image || '',
      status: state.status
    };
    try{
      if (editingProduct){
        await api(`/api/admin/products/${editingProduct.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast('Listing updated');
      } else {
        await api('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) });
        toast('Listing added');
      }
      await loadAdminProducts();
      await refreshPublicProducts();
      location.hash = '#/admin/listings';
    }catch(err){
      errEl.textContent = err.message;
      errEl.classList.add('show');
    }
  });
}

function renderAdminSettings(body){
  body.innerHTML = `
    <div class="settings-box">
      <div class="field">
        <label class="field-label">Shop name</label>
        <input type="text" id="s-shopname" value="${esc(SETTINGS.shop_name || '')}">
      </div>
      <div class="field">
        <label class="field-label">WhatsApp number (international format, no + or spaces)</label>
        <input type="text" id="s-whatsapp" value="${esc(SETTINGS.whatsapp_number || '')}" placeholder="2348012345678">
      </div>
      <button class="btn btn-cyan" id="save-settings-btn">Save settings</button>

      <div class="premium-divider" style="margin:32px 0"></div>

      <div class="kicker f-display" style="color:var(--violet)">CHANGE PASSWORD</div>
      <div class="field">
        <label class="field-label">New password</label>
        <input type="password" id="s-newpw" minlength="8">
      </div>
      <div class="field">
        <label class="field-label">Confirm new password</label>
        <input type="password" id="s-confirmpw" minlength="8">
      </div>
      <div class="form-error" id="pw-err"></div>
      <button class="btn btn-ghost" id="save-pw-btn">Update password</button>
    </div>
  `;
  document.getElementById('save-settings-btn').addEventListener('click', async () => {
    try{
      SETTINGS = await api('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          shop_name: document.getElementById('s-shopname').value.trim() || 'BEAST SHOP',
          whatsapp_number: document.getElementById('s-whatsapp').value.trim()
        })
      });
      renderNav(currentRoute());
      renderFooter();
      toast('Settings saved');
    }catch(err){ toast(err.message); }
  });
  document.getElementById('save-pw-btn').addEventListener('click', async () => {
    const errEl = document.getElementById('pw-err');
    errEl.classList.remove('show');
    const pw1 = document.getElementById('s-newpw').value;
    const pw2 = document.getElementById('s-confirmpw').value;
    if (pw1.length < 8){ errEl.textContent = 'Password must be at least 8 characters.'; errEl.classList.add('show'); return; }
    if (pw1 !== pw2){ errEl.textContent = "Passwords don't match."; errEl.classList.add('show'); return; }
    try{
      await api('/api/admin/change-password', { method: 'POST', body: JSON.stringify({ newPassword: pw1 }) });
      toast('Password updated');
      document.getElementById('s-newpw').value = '';
      document.getElementById('s-confirmpw').value = '';
    }catch(err){ errEl.textContent = err.message; errEl.classList.add('show'); }
  });
}

/* ==================================================================
   ROUTER
================================================================== */
function currentRoute(){ return location.hash.replace(/^#\/?/, ''); }

async function refreshPublicProducts(){
  PRODUCTS = await api('/api/products');
}

async function router(){
  const route = currentRoute(); // e.g. '', 'shop', 'shop/prime1-4', 'product/3', 'admin', 'admin/listings', 'admin/form', 'admin/form/3'
  const parts = route.split('/').filter(Boolean);
  document.getElementById('nav-mobile').classList.remove('open');
  renderNav(route);

  if (parts[0] === 'admin'){
    if (!TOKEN){
      renderAdminLogin();
      return;
    }
    try{ await loadAdminProducts(); }
    catch(err){ renderAdminLogin(); return; }

    if (parts[1] === 'form'){
      renderAdminDashboard('form', parts[2]);
    } else {
      renderAdminDashboard(parts[1] || 'overview');
    }
    return;
  }

  if (parts[0] === 'product'){
    renderProduct(parts[1]);
    return;
  }

  if (parts[0] === 'shop'){
    renderShop(parts[1] || 'all');
    return;
  }

  renderHome();
}

window.addEventListener('hashchange', router);

/* ---------- boot ---------- */
(async function init(){
  try{
    const [products, settings] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ]);
    PRODUCTS = products;
    SETTINGS = settings;
  }catch(err){
    console.error('Failed to load shop data', err);
  }
  renderFooter();
  router();
})();
