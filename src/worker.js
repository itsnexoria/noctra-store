// Serves the static site and adds server-side SEO for dynamic pages:
//   /sitemap.xml         generated from Supabase
//   /product/?s=slug     per-product title, description, Open Graph tags, JSON-LD
//   /blog/post/?s=slug   per-post title, description, Open Graph tags, JSON-LD
const SB = "https://omzcuetbhurjwnzdufme.supabase.co";
const KEY = "sb_publishable_4LOhoQl3HtgQwloh17MyIg_ZkIBHRhx";
const STATIC = ["/", "/shop/", "/blog/", "/about/", "/contact/", "/shipping/", "/refunds/", "/terms/", "/privacy/"];
const e = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (t) => String(t || "").replace(/^\s*XS\s+S\s+M[\s\S]*?Size tolerance, in(?:\s+[\d.]+)+\s*/i, "").replace(/\s+/g, " ").trim();
const get = async (q) => { const r = await fetch(`${SB}/rest/v1/${q}`, { headers: { apikey: KEY }, cf: { cacheTtl: 300 } }); return r.ok ? r.json() : []; };
const SLUG = /^[a-z0-9-]{1,200}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");
    if (request.method === "GET" || request.method === "HEAD") {
      try {
        if (path === "/sitemap.xml") return await sitemap(url.origin);
        if (path === "/product") return await inject(request, env, url, productTags);
        if (path === "/blog/post") return await inject(request, env, url, postTags);
      } catch { /* fall through to the plain page */ }
    }
    return env.ASSETS.fetch(request);
  },
};

async function sitemap(origin) {
  const [products, posts, cols] = await Promise.all([
    get("products?select=slug,updated_at&status=eq.published&order=updated_at.desc&limit=1000"),
    get("posts?select=slug,updated_at&published=eq.true&order=published_at.desc&limit=1000"),
    get("collections?select=slug&published=eq.true&limit=100"),
  ]);
  const u = (p, last) => `<url><loc>${e(origin + p)}</loc>${last ? `<lastmod>${e(String(last).slice(0, 10))}</lastmod>` : ""}</url>`;
  const body = [...STATIC.map((p) => u(p)), ...cols.map((c) => u(`/shop/?c=${c.slug}`)), ...products.map((p) => u(`/product/?s=${p.slug}`, p.updated_at)), ...posts.map((p) => u(`/blog/post/?s=${p.slug}`, p.updated_at))].join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}

async function inject(request, env, url, build) {
  const res = await env.ASSETS.fetch(request);
  const slug = url.searchParams.get("s");
  if (!slug || !SLUG.test(slug) || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  const m = await build(slug, url.origin);
  if (!m) return res;
  let html = await res.text();
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${e(m.title)}</title>`).replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${e(m.desc)}">`).replace("</head>", m.tags + "</head>");
  const out = new Response(html, res);
  out.headers.set("cache-control", "public, max-age=300");
  return out;
}

const ldTag = (ld) => `<script type="application/ld+json" data-ld="1">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;

async function productTags(slug, origin) {
  const [p] = await get(`products?slug=eq.${slug}&status=eq.published&select=name,description,product_images(url,sort),product_variants(price_minor,active)&limit=1`);
  if (!p) return null;
  const imgs = [...(p.product_images || [])].sort((a, b) => a.sort - b.sort).map((i) => i.url).filter((u) => /^https:\/\//.test(u));
  const prices = (p.product_variants || []).filter((v) => v.active).map((v) => v.price_minor);
  const desc = clean(p.description).slice(0, 155) || "Christian apparel from Noctra, made to order.";
  const canon = `${origin}/product/?s=${slug}`, title = `${p.name} | Noctra`;
  const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, description: clean(p.description).slice(0, 500), image: imgs.slice(0, 6), brand: { "@type": "Brand", name: "Noctra" }, url: canon,
    ...(prices.length ? { offers: { "@type": "AggregateOffer", priceCurrency: "ZAR", lowPrice: (Math.min(...prices) / 100).toFixed(2), highPrice: (Math.max(...prices) / 100).toFixed(2), offerCount: prices.length, availability: "https://schema.org/InStock", url: canon } } : {}) };
  const tags = `<link rel="canonical" href="${e(canon)}"><meta property="og:type" content="product"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${e(canon)}">${imgs[0] ? `<meta property="og:image" content="${e(imgs[0])}">` : ""}<meta name="twitter:card" content="summary_large_image">${ldTag(ld)}`;
  return { title, desc, tags };
}

async function postTags(slug, origin) {
  const [p] = await get(`posts?slug=eq.${slug}&published=eq.true&select=title,excerpt,cover_url,published_at,updated_at&limit=1`);
  if (!p) return null;
  const canon = `${origin}/blog/post/?s=${slug}`, title = `${p.title} | Noctra`, img = /^https:\/\//.test(p.cover_url || "") ? p.cover_url : `${origin}/assets/og.png`;
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.excerpt, image: [img], datePublished: p.published_at, dateModified: p.updated_at, author: { "@type": "Organization", name: "Noctra" }, publisher: { "@type": "Organization", name: "Noctra" }, mainEntityOfPage: canon };
  const tags = `<link rel="canonical" href="${e(canon)}"><meta property="og:type" content="article"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(p.excerpt)}"><meta property="og:url" content="${e(canon)}"><meta property="og:image" content="${e(img)}"><meta name="twitter:card" content="summary_large_image">${ldTag(ld)}`;
  return { title, desc: p.excerpt, tags };
}
