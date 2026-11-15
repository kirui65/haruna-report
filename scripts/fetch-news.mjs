// Fetches Kenyan news from Google News RSS and writes news.json (Node 18+, no dependencies)
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const P = 'hl=en-KE&gl=KE&ceid=KE:en';
const search = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:2d')}&${P}`;

const CATEGORIES = [
  { id: 'top', name: 'Top Stories', url: `https://news.google.com/rss/headlines/section/topic/NATION?${P}` },
  { id: 'politics', name: 'Politics', url: search('Kenya politics') },
  { id: 'business', name: 'Business', url: search('Kenya business economy') },
  { id: 'counties', name: 'Counties', url: search('Kenya county governor OR MCA OR Nairobi OR Mombasa OR Kisumu') },
  { id: 'sports', name: 'Sports', url: search('Kenya sports') },
  { id: 'entertainment', name: 'Entertainment', url: search('Kenya entertainment celebrity') },
  { id: 'tech', name: 'Tech', url: search('Kenya technology') },
  { id: 'health', name: 'Health', url: search('Kenya health') },
];

// Keeps a local build useful when an environment temporarily cannot resolve
// Google News. GitHub Actions normally uses the live RSS feeds above.
const FALLBACK = [
  { id: 'top', name: 'Top Stories', items: [
    ['Kenya discharges last Ebola patient, beginning countdown to Ebola-free declaration', 'https://apnews.com/article/74689c9faa169dafeee5d21852fde992', 'Associated Press'],
    ['Kenyans brace for heavy El Niño rains as flood survivors recall their losses', 'https://apnews.com/article/ca89cbcfc9d9e88f59cbefe076559195', 'Associated Press'],
  ]},
  { id: 'politics', name: 'Politics', items: [
    ['Kalonzo pledges to step aside for a single opposition candidate', 'https://kenyaminute.com/archive/2026-11-15', 'Kenya Minute'],
    ['Opposition leaders press for a single 2027 presidential challenger', 'https://kenyaminute.com/archive/2026-11-15', 'Kenya Minute'],
  ]},
  { id: 'business', name: 'Business', items: [
    ['Kenya puts vulnerable cities at the centre of its climate adaptation push', 'https://thekenyatimes.com/page/367/', 'The Kenya Times'],
  ]},
  { id: 'counties', name: 'Counties', items: [
    ['Engineers call for nationwide inspections of high-risk buildings', 'https://www.kenyans.co.ke/', 'Kenyans.co.ke'],
  ]},
  { id: 'sports', name: 'Sports', items: [
    ['Kenya sports headlines and results', 'https://kenyaminute.com/archive/2026-11-15', 'Kenya Minute'],
  ]},
  { id: 'entertainment', name: 'Entertainment', items: [
    ['The latest entertainment stories from Kenya', 'https://thekenyatimes.com/', 'The Kenya Times'],
  ]},
  { id: 'tech', name: 'Tech', items: [
    ['Kenya news and technology updates', 'https://thekenyatimes.com/', 'The Kenya Times'],
  ]},
  { id: 'health', name: 'Health', items: [
    ['Kenya begins its countdown toward an Ebola-free declaration', 'https://apnews.com/article/74689c9faa169dafeee5d21852fde992', 'Associated Press'],
  ]},
].map((c) => ({ ...c, items: c.items.map(([title, link, source]) => ({
  title, link, source, date: new Date().toISOString(),
})) }));

const decode = (s) => s
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : '';
};

const idFor = (link) => createHash('sha1').update(link).digest('hex').slice(0, 16);
const htmlText = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
const meta = (html, property) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const reverse = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
  const m = html.match(re) || html.match(reverse);
  return m ? decode(m[1]) : '';
};

const isGoogleMedia = (value) => /(?:googleusercontent|gstatic|news\.google)\./i.test(value || '');
const SOURCE_FEEDS = {
  'nation.africa': 'https://nation.africa/kenya/rss.xml',
  'businessdailyafrica.com': 'https://www.businessdailyafrica.com/bd/rss',
  'capitalfm.africa': 'https://capitalfm.africa/news/feed/',
  'the-star.co.ke': 'https://www.the-star.co.ke/feed/',
  'citizen.digital': 'https://www.citizen.digital/rss',
};
const feedCache = new Map();
const normalizeTitle = (value) => value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
async function fromPublisherFeed(item) {
  try {
    const host = new URL(item.sourceUrl).hostname.replace(/^www\./, '');
    const feedUrl = SOURCE_FEEDS[host];
    if (!feedUrl) return null;
    if (!feedCache.has(host)) feedCache.set(host, fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 HarunaReportBot' } }).then((r) => r.text()).catch(() => ''));
    const xml = await feedCache.get(host);
    const target = normalizeTitle(item.title);
    const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(([, block]) => {
      const title = htmlText(tag(block, 'title'));
      const words = new Set(target.split(' ').filter((w) => w.length > 3));
      const overlap = [...words].filter((word) => normalizeTitle(title).includes(word)).length / Math.max(words.size, 1);
      const image = block.match(/<(?:media:content|media:thumbnail|enclosure)[^>]+url=["']([^"']+)["']/i)?.[1] || '';
      return { title, link: tag(block, 'link'), description: htmlText(tag(block, 'description')), image, overlap };
    }).sort((a, b) => b.overlap - a.overlap)[0];
    return matches?.overlap >= 0.55 ? matches : null;
  } catch { return null; }
}
async function resolvePublisher(item) {
  try {
    const sourceHost = new URL(item.sourceUrl).hostname.replace(/^www\./, '');
    const q = encodeURIComponent(`site:${sourceHost} "${item.title}"`);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, { headers: { 'User-Agent': 'Mozilla/5.0 HarunaReportBot' } });
    if (!res.ok) return item.link;
    const html = await res.text();
    const urls = [...html.matchAll(/uddg=([^&"]+)/g)].map(([, value]) => decodeURIComponent(value));
    return urls.find((url) => {
      try { return new URL(url).hostname.replace(/^www\./, '').endsWith(sourceHost); } catch { return false; }
    }) || item.link;
  } catch { return item.link; }
}

async function enrich(item) {
  try {
    const publisher = await fromPublisherFeed(item);
    const articleUrl = publisher?.link || await resolvePublisher(item);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(articleUrl, { headers: { 'User-Agent': 'Mozilla/5.0 HarunaReportBot' }, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || '';
    const paragraphs = [...article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(([, p]) => htmlText(p)).filter((p) => p.length > 40).slice(0, 80);
    const image = publisher?.image || meta(html, 'og:image');
    const video = meta(html, 'og:video') || meta(html, 'og:video:url');
    const description = publisher?.description || meta(html, 'og:description') || meta(html, 'description') || item.description;
    return { ...item, id: idFor(item.link), canonicalUrl: res.url || articleUrl, description: /Comprehensive up-to-date news coverage/i.test(description) ? '' : description, content: paragraphs, media: [...(image && !isGoogleMedia(image) ? [{ type: 'image', url: image }] : []), ...(video && !isGoogleMedia(video) ? [{ type: 'video', url: video }] : [])] };
  } catch (e) {
    console.error('Article unavailable', item.title, e.message);
    return { ...item, id: idFor(item.link), content: [], media: [] };
  }
}

function parse(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, b]) => {
    let title = tag(b, 'title');
    const source = tag(b, 'source');
    const sourceUrl = b.match(/<source[^>]+url=["']([^"']+)["']/i)?.[1] || '';
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    return { title, link: tag(b, 'link'), source, sourceUrl, description: htmlText(tag(b, 'description')), date: new Date(tag(b, 'pubDate')).toISOString() };
  }).filter((i) => i.title && i.link && !isNaN(new Date(i.date)));
}

const out = { updated: new Date().toISOString(), categories: [] };

for (const c of CATEGORIES) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(c.url, { headers: { 'User-Agent': 'Mozilla/5.0 HarunaReportBot' }, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(res.status);
    const seen = new Set();
    const items = parse(await res.text())
      .filter((i) => !seen.has(i.title) && seen.add(i.title))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 40);
    const enriched = await Promise.all(items.slice(0, 12).map(enrich));
    out.categories.push({ id: c.id, name: c.name, items: [...enriched, ...items.slice(12).map((i) => ({ ...i, id: idFor(i.link), content: [], media: [] }))] });
    console.log(c.name, items.length);
  } catch (e) {
    console.error('Failed', c.name, e.message);
  }
}

if (!out.categories.length) {
  console.warn('All live feeds failed; writing the emergency local fallback.');
  out.categories = FALLBACK;
}
await writeFile('news.json', JSON.stringify(out));
