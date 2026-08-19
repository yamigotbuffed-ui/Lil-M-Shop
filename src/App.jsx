import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingBag, Plus, Trash2, Pencil, X, Upload, Lock, LayoutDashboard,
  Store, Check, Flame, Shield, Gem, Crown, ChevronRight, ChevronLeft, MessageCircle,
  Ban, ImageOff, Loader2, TrendingUp, Package, Eye, EyeOff, Home as HomeIcon,
  Menu, ArrowRight
} from "lucide-react";

/* ---------------------------------------------------------------
   BEAST SHOP — multi-page Free Fire account marketplace + admin
   IMPORTANT: this sandbox only supports Tailwind's PRE-DEFINED
   utility classes — arbitrary values like bg-[#111] do NOT work
   (no JIT compiler here). So every custom color/gradient below is
   applied via inline `style`, and Tailwind is only used for layout
   (flex/grid/spacing/rounded/font-weight/text-size).
---------------------------------------------------------------- */

const C = {
  void: "#0A0A0F",
  panel: "#121017",
  panel2: "#0d0f12",
  line: "rgba(255,255,255,0.10)",
  lineStrong: "rgba(255,255,255,0.25)",
  blood: "#E4142B",
  bloodSoft: "rgba(228,20,43,0.25)",
  bloodFaint: "rgba(228,20,43,0.10)",
  deep: "#7A0D1A",
  ember: "#FF6A1A",
  ghost: "#F4F1EE",
  ash: "#9891A0",
  ashDim: "#605b68",
  coral: "#ff8a6b",
  green: "#3fe07a",
  cyan: "#00E5C7",
  blue: "#00b3ff",
  violet: "#B24BFF",
};

const WHATSAPP_NUMBER = "2348145242449";
const STORAGE_KEY = "products_v3";

const CATEGORIES = [
  { id: "prime1-4", label: "PRIME 1\u20134", tagline: "Starter-ranked, fast turnaround", icon: Shield, grad: `linear-gradient(135deg,#8a5a2c,#d9a154)`, glow: "#d9a154" },
  { id: "prime5-6", label: "PRIME 5\u20136", tagline: "Mid-tier, stacked skins", icon: Gem, grad: `linear-gradient(135deg,#5a3fae,#b24bff)`, glow: "#b24bff" },
  { id: "prime7-8", label: "PRIME 7\u20138", tagline: "Top-tier, max flex", icon: Crown, grad: `linear-gradient(135deg,#c9971f,#ffe27a)`, glow: "#ffd54a" },
];

function nairaFmt(n) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); }
function catInfo(id) { return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]; }

function resizeImageFile(file, maxDim = 720, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------- global chrome ---------------- */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800;900&family=Barlow+Semi+Condensed:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
      html, body, #root { background:${C.void} !important; margin:0; min-height:100%; }
      .f-display { font-family: 'Orbitron', sans-serif; }
      .f-body { font-family: 'Barlow Semi Condensed', sans-serif; }
      .f-mono { font-family: 'JetBrains Mono', monospace; }
      @keyframes bshimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      @keyframes bpulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,106,26,0.55); } 50% { box-shadow: 0 0 0 10px rgba(255,106,26,0); } }
      @keyframes bfloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
      @keyframes bfade { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
      .buy-pulse { animation: bpulse 2.2s ease-in-out infinite; }
      .badge-float { animation: bfloat 3.5s ease-in-out infinite; }
      .page-enter { animation: bfade 0.35s ease-out; }
      .shimmer-text {
        background: linear-gradient(90deg, ${C.blood} 0%, ${C.ember} 25%, ${C.blood} 50%, ${C.ember} 75%, ${C.blood} 100%);
        background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: bshimmer 5s linear infinite;
      }
      .beast-scope input, .beast-scope textarea { color: ${C.ghost}; background: transparent; }
      .beast-scope input::placeholder, .beast-scope textarea::placeholder { color: ${C.ashDim}; }
      .beast-scope ::-webkit-scrollbar { width: 8px; height: 8px; }
      .beast-scope ::-webkit-scrollbar-track { background: ${C.void}; }
      .beast-scope ::-webkit-scrollbar-thumb { background: linear-gradient(${C.blood},${C.ember}); border-radius: 8px; }

      /* BEAST SHOP // premium visual upgrade — functionality remains unchanged */
      * { box-sizing: border-box; }
      body { overflow-x: hidden; }
      .beast-scope {
        background:
          radial-gradient(circle at 10% 10%, rgba(228,20,43,.07), transparent 28%),
          radial-gradient(circle at 90% 25%, rgba(178,75,255,.055), transparent 26%),
          ${C.void};
      }
      .beast-scope button, .beast-scope a { -webkit-tap-highlight-color: transparent; }
      .beast-scope button { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease, background .22s ease, filter .22s ease; }
      .beast-scope button:hover { transform: translateY(-2px); }
      .beast-scope button:active { transform: translateY(0) scale(.985); }
      .beast-scope input, .beast-scope textarea {
        transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
      }
      .beast-scope input:focus, .beast-scope textarea:focus {
        border-color: rgba(255,106,26,.7) !important;
        box-shadow: 0 0 0 3px rgba(255,106,26,.09), 0 0 24px rgba(228,20,43,.08);
        background: rgba(255,255,255,.025) !important;
      }
      .premium-glass {
        background: linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025));
        border: 1px solid rgba(255,255,255,.11);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 18px 60px rgba(0,0,0,.22);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }
      .premium-card {
        background: linear-gradient(145deg, rgba(24,21,30,.96), rgba(12,12,17,.96));
        border: 1px solid rgba(255,255,255,.09);
        box-shadow: 0 14px 40px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.035);
      }
      .premium-card:hover {
        border-color: rgba(255,106,26,.34) !important;
        box-shadow: 0 20px 55px rgba(0,0,0,.36), 0 0 30px rgba(228,20,43,.08);
      }
      .hero-grid {
        background-image:
          linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: linear-gradient(to bottom, black, transparent 82%);
        -webkit-mask-image: linear-gradient(to bottom, black, transparent 82%);
      }
      .hero-orb {
        animation: orbfloat 7s ease-in-out infinite;
        filter: blur(1px);
      }
      .hero-orb-two { animation-delay: -3s; animation-duration: 9s; }
      @keyframes orbfloat {
        0%,100% { transform: translate3d(0,0,0) scale(1); }
        50% { transform: translate3d(0,-18px,0) scale(1.06); }
      }
      .scanline {
        position: relative;
        overflow: hidden;
      }
      .scanline::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,.035) 50%, transparent 100%);
        transform: translateY(-100%);
        animation: scan 5s linear infinite;
      }
      @keyframes scan { to { transform: translateY(100%); } }
      .status-dot {
        width: 7px; height: 7px; border-radius: 999px;
        background: ${C.green};
        box-shadow: 0 0 12px ${C.green};
        animation: statuspulse 1.8s ease-in-out infinite;
      }
      @keyframes statuspulse { 0%,100% { opacity: .65; } 50% { opacity: 1; box-shadow: 0 0 20px ${C.green}; } }
      .product-image { transition: transform .55s cubic-bezier(.2,.75,.2,1), filter .55s ease; }
      .group:hover .product-image { transform: scale(1.07); }
      .shine-sweep { position: relative; overflow: hidden; }
      .shine-sweep::before {
        content: "";
        position: absolute;
        top: 0; bottom: 0; width: 38%;
        left: -55%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.10), transparent);
        transform: skewX(-18deg);
        transition: left .7s ease;
        pointer-events: none;
      }
      .shine-sweep:hover::before { left: 125%; }
      .premium-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(228,20,43,.55), rgba(178,75,255,.35), transparent);
      }
      .micro-label { letter-spacing: .18em; text-transform: uppercase; }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
      }
    `}</style>
  );
}

function RankBadge({ categoryId, size = 44 }) {
  const cat = catInfo(categoryId);
  const Icon = cat.icon;
  return (
    <div className="badge-float rounded-xl flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: cat.grad, boxShadow: `0 0 18px ${cat.glow}55` }}>
      <Icon size={size * 0.52} color={C.void} strokeWidth={2.5} />
    </div>
  );
}

function NavLink({ active, onClick, Icon, children }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
      style={{ background: active ? C.blood : "transparent", color: active ? "#fff" : C.ash }}>
      <Icon size={15} /> {children}
    </button>
  );
}

function SiteNav({ page, go }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 premium-glass" style={{ background: "rgba(10,10,15,0.82)", borderBottom: `1px solid ${C.bloodSoft}` }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <button onClick={() => go("home")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `linear-gradient(135deg,${C.blood},${C.deep})` }}>
            <Flame size={18} color="#fff" />
          </div>
          <span className="f-display text-lg tracking-wide" style={{ color: C.ghost }}>BEAST<span style={{ color: C.blood }}>SHOP</span><span className="text-[8px] ml-2 f-mono align-top" style={{ color: C.ash }}>MARKET</span></span>
        </button>
        <div className="hidden sm:flex items-center gap-1">
          <NavLink active={page === "home"} onClick={() => go("home")} Icon={HomeIcon}>Home</NavLink>
          <NavLink active={page === "shop"} onClick={() => go("shop")} Icon={ShoppingBag}>Shop</NavLink>
          <NavLink active={false} onClick={() => go("gate")} Icon={Lock}>Admin</NavLink>
        </div>
        <button className="sm:hidden" style={{ color: C.ash }} onClick={() => setOpen((o) => !o)}>
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div className="sm:hidden flex flex-col gap-1 px-4 pb-3">
          <NavLink active={page === "home"} onClick={() => { go("home"); setOpen(false); }} Icon={HomeIcon}>Home</NavLink>
          <NavLink active={page === "shop"} onClick={() => { go("shop"); setOpen(false); }} Icon={ShoppingBag}>Shop</NavLink>
          <NavLink active={false} onClick={() => { go("gate"); setOpen(false); }} Icon={Lock}>Admin</NavLink>
        </div>
      )}
    </div>
  );
}

function SiteFooter() {
  return (
    <div className="text-center text-xs f-mono py-8 premium-divider" style={{ borderTop: `1px solid ${C.line}`, color: C.ashDim }}>
      BEAST SHOP \u00b7 Free Fire accounts bought &amp; sold \u00b7 @beastffx \u00b7 open 24/7
    </div>
  );
}

/* ==================================================================
   PAGE: HOME
================================================================== */

function HomePage({ go }) {
  return (
    <div className="page-enter">
      <div className="relative overflow-hidden scanline" style={{ borderBottom: `1px solid ${C.bloodSoft}`, background: "linear-gradient(180deg,rgba(20,12,17,.98),rgba(10,10,15,1))" }}>
        <div className="absolute inset-0 hero-grid opacity-60" />
        <div className="absolute hero-orb -left-24 top-20 w-72 h-72 rounded-full" style={{ background: `radial-gradient(circle,${C.blood}55,transparent 68%)` }} />
        <div className="absolute hero-orb hero-orb-two -right-20 top-0 w-80 h-80 rounded-full" style={{ background: `radial-gradient(circle,${C.violet}35,transparent 68%)` }} />

        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(228,20,43,0.35), transparent 70%)` }} />
        <div className="absolute -right-24 -top-24 w-96 h-96 rotate-12" style={{ background: `linear-gradient(135deg, ${C.blood}, transparent)`, opacity: 0.18 }} />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs f-mono tracking-widest mb-5 premium-glass" style={{ border: `1px solid ${C.bloodSoft}`, color: C.coral }}>
            <span className="status-dot" /><Flame size={13} /> LIVE MARKET · TOP FREE FIRE ACCOUNT STORE
          </div>
          <h1 className="f-display text-4xl sm:text-6xl font-black shimmer-text leading-tight mb-4" style={{ textShadow: "0 0 45px rgba(228,20,43,.18)" }}>
            OWN THE RANK.<br />SKIP THE GRIND.
          </h1>
          <p className="max-w-lg mx-auto mb-8 text-lg" style={{ color: "#c4c0c9" }}>
            Verified Free Fire accounts, bought and sold in bulk. Pick a tier, pay on WhatsApp, get your login in minutes.
          </p>
          <button onClick={() => go("shop")} className="buy-pulse inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base"
            style={{ background: `linear-gradient(135deg,${C.blood},${C.ember})`, color: "#fff" }}>
            Browse accounts <ArrowRight size={18} />
          </button>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs f-mono mt-8" style={{ color: C.ash }}>
            <span className="flex items-center gap-1"><Check size={14} color={C.green} /> 5K+ subscribers</span>
            <span className="flex items-center gap-1"><Check size={14} color={C.green} /> Verified seller</span>
            <span className="flex items-center gap-1"><Check size={14} color={C.green} /> Instant handover</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="f-display text-xl mb-1" style={{ color: C.ghost }}>Choose your tier</h2>
        <p className="mb-6 text-sm" style={{ color: C.ash }}>Every account is graded so you know exactly what you're getting.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {CATEGORIES.map((c) => {
            return (
              <button key={c.id} onClick={() => go("shop", c.id)} className="text-left relative rounded-2xl p-5 overflow-hidden premium-card shine-sweep"
                style={{ border: `1px solid ${C.line}`, background: C.panel }}>
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-xl" style={{ background: c.grad, opacity: 0.25 }} />
                <RankBadge categoryId={c.id} size={46} />
                <div className="f-display text-base mt-4 mb-1" style={{ color: C.ghost }}>{c.label}</div>
                <div className="text-sm mb-4" style={{ color: C.ash }}>{c.tagline}</div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.coral }}>
                  Shop this tier <ChevronRight size={14} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 grid sm:grid-cols-3 gap-4">
        {[
          { t: "Verified stock", d: "Every account is checked by us before it's listed \u2014 no fakes, no bans waiting to happen." },
          { t: "Fast handover", d: "Pay on WhatsApp, get login details straight away. No waiting around." },
          { t: "Buy or sell", d: "We buy accounts too \u2014 bulk deals welcome. Message us your offer." },
        ].map((f) => (
          <div key={f.t} className="rounded-xl p-5 premium-card" style={{ border: `1px solid ${C.line}` }}>
            <div className="f-display text-sm mb-1.5" style={{ color: C.blood }}>{f.t}</div>
            <div className="text-sm" style={{ color: C.ash }}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================================================================
   PAGE: SHOP (catalog)
================================================================== */

function ShopPage({ products, initialCat, go }) {
  const [activeCat, setActiveCat] = useState(initialCat || "all");
  useEffect(() => { setActiveCat(initialCat || "all"); }, [initialCat]);
  const shown = activeCat === "all" ? products : products.filter((p) => p.category === activeCat);

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 py-8">
      <h1 className="f-display text-2xl mb-1" style={{ color: C.ghost }}>Shop accounts</h1>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <p className="text-sm" style={{ color: C.ash }}>{products.length} account{products.length === 1 ? "" : "s"} in stock right now.</p>
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] f-mono" style={{ background: "rgba(63,224,122,.08)", border: "1px solid rgba(63,224,122,.2)", color: C.green }}>
          <span className="status-dot" /> STOCK UPDATED LIVE
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
        <button onClick={() => setActiveCat("all")} className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold"
          style={activeCat === "all" ? { background: C.blood, color: "#fff", border: `1px solid ${C.blood}` } : { background: "rgba(255,255,255,0.05)", color: "#c4c0c9", border: `1px solid ${C.line}` }}>
          All accounts
        </button>
        {CATEGORIES.map((c) => {
          const Icon = c.icon; const active = activeCat === c.id;
          return (
            <button key={c.id} onClick={() => setActiveCat(c.id)} className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={active ? { background: c.grad, color: C.void, border: "1px solid transparent" } : { background: "rgba(255,255,255,0.05)", color: "#c4c0c9", border: `1px solid ${C.line}` }}>
              <Icon size={15} /> {c.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-24 rounded-2xl" style={{ color: C.ashDim, border: `1px dashed ${C.line}` }}>
          <ImageOff className="mx-auto mb-3" size={32} />
          No accounts listed{activeCat !== "all" ? " in this tier" : ""} yet \u2014 check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shown.map((p) => {
            const cat = catInfo(p.category); const sold = p.status === "sold";
            return (
              <button key={p.id} onClick={() => go("product", p.category, p.id)} className="text-left group relative rounded-2xl overflow-hidden premium-card shine-sweep"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <div className="relative aspect-[4/3] overflow-hidden" style={{ background: "#1a1720" }}>
                  {p.image ? (
                    <img src={p.image} alt={p.title} className="product-image w-full h-full object-cover" style={sold ? { filter: "grayscale(1)", opacity: 0.4 } : {}} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: "#4a4552" }}><ImageOff size={28} /></div>
                  )}
                  <div className="absolute top-3 left-3"><RankBadge categoryId={p.category} size={40} /></div>
                  {sold && <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}><span className="f-display text-sm tracking-widest px-3 py-1 rounded" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)" }}>SOLD OUT</span></div>}
                </div>
                <div className="p-4">
                  <div className="text-[10px] f-mono tracking-widest mb-1" style={{ color: C.ash }}>{cat.label}</div>
                  <h3 className="font-semibold leading-snug mb-1.5" style={{ color: C.ghost }}>{p.title}</h3>
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: C.ash }}>{p.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="f-mono text-xl font-bold" style={{ color: C.coral }}>{nairaFmt(p.price)}</span>
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#c4c0c9" }}>Details <ChevronRight size={14} /></span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ==================================================================
   PAGE: PRODUCT DETAIL
================================================================== */

function ProductPage({ product, go }) {
  if (!product) {
    return (
      <div className="page-enter max-w-2xl mx-auto px-4 py-24 text-center" style={{ color: C.ash }}>
        This listing isn't available anymore.
        <div className="mt-4"><button onClick={() => go("shop")} className="font-semibold" style={{ color: C.coral }}>Back to shop</button></div>
      </div>
    );
  }
  const cat = catInfo(product.category); const sold = product.status === "sold";
  return (
    <div className="page-enter max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => go("shop", product.category)} className="flex items-center gap-1 text-sm mb-5" style={{ color: C.ash }}>
        <ChevronLeft size={16} /> Back to shop
      </button>
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="relative aspect-square rounded-2xl overflow-hidden premium-card scanline" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          {product.image ? (
            <img src={product.image} alt={product.title} className="w-full h-full object-cover" style={sold ? { filter: "grayscale(1)", opacity: 0.4 } : {}} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: "#4a4552" }}><ImageOff size={40} /></div>
          )}
          <div className="absolute top-4 left-4"><RankBadge categoryId={product.category} size={52} /></div>
        </div>
        <div>
          <div className="text-xs f-mono tracking-widest mb-2" style={{ color: C.ash }}>{cat.label} \u00b7 {cat.tagline}</div>
          <h1 className="f-display text-2xl mb-4" style={{ color: C.ghost }}>{product.title}</h1>
          <p className="mb-6 leading-relaxed" style={{ color: "#c4c0c9" }}>{product.desc || "No extra details provided for this listing."}</p>
          <div className="f-mono text-3xl font-bold mb-6" style={{ color: C.coral }}>{nairaFmt(product.price)}</div>
          <a
            href={sold ? undefined : `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Lil M Shop! I want to buy: "${product.title}" (${cat.label}) \u2014 ${nairaFmt(product.price)}`)}`}
            target="_blank" rel="noopener noreferrer"
            className={sold ? "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base pointer-events-none" : "buy-pulse w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base"}
            style={sold ? { background: "rgba(255,255,255,0.05)", color: C.ashDim } : { background: `linear-gradient(135deg,${C.blood},${C.ember})`, color: "#fff" }}
          >
            {sold ? <><Ban size={18} /> Unavailable</> : <><MessageCircle size={18} /> Buy now on WhatsApp</>}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   ADMIN
================================================================== */

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState(""); const [err, setErr] = useState(false);
  const ADMIN_PIN = "1957";
  const submit = () => { if (pin === ADMIN_PIN) onUnlock(); else { setErr(true); setTimeout(() => setErr(false), 600); } };
  return (
    <div className="page-enter flex items-center justify-center p-6" style={{ minHeight: "70vh" }}>
      <div className="relative w-full max-w-sm rounded-2xl p-7 premium-glass" style={{ border: `1px solid rgba(0,229,199,0.3)`, background: C.panel2 }}>
        <div className="flex items-center gap-2 mb-1" style={{ color: C.cyan }}><LayoutDashboard size={20} /><span className="f-display text-sm tracking-widest">CONTROL ROOM</span></div>
        <p className="text-sm mb-5" style={{ color: C.ash }}>Enter the admin PIN to manage Lil M Shop listings.</p>
        <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="\u2022\u2022\u2022\u2022"
          className="w-full f-mono text-center text-2xl tracking-[0.5em] rounded-xl py-3 mb-4 outline-none"
          style={{ background: "rgba(0,0,0,0.4)", border: err ? `1px solid ${C.blood}` : `1px solid rgba(0,229,199,0.3)`, color: err ? C.blood : C.ghost }} />
        <button onClick={submit} className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg,${C.cyan},${C.blue})`, color: C.void }}>
          <Lock size={16} /> Unlock
        </button>
        {err && <p className="text-xs text-center mt-3" style={{ color: C.blood }}>Wrong PIN \u2014 try again.</p>}
        <p className="text-[10px] mt-5 text-center f-mono" style={{ color: C.ashDim }}>demo PIN: 1957 \u00b7 change ADMIN_PIN in code for real use</p>
      </div>
    </div>
  );
}

function AdminNavItem({ active, onClick, Icon, children }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
      style={active ? { background: "rgba(178,75,255,0.2)", color: C.violet, border: `1px solid rgba(178,75,255,0.4)` } : { color: C.ash, border: "1px solid transparent" }}>
      <Icon size={15} /> {children}
    </button>
  );
}

function AdminOverview({ products, go }) {
  const totalValue = products.filter((p) => p.status === "available").reduce((s, p) => s + p.price, 0);
  const soldCount = products.filter((p) => p.status === "sold").length;
  const stat = (Icon, color, value, label) => (
    <div className="rounded-xl p-4" style={{ border: `1px solid ${color}40`, background: `${color}18` }}>
      <Icon color={color} className="mb-2" size={18} />
      <div className="f-mono text-2xl font-bold" style={{ color: C.ghost }}>{value}</div>
      <div className="text-[11px]" style={{ color: C.ash }}>{label}</div>
    </div>
  );
  return (
    <div className="page-enter">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {stat(Package, C.cyan, products.length, "Total listings")}
        {stat(TrendingUp, C.green, nairaFmt(totalValue), "Available stock value")}
        {stat(Ban, C.blood, soldCount, "Sold out")}
        {stat(Crown, C.violet, products.filter((p) => p.category === "prime7-8").length, "Prime 7\u20138 listings")}
      </div>
      {products.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ border: `1px dashed ${C.line}`, color: C.ash }}>
          No listings yet. <button onClick={() => go("form")} className="font-semibold underline" style={{ color: C.violet }}>Add your first product</button>.
        </div>
      ) : (
        <div className="space-y-2">
          {products.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg text-sm premium-card" style={{ border: `1px solid ${C.line}` }}>
              <span className="font-medium truncate" style={{ color: C.ghost }}>{p.title}</span>
              <span className="f-mono" style={{ color: C.coral }}>{nairaFmt(p.price)}</span>
            </div>
          ))}
          {products.length > 5 && (
            <button onClick={() => go("listings")} className="text-xs font-semibold" style={{ color: C.violet }}>View all {products.length} listings \u2192</button>
          )}
        </div>
      )}
    </div>
  );
}

function AdminListings({ products, onEdit, onDelete, go }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? products : products.filter((p) => p.category === filter);
  return (
    <div className="page-enter">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button onClick={() => go("form")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm" style={{ background: `linear-gradient(135deg,${C.violet},${C.cyan})`, color: C.void }}>
          <Plus size={16} /> Add product
        </button>
        <div className="flex gap-1.5 overflow-x-auto">
          <button onClick={() => setFilter("all")} className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold" style={filter === "all" ? { background: "rgba(255,255,255,0.1)", border: `1px solid ${C.lineStrong}`, color: "#fff" } : { border: `1px solid ${C.line}`, color: C.ash }}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setFilter(c.id)} className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold" style={filter === c.id ? { background: "rgba(255,255,255,0.1)", border: `1px solid ${C.lineStrong}`, color: "#fff" } : { border: `1px solid ${C.line}`, color: C.ash }}>{c.label}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {list.length === 0 && <div className="text-center py-16 rounded-xl" style={{ color: C.ashDim, border: `1px dashed ${C.line}` }}>No listings here yet.</div>}
        {list.map((p) => {
          const cat = catInfo(p.category); const Icon = cat.icon;
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl premium-card" style={{ border: `1px solid ${C.line}` }}>
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <ImageOff size={18} color="#4a4552" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] f-mono mb-0.5" style={{ color: C.ash }}>
                  <Icon size={11} /> {cat.label}
                  {p.status === "sold" && <span className="ml-1 px-1.5 py-0.5 rounded" style={{ background: "rgba(228,20,43,0.2)", color: "#ff6b7d" }}>SOLD</span>}
                </div>
                <div className="font-semibold truncate" style={{ color: C.ghost }}>{p.title}</div>
                <div className="f-mono text-sm" style={{ color: C.coral }}>{nairaFmt(p.price)}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onEdit(p)} className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: C.cyan }}><Pencil size={15} /></button>
                <button onClick={() => setConfirmDelete(p)} className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#ff6b7d" }}><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: C.panel2, border: `1px solid rgba(228,20,43,0.4)` }}>
            <Trash2 className="mx-auto mb-3" color={C.blood} size={28} />
            <p className="mb-1 font-semibold" style={{ color: C.ghost }}>Delete this listing?</p>
            <p className="text-sm mb-5" style={{ color: C.ash }}>"{confirmDelete.title}" will be removed permanently.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl font-semibold" style={{ border: `1px solid rgba(255,255,255,0.15)`, color: "#c4c0c9" }}>Cancel</button>
              <button onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-xl font-bold" style={{ background: C.blood, color: "#fff" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminForm({ editingProduct, onSave, onDone }) {
  const blank = { title: "", category: "prime1-4", price: "", desc: "", image: "", status: "available" };
  const [form, setForm] = useState(editingProduct || blank);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { setForm(editingProduct || blank); }, [editingProduct]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const dataUrl = await resizeImageFile(file); setForm((f) => ({ ...f, image: dataUrl })); }
    catch { /* ignore bad image */ }
    finally { setUploading(false); }
  };

  const valid = form.title.trim() && form.price !== "" && Number(form.price) >= 0;

  return (
    <div className="page-enter max-w-lg">
      <div className="mb-5">
        <span className="f-display text-sm tracking-widest" style={{ color: C.violet }}>{editingProduct ? "EDIT LISTING" : "NEW LISTING"}</span>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs f-mono block mb-2" style={{ color: C.ash }}>PRODUCT IMAGE</label>
          <div onClick={() => fileRef.current?.click()} className="relative aspect-video rounded-xl flex items-center justify-center cursor-pointer overflow-hidden"
            style={{ border: `2px dashed rgba(178,75,255,0.4)`, background: "rgba(0,0,0,0.3)" }}>
            {uploading ? <Loader2 className="animate-spin" color={C.violet} size={24} /> : form.image ? <img src={form.image} alt="preview" className="w-full h-full object-cover" /> : (
              <div className="text-center" style={{ color: C.ash }}><Upload size={22} className="mx-auto mb-1" /><span className="text-xs">Tap to upload photo</span></div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        <div>
          <label className="text-xs f-mono block mb-1" style={{ color: C.ash }}>TITLE</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Grandmaster Vault Account"
            className="w-full rounded-lg px-3 py-2.5 outline-none" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid rgba(255,255,255,0.15)` }} />
        </div>
        <div>
          <label className="text-xs f-mono block mb-2" style={{ color: C.ash }}>CATEGORY</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => { const Icon = c.icon; const active = form.category === c.id; return (
              <button key={c.id} type="button" onClick={() => setForm((f) => ({ ...f, category: c.id }))}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-[11px] font-semibold"
                style={active ? { background: c.grad, color: C.void, border: "1px solid transparent" } : { background: "rgba(0,0,0,0.3)", border: `1px solid rgba(255,255,255,0.15)`, color: "#c4c0c9" }}>
                <Icon size={16} /> {c.label}
              </button>
            ); })}
          </div>
        </div>
        <div>
          <label className="text-xs f-mono block mb-1" style={{ color: C.ash }}>PRICE (\u20a6)</label>
          <input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="15000"
            className="w-full f-mono rounded-lg px-3 py-2.5 outline-none" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid rgba(255,255,255,0.15)` }} />
        </div>
        <div>
          <label className="text-xs f-mono block mb-1" style={{ color: C.ash }}>DESCRIPTION</label>
          <textarea value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} placeholder="Level, skins, linked email, extras..." rows={3}
            className="w-full rounded-lg px-3 py-2.5 outline-none resize-none" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid rgba(255,255,255,0.15)` }} />
        </div>
        <div>
          <label className="text-xs f-mono block mb-2" style={{ color: C.ash }}>STATUS</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: "available", label: "Available", icon: Eye, on: C.green }, { id: "sold", label: "Sold out", icon: EyeOff, on: C.blood }].map((s) => { const Icon = s.icon; const active = form.status === s.id; return (
              <button key={s.id} type="button" onClick={() => setForm((f) => ({ ...f, status: s.id }))}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
                style={active ? { background: s.on, color: s.id === "available" ? C.void : "#fff", border: "1px solid transparent" } : { background: "rgba(0,0,0,0.3)", border: `1px solid rgba(255,255,255,0.15)`, color: "#c4c0c9" }}>
                <Icon size={15} /> {s.label}
              </button>
            ); })}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onDone} className="flex-1 py-3 rounded-xl font-semibold" style={{ border: `1px solid rgba(255,255,255,0.15)`, color: "#c4c0c9" }}>Cancel</button>
          <button disabled={!valid} onClick={() => onSave({ ...form, price: Number(form.price) })}
            className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg,${C.violet},${C.cyan})`, color: C.void }}>
            <Check size={16} /> Save listing
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminSection({ products, onAdd, onUpdate, onDelete, goStore }) {
  const [tab, setTab] = useState("overview");
  const [editingProduct, setEditingProduct] = useState(null);
  const openForm = (product) => { setEditingProduct(product || null); setTab("form"); };

  return (
    <div className="page-enter relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(178,75,255,0.2), transparent 70%)` }} />
      <div className="relative flex items-center justify-between mb-6 -mx-4 px-4 py-3" style={{ borderBottom: `1px solid rgba(178,75,255,0.25)` }}>
        <div className="flex items-center gap-2"><LayoutDashboard color={C.violet} size={20} /><span className="f-display text-sm tracking-widest" style={{ color: C.ghost }}>CONTROL ROOM</span></div>
        <button onClick={goStore} className="flex items-center gap-2 text-xs f-mono px-3 py-1.5 rounded-lg" style={{ border: `1px solid rgba(255,255,255,0.15)`, color: "#c4c0c9" }}>
          <Store size={14} /> View storefront
        </button>
      </div>
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <AdminNavItem active={tab === "overview"} onClick={() => setTab("overview")} Icon={LayoutDashboard}>Overview</AdminNavItem>
          <AdminNavItem active={tab === "listings"} onClick={() => setTab("listings")} Icon={Package}>Listings</AdminNavItem>
          <AdminNavItem active={tab === "form"} onClick={() => openForm(null)} Icon={Plus}>Add product</AdminNavItem>
        </div>
        {tab === "overview" && <AdminOverview products={products} go={setTab} />}
        {tab === "listings" && <AdminListings products={products} onEdit={openForm} onDelete={onDelete} go={setTab} />}
        {tab === "form" && (
          <AdminForm
            editingProduct={editingProduct}
            onDone={() => setTab("listings")}
            onSave={(data) => {
              if (editingProduct) onUpdate(editingProduct.id, data); else onAdd(data);
              setEditingProduct(null); setTab("listings");
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ==================================================================
   ROOT
================================================================== */

export default function BeastShopApp() {
  const [page, setPage] = useState("home");
  const [shopCat, setShopCat] = useState("all");
  const [productId, setProductId] = useState(null);
  const [products, setProducts] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, true);
        setProducts(res?.value ? JSON.parse(res.value) : []);
      } catch { setProducts([]); }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setProducts(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next), true); } catch { /* keep working in-memory */ }
  }, []);

  const addProduct = (data) => persist([{ ...data, id: "p-" + Date.now(), createdAt: Date.now() }, ...products]);
  const updateProduct = (id, data) => persist(products.map((p) => (p.id === id ? { ...p, ...data } : p)));
  const deleteProduct = (id) => persist(products.filter((p) => p.id !== id));

  const go = (target, catOrId, maybeId) => {
    if (target === "shop") { setShopCat(catOrId || "all"); setPage("shop"); }
    else if (target === "product") { setShopCat(catOrId); setProductId(maybeId); setPage("product"); }
    else setPage(target);
    window.scrollTo?.(0, 0);
  };

  if (!products) {
    return (
      <div className="beast-scope flex items-center justify-center" style={{ minHeight: "100vh", background: C.void }}>
        <GlobalStyle /><Loader2 className="animate-spin" color={C.blood} size={28} />
      </div>
    );
  }

  const isAdminArea = page === "gate" || page === "admin";
  const currentProduct = page === "product" ? products.find((p) => p.id === productId) : null;

  return (
    <div className="beast-scope f-body" style={{ minHeight: "100vh", background: C.void, color: C.ghost }}>
      <GlobalStyle />
      {!isAdminArea && <SiteNav page={page} go={go} />}
      {isAdminArea && (
        <div className="sticky top-0 z-30 px-4 py-3" style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(8px)", borderBottom: `1px solid rgba(178,75,255,0.25)` }}>
          <button onClick={() => go("home")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `linear-gradient(135deg,${C.blood},${C.deep})` }}><Flame size={18} color="#fff" /></div>
            <span className="f-display text-lg tracking-wide" style={{ color: C.ghost }}>BEAST<span style={{ color: C.blood }}>SHOP</span></span>
          </button>
        </div>
      )}

      <div className={isAdminArea ? "max-w-5xl mx-auto px-4 py-6" : ""}>
        {page === "home" && <HomePage go={go} />}
        {page === "shop" && <ShopPage products={products} initialCat={shopCat} go={go} />}
        {page === "product" && <ProductPage product={currentProduct} go={go} />}
        {page === "gate" && <PinGate onUnlock={() => setPage("admin")} />}
        {page === "admin" && (
          <AdminSection products={products} onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct} goStore={() => go("home")} />
        )}
      </div>

      {!isAdminArea && <SiteFooter />}
    </div>
  );
}
