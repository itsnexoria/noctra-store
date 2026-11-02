const SB = "https://omzcuetbhurjwnzdufme.supabase.co";
const KEY = "sb_publishable_4LOhoQl3HtgQwloh17MyIg_ZkIBHRhx";
const STATIC = ["/", "/shop/", "/blog/", "/about/", "/contact/", "/shipping/", "/refunds/", "/terms/", "/privacy/"];
const x = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
const get = async (q) => { const r = await fetch(`${SB}/rest/v1/${q}`, { headers: { apikey: KEY }, cf: { cacheTtl: 300 } }); return r.ok ? r.json() : []; };
export async function onRequestGet({ request }) {
  const origin = new URL(request.url).origin;
  const [products, posts, cols] = await Promise.all([
    get("products?select=slug,updated_at&status=eq.published&order=updated_at.desc&limit=1000"),
    get("posts?select=slug,updated_at&published=eq.true&order=published_at.desc&limit=1000"),
    get("collections?select=slug&published=eq.true&limit=100"),
  ]);
  const u = (path, last) => `<url><loc>${x(origin + path)}</loc>${last ? `<lastmod>${x(String(last).slice(0, 10))}</lastmod>` : ""}</url>`;
  const body = [...STATIC.map((p) => u(p)), ...cols.map((c) => u(`/shop/?c=${c.slug}`)), ...products.map((p) => u(`/product/?s=${p.slug}`, p.updated_at)), ...posts.map((p) => u(`/blog/post/?s=${p.slug}`, p.updated_at))].join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
