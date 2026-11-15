import { mkdir, readFile, writeFile } from 'node:fs/promises';

const site = process.env.SITE_URL || 'https://haruna-report.vercel.app';
const defaultImage = `${site}/og-default.svg`;
const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const data = JSON.parse(await readFile('news.json', 'utf8'));
const all = data.categories.flatMap((c) => c.items);
await mkdir('articles', { recursive: true });

for (const article of all) {
  const id = encodeURIComponent(article.id || article.link);
  const url = `${site}/articles/${id}.html`;
  const image = article.media?.find((m) => m.type === 'image')?.url || defaultImage;
  const body = article.content?.length
    ? article.content.map((p) => `<p>${esc(p)}</p>`).join('')
    : `<p class="summary-label">News summary</p><p>${esc(article.description || 'The publisher has not supplied an article extract yet. Read the source for the full story.')}</p>`;
  const media = (article.media || []).map((m) => m.type === 'video'
    ? `<video controls src="${esc(m.url)}"></video>`
    : `<img class="hero" src="${esc(m.url)}" alt="${esc(article.title)}">`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(article.title)} — HARUNA REPORT</title><meta name="description" content="${esc(article.description || article.title)}"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:site_name" content="HARUNA REPORT"><meta property="og:url" content="${url}"><meta property="og:title" content="${esc(article.title)}"><meta property="og:description" content="${esc(article.description || article.title)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(article.title)}"><meta name="twitter:description" content="${esc(article.description || article.title)}"><meta name="twitter:image" content="${esc(image)}"><style>:root{--bg:#faf8f4;--card:#fff;--ink:#16181a;--muted:#6b7075;--green:#0a6b3d;--red:#bb1a1a;--line:#e4e0d8}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif}.wrap{max-width:780px;margin:auto;padding:0 18px}header{border-bottom:4px solid var(--ink);padding:18px 0 12px}.brand{font:800 30px Georgia,serif;color:var(--ink)}.brand span{color:var(--red)}a{color:var(--green)}.back{display:inline-block;margin:24px 0 12px}.meta{color:var(--muted);font-size:14px}h1{font:700 clamp(28px,6vw,48px)/1.15 Georgia,serif}.hero,video{width:100%;max-height:480px;object-fit:cover;border-radius:12px;margin:14px 0 24px}.story p{margin:0 0 18px}.summary-label{color:var(--green);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.actions{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.btn{border:1px solid var(--line);border-radius:999px;background:var(--card);padding:9px 13px;color:var(--ink);text-decoration:none;font:600 13px inherit}</style></head><body><header><div class="wrap"><a class="brand" href="${site}/index.html">HARUNA <span>REPORT</span></a></div></header><main class="wrap"><a class="back" href="${site}/index.html">← Back to headlines</a><div class="meta"><b>${esc(article.source)}</b> · ${new Date(article.date).toLocaleString('en-KE')}</div><h1>${esc(article.title)}</h1><div class="actions"><a class="btn" href="https://wa.me/?text=${encodeURIComponent(article.title + ' ' + url)}">WhatsApp</a><a class="btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}">Facebook</a><a class="btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(url)}">X</a><button class="btn" onclick="navigator.clipboard.writeText(location.href);this.textContent='Copied ✓'">Copy link</button></div>${media}<div class="story">${body}</div><p class="meta">Source: <a href="${esc(article.canonicalUrl || article.sourceUrl || article.link)}">${esc(article.source)}</a></p></main></body></html>`;
  await writeFile(`articles/${id}.html`, html);
}
