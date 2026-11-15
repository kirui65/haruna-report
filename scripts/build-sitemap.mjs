import { readFile, writeFile } from 'node:fs/promises';

const site = process.env.SITE_URL || 'https://haruna-report.vercel.app';
const data = JSON.parse(await readFile('news.json', 'utf8'));
const items = data.categories.flatMap((category) => category.items);
const esc = (value) => String(value).replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));
const urls = [
  `<url><loc>${site}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
  ...items.map((article) => {
    const id = encodeURIComponent(article.id || article.link);
    const lastmod = new Date(article.date || Date.now()).toISOString();
    return `<url><loc>${site}/articles/${id}.html</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
  })
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
await writeFile('sitemap.xml', xml);
