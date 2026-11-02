// Adds per-post title, description, Open Graph tags and Article JSON-LD to /blog/post/?s=slug.
const SB = "https://omzcuetbhurjwnzdufme.supabase.co";
const KEY = "sb_publishable_4LOhoQl3HtgQwloh17MyIg_ZkIBHRhx";
const e = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export async function onRequestGet(context) {
  const res = await context.next();
  try {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get("s");
    if (!slug || !/^[a-z0-9-]{1,200}$/.test(slug) || !(res.headers.get("content-type") || "").includes("text/html")) return res;
    const r = await fetch(`${SB}/rest/v1/posts?slug=eq.${slug}&published=eq.true&select=title,excerpt,cover_url,published_at,updated_at&limit=1`, { headers: { apikey: KEY }, cf: { cacheTtl: 300 } });
    const [p] = r.ok ? await r.json() : [];
    if (!p) return res;
    const canon = `${url.origin}/blog/post/?s=${slug}`, title = `${p.title} | Noctra`, img = /^https:\/\//.test(p.cover_url || "") ? p.cover_url : `${url.origin}/assets/og.png`;
    const ld = { "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.excerpt, image: [img], datePublished: p.published_at, dateModified: p.updated_at, author: { "@type": "Organization", name: "Noctra" }, publisher: { "@type": "Organization", name: "Noctra" }, mainEntityOfPage: canon };
    const tags = `<link rel="canonical" href="${e(canon)}"><meta property="og:type" content="article"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(p.excerpt)}"><meta property="og:url" content="${e(canon)}"><meta property="og:image" content="${e(img)}"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json" data-ld="1">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
    let html = await res.text();
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${e(title)}</title>`).replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${e(p.excerpt)}">`).replace("</head>", tags + "</head>");
    const out = new Response(html, res);
    out.headers.set("cache-control", "public, max-age=300");
    return out;
  } catch { return res; }
}
