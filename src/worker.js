// Serves the static site and adds server-side SEO for dynamic pages:
//   /sitemap.xml         generated from Supabase
//   /feeds/products.xml  product feed for Google Merchant Center, Pinterest and Meta catalogs
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
        if (path === "/feeds/products.xml") return await feed(url.origin);
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
  const [p] = await get(`products?slug=eq.${slug}&status=eq.published&select=id,name,description,product_images(url,sort),product_variants(id,sku,title,price_minor,currency,active)&limit=1`);
  if (!p) return null;
  const [ratings, reviews] = await Promise.all([
    get(`product_ratings?product_id=eq.${p.id}&select=avg,count`),
    get(`reviews?product_id=eq.${p.id}&status=eq.published&select=rating,title,body,display_name&order=created_at.desc&limit=5`),
  ]);
  const imgs = [...(p.product_images || [])].sort((a, b) => a.sort - b.sort).map((i) => i.url).filter((u) => /^https:\/\//.test(u));
  const vs = p.product_variants || [], prices = vs.filter((v) => v.active).map((v) => v.price_minor);
  const desc = clean(p.description).slice(0, 155) || "Christian apparel from Noctra, made to order.";
  const canon = `${origin}/product/?s=${slug}`, title = `${p.name} | Noctra`;
  const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, description: clean(p.description).slice(0, 500), image: imgs.slice(0, 6), brand: { "@type": "Brand", name: "Noctra" }, url: canon,
    offers: vs.slice(0, 100).map((v) => ({ "@type": "Offer", sku: v.sku, name: v.title, price: (v.price_minor / 100).toFixed(2), priceCurrency: v.currency, availability: v.active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${canon}&v=${v.id}` })) };
  const r = ratings[0];
  if (r && r.count > 0) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: r.avg, reviewCount: r.count };
    ld.review = reviews.map((x) => ({ "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: x.rating }, author: { "@type": "Person", name: x.display_name }, name: x.title, reviewBody: x.body }));
  }
  const price = prices.length ? `<meta property="product:price:amount" content="${(Math.min(...prices) / 100).toFixed(2)}"><meta property="product:price:currency" content="ZAR"><meta property="og:availability" content="instock">` : "";
  const tags = `<link rel="canonical" href="${e(canon)}"><meta property="og:type" content="product"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${e(canon)}">${imgs[0] ? `<meta property="og:image" content="${e(imgs[0])}">` : ""}${price}<meta name="twitter:card" content="summary_large_image">${ldTag(ld)}`;
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

// Product feed in the Google Merchant Center RSS format (also accepted by Pinterest and Meta catalogs).
const xe = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
async function feed(origin) {
  const [products, ship] = await Promise.all([
    get("products?select=id,slug,name,description,collection:collections(title),product_images(url,sort),product_variants(id,sku,title,options,price_minor,currency,active)&status=eq.published&limit=200"),
    get("site_settings?key=eq.shipping&select=value"),
  ]);
  const countries = ship[0]?.value?.countries || {};
  const items = [];
  for (const p of products) {
    const imgs = [...(p.product_images || [])].sort((a, b) => a.sort - b.sort).map((i) => i.url).filter((u) => /^https:\/\//.test(u));
    if (!imgs.length) continue;
    const desc = clean(p.description).slice(0, 4900) || p.name;
    const tee = !/hood|sweat/i.test(p.name);
    for (const v of p.product_variants || []) {
      const o = v.options || {}, colour = Object.entries(o).find(([k]) => /colou?r/i.test(k))?.[1], size = Object.entries(o).find(([k]) => /size/i.test(k))?.[1];
      items.push(`<item><g:id>${xe(v.sku || v.id)}</g:id><g:item_group_id>${xe(p.slug)}</g:item_group_id><title>${xe(p.name)}</title><description>${xe(desc)}</description><link>${xe(`${origin}/product/?s=${p.slug}&v=${v.id}`)}</link><g:image_link>${xe(imgs[0])}</g:image_link>${imgs.slice(1, 10).map((u) => `<g:additional_image_link>${xe(u)}</g:additional_image_link>`).join("")}<g:availability>${v.active ? "in_stock" : "out_of_stock"}</g:availability><g:price>${(v.price_minor / 100).toFixed(2)} ${xe(v.currency)}</g:price><g:brand>Noctra</g:brand><g:condition>new</g:condition><g:identifier_exists>no</g:identifier_exists><g:google_product_category>${tee ? "Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops" : "Apparel &amp; Accessories &gt; Clothing"}</g:google_product_category>${p.collection?.title ? `<g:product_type>${xe(p.collection.title)}</g:product_type>` : ""}<g:gender>unisex</g:gender><g:age_group>adult</g:age_group>${colour ? `<g:color>${xe(colour)}</g:color>` : ""}${size ? `<g:size>${xe(size)}</g:size>` : ""}${Object.entries(countries).map(([c, m]) => `<g:shipping><g:country>${xe(c)}</g:country><g:service>Standard</g:service><g:price>${(m / 100).toFixed(2)} ZAR</g:price></g:shipping>`).join("")}</item>`);
    }
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Noctra</title><link>${xe(origin)}</link><description>Christian apparel, made to order.</description>\n${items.join("\n")}\n</channel></rss>`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
