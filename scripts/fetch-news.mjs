// Fetches Kenyan news from Google News RSS and writes news.json (Node 18+, no dependencies)
import { writeFile } from 'node:fs/promises';

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

function parse(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, b]) => {
    let title = tag(b, 'title');
    const source = tag(b, 'source');
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    return { title, link: tag(b, 'link'), source, date: new Date(tag(b, 'pubDate')).toISOString() };
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
    out.categories.push({ id: c.id, name: c.name, items });
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
