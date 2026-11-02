// Adds per-product title, description, Open Graph tags and JSON-LD to /product/?s=slug
// before the page reaches the browser, so search engines and link previews see them.
const SB = "https://omzcuetbhurjwnzdufme.supabase.co";
const KEY = "sb_publishable_4LOhoQl3HtgQwloh17MyIg_ZkIBHRhx";
const e = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (t) => String(t || "").replace(/^\s*XS\s+S\s+M[\s\S]*?Size tolerance, in(?:\s+[\d.]+)+\s*/i, "").replace(/\s+/g, " ").trim();
export async function onRequestGet(context) {
  const res = await context.next();
  try {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get("s");
    if (!slug || !/^[a-z0-9-]{1,200}$/.test(slug) || !(res.headers.get("content-type") || "").includes("text/html")) return res;
    const q = `products?slug=eq.${slug}&status=eq.published&select=name,description,updated_at,product_images(url,sort),product_variants(price_minor,active)&limit=1`;
    const r = await fetch(`${SB}/rest/v1/${q}`, { headers: { apikey: KEY }, cf: { cacheTtl: 300 } });
    const [p] = r.ok ? await r.json() : [];
    if (!p) return res;
    const imgs = [...(p.product_images || [])].sort((a, b) => a.sort - b.sort).map((i) => i.url).filter((u) => /^https:\/\//.test(u));
    const prices = (p.product_variants || []).filter((v) => v.active).map((v) => v.price_minor);
    const desc = clean(p.description).slice(0, 155) || "Christian apparel from Noctra, made to order.";
    const canon = `${url.origin}/product/?s=${slug}`, title = `${p.name} | Noctra`;
    const ld = {
      "@context": "https://schema.org", "@type": "Product", name: p.name, description: clean(p.description).slice(0, 500), image: imgs.slice(0, 6), brand: { "@type": "Brand", name: "Noctra" }, url: canon,
      ...(prices.length ? { offers: { "@type": "AggregateOffer", priceCurrency: "ZAR", lowPrice: (Math.min(...prices) / 100).toFixed(2), highPrice: (Math.max(...prices) / 100).toFixed(2), offerCount: prices.length, availability: "https://schema.org/InStock", url: canon } } : {}),
    };
    const tags = `<link rel="canonical" href="${e(canon)}"><meta property="og:type" content="product"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${e(canon)}">${imgs[0] ? `<meta property="og:image" content="${e(imgs[0])}">` : ""}<meta name="twitter:card" content="summary_large_image"><script type="application/ld+json" data-ld="1">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
    let html = await res.text();
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${e(title)}</title>`).replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${e(desc)}">`).replace("</head>", tags + "</head>");
    const out = new Response(html, res);
    out.headers.set("cache-control", "public, max-age=300");
    return out;
  } catch { return res; }
}
