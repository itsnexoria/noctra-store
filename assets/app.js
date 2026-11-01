import { SB, KEY, CONTACT_EMAIL, BUSINESS_NAME, BUSINESS_ADDRESS } from "/assets/config.js";
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
export const setCart = c => { localStorage[CK] = JSON.stringify(c); badge(); };
export function addToCart(it) { const c = getCart(), f = c.find(x => x.id === it.id); f ? f.qty = Math.min(10, f.qty + it.qty) : c.push(it); setCart(c); }
function badge() { const n = getCart().reduce((a, b) => a + b.qty, 0); document.querySelectorAll(".cc").forEach(e => { e.textContent = n; e.hidden = !n; }); }

export const wordmark = '<span class="wm">N<span class="o">o' + STAR + '</span>ctra</span>';
export function chrome() {
  $("#hdr").innerHTML = `<header class="top"><a href="/" aria-label="Noctra home">${wordmark}</a>
  <nav><a href="/shop/">Shop</a><a href="/blog/">Journal</a><a href="/about/">About</a><a href="/cart/" class="bag">Bag <b class="cc" hidden>0</b></a></nav></header>`;
  $("#ftr").innerHTML = `<footer class="foot"><div>${wordmark}<p>Christian apparel, made to order and shipped worldwide.</p></div>
  <div><b>Explore</b><a href="/shop/">Shop</a><a href="/blog/">Journal</a><a href="/about/">About</a><a href="/contact/">Contact</a></div>
  <div><b>Policies</b><a href="/shipping/">Shipping</a><a href="/refunds/">Refunds &amp; returns</a><a href="/terms/">Terms of service</a><a href="/privacy/">Privacy policy</a></div>
  <div><b>Stay in the loop</b>${waitlistForm("footer")}</div>
  <p class="fine">&copy; ${new Date().getFullYear()} ${esc(BUSINESS_NAME)}. All rights reserved.</p></footer>`;
  document.querySelectorAll("[data-email]").forEach(e => e.innerHTML = CONTACT_EMAIL ? `<a class="link" href="mailto:${esc(CONTACT_EMAIL)}">${esc(CONTACT_EMAIL)}</a>` : "our support email");
  document.querySelectorAll("[data-biz]").forEach(e => e.textContent = BUSINESS_NAME + (BUSINESS_ADDRESS ? ", " + BUSINESS_ADDRESS : ""));
  badge(); cursor();
}
export const card = p => {
  const im = [...(p.product_images || [])].sort((a, b) => a.sort - b.sort)[0];
  const pr = (p.product_variants || []).filter(v => v.active).map(v => v.price_minor);
  const from = pr.length ? Math.min(...pr) : 0;
  return `<a class="card" href="/product/?s=${encodeURIComponent(p.slug)}"><div class="ph">${im ? `<img src="${esc(im.url)}" alt="${esc(p.name)}" loading="lazy">` : ""}</div>
  <h3>${esc(p.name)}</h3><p class="pr">${pr.length > 1 ? "From " : ""}${money(from, p.currency)}</p></a>`;
};
export const LIST = "products?select=slug,name,tags,currency,product_images(url,sort),product_variants(price_minor,active)&order=created_at.desc";
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
