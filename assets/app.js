import { SB, KEY, CONTACT_EMAIL, BUSINESS_NAME, BUSINESS_ADDRESS, SITE } from "/assets/config.js";
export { SITE };
export const $ = (s, r = document) => r.querySelector(s);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const money = (m, c = "ZAR") => new Intl.NumberFormat("en-ZA", { style: "currency", currency: c }).format(m / 100);
const STAR = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0C54 34 66 46 100 50 66 54 54 66 50 100 46 66 34 54 0 50 34 46 46 34 50 0z"/></svg>';
export const star = STAR;
export const cross = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M43 4h14v32h30v14H57v46H43V50H13V36h30z"/></svg>';

export async function rest(q, tok) {
  const r = await fetch(`${SB}/rest/v1/${q}`, { headers: { apikey: KEY, ...(tok ? { Authorization: "Bearer " + tok } : {}) } });
  if (!r.ok) throw new Error("load");
  return r.json();
}
export async function fn(name, body, tok) {
  const r = await fetch(`${SB}/functions/v1/${name}`, { method: "POST", headers: { "content-type": "application/json", apikey: KEY, ...(tok ? { Authorization: "Bearer " + tok } : {}) }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || "error"), { code: d.error });
  return d;
}
export const api = (action, body) => fn("store-api", { action, ...body });

const CK = "noctra_cart";
export const getCart = () => { try { return JSON.parse(localStorage[CK] || "[]"); } catch { return []; } };
export const setCart = c => { try { localStorage[CK] = JSON.stringify(c); } catch {} badge(); if (document.body.classList.contains("bag-open")) renderBag(); };
export function addToCart(it) { const c = getCart(), f = c.find(x => x.id === it.id); f ? f.qty = Math.min(10, f.qty + it.qty) : c.push(it); setCart(c); if (!/^\/(cart|checkout)\//.test(location.pathname)) openBag(); }
function badge() { const n = getCart().reduce((a, b) => a + b.qty, 0); document.querySelectorAll(".cc").forEach(e => { e.textContent = n; e.hidden = !n; }); }

// ---------- display currency (we always charge in ZAR) ----------
const CURS = ["ZAR", "USD", "GBP"], LOC = { ZAR: "en-ZA", USD: "en-US", GBP: "en-GB" };
const FALLBACK_FX = { ZAR: 1, USD: 0.055, GBP: 0.043 };
let FX = (() => { try { const f = JSON.parse(localStorage.noctra_fx || "null"); return f?.r ? { ...FALLBACK_FX, ...f.r } : { ...FALLBACK_FX }; } catch { return { ...FALLBACK_FX }; } })();
export const getCur = () => {
  const c = localStorage.noctra_cur; if (CURS.includes(c)) return c;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  return tz.startsWith("Africa/") ? "ZAR" : /^Europe\/(London|Dublin)$/.test(tz) ? "GBP" : "USD";
};
const fmtCur = (minor, cur) => new Intl.NumberFormat(LOC[cur] || "en-US", { style: "currency", currency: cur }).format(minor / 100);
export const px = (m, c = "ZAR") => `<span class="px" data-m="${m}" data-c="${c}">${pxText(m, c)}</span>`;
export function pxText(m, c = "ZAR") {
  const d = getCur();
  if (c !== "ZAR" || d === "ZAR" || !FX[d]) return money(m, c);
  return "\u2248 " + fmtCur(Math.round(m * FX[d]), d);
}
export function refreshPx(root = document) {
  root.querySelectorAll(".px").forEach(e => { e.textContent = pxText(+e.dataset.m, e.dataset.c); });
  document.querySelectorAll(".charge-note").forEach(e => { e.hidden = getCur() === "ZAR"; });
}
async function loadFx() {
  try {
    const f = JSON.parse(localStorage.noctra_fx || "null");
    if (f && Date.now() - f.t < 12 * 36e5) return;
    const r = await fetch("https://open.er-api.com/v6/latest/ZAR"); if (!r.ok) return;
    const d = await r.json(), rt = d?.rates; if (!rt?.USD || !rt?.GBP) return;
    FX = { ZAR: 1, USD: rt.USD, GBP: rt.GBP };
    localStorage.noctra_fx = JSON.stringify({ t: Date.now(), r: { USD: rt.USD, GBP: rt.GBP } });
    refreshPx();
  } catch {}
}
export const chargeNote = '<p class="note charge-note" hidden>Prices in other currencies are estimates. You are always charged in South African rand (ZAR); your bank applies its own exchange rate.</p>';

// ---------- countries ----------
export const COUNTRIES = { ZA: "South Africa", US: "United States", CA: "Canada", GB: "United Kingdom", IE: "Ireland", AU: "Australia", NZ: "New Zealand", DE: "Germany", FR: "France", NL: "Netherlands" };
export const countryName = c => COUNTRIES[c] || (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(c); } catch { return c; } })();
export const guessCountry = () => localStorage.noctra_cc || ({ "Africa/Johannesburg": "ZA", "Europe/London": "GB", "Europe/Dublin": "IE", "Australia/Sydney": "AU", "Pacific/Auckland": "NZ" }[Intl.DateTimeFormat().resolvedOptions().timeZone] || "");
export async function shippingCountries() {
  const [s] = await rest("site_settings?key=eq.shipping&select=value");
  return Object.keys(s.value.countries);
}

// ---------- recently viewed ----------
export const rvGet = () => { try { return JSON.parse(localStorage.noctra_rv || "[]"); } catch { return []; } };
export const rvPush = slug => { try { localStorage.noctra_rv = JSON.stringify([slug, ...rvGet().filter(x => x !== slug)].slice(0, 10)); } catch {} };

// ---------- skeletons ----------
export const skel = (n = 4) => Array.from({ length: n }, () => '<div class="card sk" aria-hidden="true"><div class="ph"></div><h3>&nbsp;</h3><p class="pr">&nbsp;</p></div>').join("");

// ---------- SEO helpers ----------
export function seo({ title, description, image, url, ld }) {
  if (title) document.title = title;
  const meta = (attr, key, val) => { if (!val) return; let e = document.head.querySelector(`meta[${attr}="${key}"]`); if (!e) { e = document.createElement("meta"); e.setAttribute(attr, key); document.head.append(e); } e.setAttribute("content", val); };
  meta("name", "description", description); meta("property", "og:title", title); meta("property", "og:description", description);
  meta("property", "og:image", image); meta("property", "og:url", url); meta("property", "og:type", "website"); meta("name", "twitter:card", image ? "summary_large_image" : "summary");
  if (url && !document.head.querySelector('link[rel="canonical"]')) { const l = document.createElement("link"); l.rel = "canonical"; l.href = url; document.head.append(l); }
  if (ld && !document.head.querySelector("script[data-ld]")) { const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.dataset.ld = "1"; sc.textContent = JSON.stringify(ld); document.head.append(sc); }
}
export const cleanDesc = t => String(t || "").replace(/^\s*XS\s+S\s+M[\s\S]*?Size tolerance, in(?:\s+[\d.]+)+\s*/i, "").replace(/\s+/g, " ").trim();
export function fmtDesc(t) {
  const c = cleanDesc(t); if (!c) return "";
  const parts = c.split(/\s*(Product features|Care instructions)\s*-\s*/i);
  let html = `<p>${esc(parts[0])}</p>`;
  for (let i = 1; i < parts.length; i += 2) {
    const items = parts[i + 1].split(/\s+-\s+/).map(x => x.trim()).filter(Boolean);
    html += `<h4>${esc(parts[i])}</h4><ul>${items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  }
  return html;
}

export const wordmark = '<img class="wm-img" src="/assets/logo-gold.png" alt="Noctra" width="700" height="196">';
export function chrome() {
  $("#hdr").innerHTML = `<a class="skip" href="#main">Skip to content</a><header class="top"><a href="/" aria-label="Noctra home">${wordmark}</a>
  <nav><a href="/shop/">Shop</a><a href="/blog/" class="nx">Journal</a><a href="/about/" class="nx">About</a><a href="/account/" class="acct">Account</a>
  <select class="cursel" id="cursel" aria-label="Display currency">${CURS.map(c => `<option${c === getCur() ? " selected" : ""}>${c}</option>`).join("")}</select>
  <a href="/cart/" class="bag" aria-label="Open bag">Bag <b class="cc" hidden>0</b></a></nav></header>`;
  $("#ftr").innerHTML = `<footer class="foot"><div>${wordmark}<p>Christian apparel, made to order and shipped worldwide.</p></div>
  <div><b>Explore</b><a href="/shop/">Shop</a><a href="/blog/">Journal</a><a href="/about/">About</a><a href="/contact/">Contact</a></div>
  <div><b>Help</b><a href="/track/">Track your order</a><a href="/account/">My account</a><a href="/shipping/">Shipping</a><a href="/refunds/">Refunds &amp; returns</a><a href="/terms/">Terms of service</a><a href="/privacy/">Privacy policy</a></div>
  <div><b>Stay in the loop</b>${waitlistForm("footer")}</div>
  <p class="fine">&copy; ${new Date().getFullYear()} ${esc(BUSINESS_NAME)}. All rights reserved.</p></footer>
  <div class="bag-ov" id="bagov" hidden></div><aside class="bagd" id="bagd" aria-hidden="true" aria-label="Your bag" tabindex="-1"></aside>`;
  document.querySelectorAll("[data-email]").forEach(e => e.innerHTML = CONTACT_EMAIL ? `<a class="link" href="mailto:${esc(CONTACT_EMAIL)}">${esc(CONTACT_EMAIL)}</a>` : "our support email");
  document.querySelectorAll("[data-biz]").forEach(e => e.textContent = BUSINESS_NAME + (BUSINESS_ADDRESS ? ", " + BUSINESS_ADDRESS : ""));
  $("#cursel").onchange = e => { localStorage.noctra_cur = e.target.value; refreshPx(); if (document.body.classList.contains("bag-open")) renderBag(); };
  document.querySelector("a.bag").addEventListener("click", e => { if (e.metaKey || e.ctrlKey || e.shiftKey || /^\/(cart|checkout)\//.test(location.pathname)) return; e.preventDefault(); openBag(); });
  $("#bagov").onclick = closeBag;
  $("#bagd").onclick = bagClick;
  addEventListener("keydown", e => { if (e.key === "Escape") closeBag(); });
  badge(); cursor(); loadFx();
}

// ---------- slide-out bag ----------
let lastFocus = null;
export function renderBag() {
  const c = getCart(), d = $("#bagd"); if (!d) return;
  const sub = c.reduce((a, i) => a + i.price * i.qty, 0);
  d.innerHTML = `<div class="bd-h"><h3>Your bag</h3><button class="bd-x" aria-label="Close bag">&times;</button></div>
  ${c.length ? `<div class="bd-l">${c.map((i, n) => `<div class="bd-i"><img src="${esc(i.img)}" alt=""><div><a href="/product/?s=${encodeURIComponent(i.slug)}"><b>${esc(i.name)}</b></a><div class="note">${esc(i.title)}</div>
    <div class="qty"><button data-a="-" data-n="${n}" aria-label="Less">-</button>${i.qty}<button data-a="+" data-n="${n}" aria-label="More">+</button></div> <button class="link" data-a="x" data-n="${n}">Remove</button></div><div>${px(i.price * i.qty, i.cur)}</div></div>`).join("")}</div>
  <div class="bd-f"><div class="l t"><span>Subtotal</span><span>${px(sub, c[0].cur)}</span></div><p class="note">Shipping and discounts are worked out in your bag.</p>
  <a class="btn" href="/checkout/" style="display:block;text-align:center">Checkout</a><a class="btn ghost" href="/cart/" style="display:block;text-align:center;margin-top:10px">View bag &amp; shipping</a></div>`
  : `<div class="bd-e"><div class="bigstar">${STAR}</div><p>Your bag is empty.</p><a class="btn" href="/shop/">Shop the collection</a></div>`}`;
}
function bagClick(e) {
  if (e.target.closest(".bd-x")) return closeBag();
  const b = e.target.closest("[data-a]"); if (!b) return;
  const c = getCart(), i = c[+b.dataset.n]; if (!i) return;
  if (b.dataset.a === "+") i.qty = Math.min(10, i.qty + 1); else if (b.dataset.a === "-") i.qty--; else i.qty = 0;
  setCart(c.filter(x => x.qty > 0));
}
export function openBag() {
  renderBag(); lastFocus = document.activeElement;
  document.body.classList.add("bag-open"); $("#bagov").hidden = false; const d = $("#bagd"); d.setAttribute("aria-hidden", "false"); (d.querySelector(".bd-x") || d).focus();
}
export function closeBag() {
  if (!document.body.classList.contains("bag-open")) return;
  document.body.classList.remove("bag-open"); $("#bagov").hidden = true; $("#bagd").setAttribute("aria-hidden", "true"); lastFocus?.focus?.();
}

export const card = (p, i = 0) => {
  const im = [...(p.product_images || [])].sort((a, b) => a.sort - b.sort)[0];
  const pr = (p.product_variants || []).filter(v => v.active).map(v => v.price_minor);
  const from = pr.length ? Math.min(...pr) : 0;
  return `<a class="card" style="--i:${Math.min(i, 12)}" href="/product/?s=${encodeURIComponent(p.slug)}"><div class="ph">${im ? `<img src="${esc(im.url)}" alt="${esc(p.name)}" loading="lazy">` : ""}</div>
  <h3>${esc(p.name)}</h3><p class="pr">${pr.length > 1 ? "From " : ""}${px(from, p.currency)}</p></a>`;
};
export const LIST = "products?select=slug,name,tags,currency,created_at,collection:collections(slug,title),product_images(url,sort),product_variants(price_minor,active,options)&order=created_at.desc";
export function emptyShelf() {
  return `<div class="empty"><div class="bigstar">${STAR}</div><h3>The first drop is on its way.</h3><p>Leave your email and we'll tell you the moment it lands.</p>${waitlistForm("shelf")}</div>`;
}
export function waitlistForm(src) {
  return `<form class="wl" data-src="${src}"><input type="email" required placeholder="you@email.com" aria-label="Email"><button class="btn">Notify me</button><p class="msg" role="status"></p></form>`;
}
document.addEventListener("submit", async e => {
  const f = e.target.closest(".wl"); if (!f) return; e.preventDefault();
  const m = $(".msg", f), em = $("input", f).value.trim();
  try {
    const r = await fetch(`${SB}/rest/v1/waitlist`, { method: "POST", headers: { apikey: KEY, "content-type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ email: em, source: f.dataset.src }) });
    m.textContent = r.ok || r.status === 409 ? "You're on the list." : "Something went wrong. Please try again.";
  } catch { m.textContent = "Something went wrong. Please try again."; }
});

export function md(src) {
  const inl = t => esc(t).replace(/!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>");
  return String(src || "").split(/\n{2,}/).map(b => { b = b.trim(); if (!b) return ""; let m;
    if ((m = b.match(/^(#{1,3})\s+(.*)$/))) return `<h${m[1].length + 1}>${inl(m[2])}</h${m[1].length + 1}>`;
    if (/^>/.test(b)) { const ps = b.split("\n").map(l => l.replace(/^>\s?/, "")).join("\n").split(/\n\s*\n/).map(x => x.trim()).filter(Boolean); const cite = ps.length > 1 ? ps.pop() : ""; return `<blockquote>${ps.map(x => `<p>${inl(x)}</p>`).join("")}${cite ? `<cite>${inl(cite)}</cite>` : ""}</blockquote>`; }
    if (/^[-*]\s/.test(b)) return "<ul>" + b.split("\n").map(l => `<li>${inl(l.replace(/^[-*]\s+/, ""))}</li>`).join("") + "</ul>";
    return `<p>${inl(b).replace(/\n/g, "<br>")}</p>`; }).join("");
}

function cursor() {
  if (!matchMedia("(hover:hover) and (pointer:fine)").matches || matchMedia("(prefers-reduced-motion:reduce)").matches || document.querySelector(".cur-dot")) return;
  const d = document.createElement("div"), r = document.createElement("div"), h = document.documentElement;
  d.className = "cur-dot"; r.className = "cur-ring"; d.innerHTML = STAR; document.body.append(r, d); h.classList.add("cur");
  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener("mousemove", e => {
    x = e.clientX; y = e.clientY; d.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    r.classList.toggle("hot", !!e.target.closest("a,button,select,label,.card,.opt,.chip,tr.cl"));
    h.classList.toggle("txt", !!e.target.closest("input,textarea"));
  }, { passive: true });
  document.addEventListener("mouseleave", () => { d.style.opacity = 0; r.style.opacity = 0; });
  document.addEventListener("mouseenter", () => { d.style.opacity = ""; r.style.opacity = ""; });
  addEventListener("mousedown", () => r.classList.add("dn")); addEventListener("mouseup", () => r.classList.remove("dn"));
  (function loop() { rx += (x - rx) * .18; ry += (y - ry) * .18; r.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
}

// ---------- customer accounts (Supabase Auth, passwordless email link) ----------
const AK = "noctra_auth";
const readAuth = () => { try { return JSON.parse(localStorage[AK] || "null"); } catch { return null; } };
export const signOut = () => { try { localStorage.removeItem(AK); } catch {} };
export async function signInLink(email) {
  const r = await fetch(`${SB}/auth/v1/otp?redirect_to=${encodeURIComponent(SITE + "/account/")}`, { method: "POST", headers: { apikey: KEY, "content-type": "application/json" }, body: JSON.stringify({ email, create_user: true }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).msg || "signin_failed");
}
export function takeAuthHash() {
  if (!location.hash.includes("access_token") && !location.hash.includes("error_description")) return null;
  const h = new URLSearchParams(location.hash.slice(1)); history.replaceState(null, "", location.pathname);
  if (h.get("error_description")) return { error: h.get("error_description").replace(/\+/g, " ") };
  const at = h.get("access_token"); if (!at) return null;
  const s = { access_token: at, refresh_token: h.get("refresh_token"), expires_at: Math.floor(Date.now() / 1000) + (+h.get("expires_in") || 3600) };
  try { localStorage[AK] = JSON.stringify(s); } catch {}
  return s;
}
export async function session() {
  let s = readAuth(); if (!s?.access_token) return null;
  if (s.expires_at * 1000 < Date.now() + 60000) {
    if (!s.refresh_token) { signOut(); return null; }
    try {
      const r = await fetch(`${SB}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { apikey: KEY, "content-type": "application/json" }, body: JSON.stringify({ refresh_token: s.refresh_token }) });
      if (!r.ok) { signOut(); return null; }
      const d = await r.json(); s = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (d.expires_in || 3600), email: d.user?.email };
      localStorage[AK] = JSON.stringify(s);
    } catch { return null; }
  }
  return s;
}
export async function rpc(name, body, tok) {
  const r = await fetch(`${SB}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: KEY, "content-type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify(body || {}) });
  if (!r.ok) throw new Error("rpc"); return r.json();
}
export const acct = (action, body) => fn("account-api", { action, ...body });

// ---------- order progress ----------
export const STAGES = ["Order placed", "Payment received", "In production", "Shipped", "Delivered"];
export function stageIndex(d) {
  if (["cancelled", "refunded"].includes(d.status)) return -1;
  if (d.paymentStatus !== "paid") return 0;
  if (d.status === "delivered") return 4;
  if (d.status === "shipped") return 3;
  if (d.status === "fulfilling" || d.jobStatus === "in_production" || d.jobStatus === "submitted") return 2;
  return 1;
}
export function timeline(d) {
  const at = stageIndex(d);
  if (at < 0) return `<p class="ok">This order was ${esc(d.status)}.</p>`;
  return `<ol class="tl">${STAGES.map((n, i) => `<li class="${i < at ? "done" : i === at ? "now" : ""}"><span></span>${n}</li>`).join("")}</ol>`;
}
export function trackingHtml(list) {
  const t = (list || []).filter(x => x.tracking_number || x.tracking_url);
  if (!t.length) return "";
  return `<h3 style="margin-top:24px">Tracking</h3>${t.map(x => `<p>${esc(x.carrier || "Carrier")} ${/^https:\/\//.test(x.tracking_url || "") ? `<a class="link" href="${esc(x.tracking_url)}" target="_blank" rel="noopener">${esc(x.tracking_number || "Track parcel")}</a>` : esc(x.tracking_number || "")}</p>`).join("")}`;
}
export function orderView(d) {
  return `<h2>Order ${esc(d.publicRef)}</h2>${timeline(d)}
  <table>${d.items.map(i => `<tr><td>${esc(i.product_name)}<br><span class="note">${esc(i.variant_title)} x ${i.quantity}</span></td><td>${money(i.line_total_minor, d.currency)}</td></tr>`).join("")}
  <tr><td>Shipping</td><td>${money(d.shippingMinor, d.currency)}</td></tr>${d.discountMinor ? `<tr><td>Discount</td><td>-${money(d.discountMinor, d.currency)}</td></tr>` : ""}<tr><th>Total</th><th>${money(d.totalMinor, d.currency)}</th></tr></table>${trackingHtml(d.tracking)}`;
}
