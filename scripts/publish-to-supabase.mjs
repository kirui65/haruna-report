// Uploads permitted article media to Supabase Storage. Secrets are environment-only.
import { readFile, writeFile } from 'node:fs/promises';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || 'news-media';
if (!url || !key) {
  console.warn('Supabase secrets are not configured; keeping publisher media URLs.');
  process.exit(0);
}

const news = JSON.parse(await readFile('news.json', 'utf8'));
const publicUrl = (path) => `${url.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path}`;
const safeName = (value) => value.replace(/[^a-z0-9._-]/gi, '_').slice(-180);

for (const category of news.categories) for (const article of category.items) {
  for (const media of article.media || []) {
    try {
      if (!/^https?:\/\//.test(media.url) || media.url.includes('/storage/v1/object/public/')) continue;
      const response = await fetch(media.url, { headers: { 'User-Agent': 'Mozilla/5.0 HarunaReportBot' } });
      if (!response.ok) continue;
      const type = response.headers.get('content-type') || (media.type === 'video' ? 'video/mp4' : 'image/jpeg');
      if (!type.startsWith('image/') && !type.startsWith('video/')) continue;
      const ext = type.split('/')[1].split(';')[0].replace('jpeg', 'jpg');
      const path = `articles/${article.id}/${safeName(`${media.type}.${ext}`)}`;
      const upload = await fetch(`${url.replace(/\/$/, '')}/storage/v1/object/${bucket}/${path}`, {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': type, 'x-upsert': 'true' },
        body: await response.arrayBuffer(),
      });
      if (upload.ok) media.url = publicUrl(path);
    } catch (error) {
      console.error('Media upload failed', article.title, error.message);
    }
  }
}
await writeFile('news.json', JSON.stringify(news));
