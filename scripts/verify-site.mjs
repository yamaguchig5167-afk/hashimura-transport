/**
 * 公開サイトの受け入れ確認
 *
 *   node scripts/verify-site.mjs                      （現在の公開URLを確認）
 *   node scripts/verify-site.mjs hashimura-unso.com   （切り替え後の確認）
 *
 * ドメイン切り替えのあと、目視では見落とす項目を機械的に確かめる。
 * 落ちた項目だけが「✗」で出る。
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const OLD_BASE = 'https://yamaguchig5167-afk.github.io/hashimura-transport';
const arg = process.argv[2];
const domain = arg || (existsSync('CNAME') ? readFileSync('CNAME', 'utf8').trim() : null);
const base = domain ? `https://${domain}` : OLD_BASE;

const PAGES = ['index.html', 'services.html', 'recruit.html', 'news.html',
               'pilot-car.html', 'yard-operations.html'];

let ng = 0;
const ok  = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => { console.log(`  ✗ ${m}`); ng++; };

async function get(url) {
  try {
    const r = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    return { ok: r.ok, status: r.status, text: r.ok ? await r.text() : '' };
  } catch (e) { return { ok: false, status: 0, text: '', error: e.message }; }
}

async function head(url, redirect = 'manual') {
  try { return await fetch(url, { redirect, headers: { 'cache-control': 'no-cache' } }); }
  catch (e) { return { ok: false, status: 0, error: e.message, headers: new Headers() }; }
}

console.log(`確認対象: ${base}\n`);

/* 1. 全ページが開くか */
console.log('■ ページの応答');
const html = {};
for (const p of PAGES) {
  const r = await get(`${base}/${p}`);
  if (r.ok) { html[p] = r.text; ok(`${p} (${r.status})`); }
  else bad(`${p} が開けない (${r.status}${r.error ? ' ' + r.error : ''})`);
}

/* 2. HTTPS と転送 */
if (domain) {
  console.log('\n■ 転送と暗号化');
  const h = await head(`http://${domain}/`);
  if ([301, 302, 307, 308].includes(h.status)) ok(`http → ${h.headers.get('location')}`);
  else bad(`http が転送されない (${h.status})`);

  const w = await head(`https://www.${domain}/`);
  if ([200, 301, 302, 307, 308].includes(w.status)) ok(`www 応答 ${w.status} → ${w.headers.get('location') || '(直接表示)'}`);
  else bad(`www が応答しない (${w.status})`);

  const old = await head(`${OLD_BASE}/`);
  if ([301, 302, 307, 308].includes(old.status)) ok(`旧URL → ${old.headers.get('location')}`);
  else bad(`旧URLが新URLへ転送されない (${old.status})`);
}

/* 3. ページ内の絶対URLが新しいものになっているか */
console.log('\n■ 検索エンジン向けの情報');
let stale = 0;
for (const [p, t] of Object.entries(html)) {
  if (domain && t.includes(OLD_BASE)) { bad(`${p} に旧URLが残っている`); stale++; }
  const canon = (t.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!canon) bad(`${p} に canonical が無い`);
  else if (!canon.startsWith(base)) bad(`${p} の canonical が ${canon}`);
  const og = (t.match(/property="og:image"\s+content="([^"]+)"/) || [])[1];
  if (og && !og.startsWith(base)) bad(`${p} の og:image が ${og}`);
}
if (!stale && domain) ok('全ページで旧URLの残りなし');

for (const f of ['robots.txt', 'sitemap.xml']) {
  const r = await get(`${base}/${f}`);
  if (!r.ok) { bad(`${f} が開けない (${r.status})`); continue; }
  const t = r.text;
  if (domain && t.includes(OLD_BASE)) bad(`${f} に旧URLが残っている`);
  else ok(`${f} 正常`);
}

/* 4. 画像が全部あるか・縦横比が揃っているか */
console.log('\n■ 画像');
const seen = new Set();
let imgNg = 0, ratioNg = 0;
for (const [p, t] of Object.entries(html)) {
  for (const m of t.matchAll(/<img[^>]+src="(images\/[^"]+)"[^>]*>/g)) {
    const [tag, src] = m;
    if (seen.has(src)) continue;
    seen.add(src);
    const r = await head(`${base}/${src}`, 'follow');
    if (!r.ok) { bad(`${src} が無い (${r.status}) ← ${p}`); imgNg++; continue; }
    const w = +(tag.match(/width="(\d+)"/) || [])[1];
    const h = +(tag.match(/height="(\d+)"/) || [])[1];
    if (w && h && Math.abs(w / h - 16 / 9) > 0.05) { bad(`${src} が16:9でない (${w}x${h})`); ratioNg++; }
  }
}
if (!imgNg) ok(`画像 ${seen.size}件すべて配信されている`);
if (!ratioNg) ok('掲載画像はすべて16:9');

/* 5. 問い合わせ先 */
console.log('\n■ お問い合わせ');
const js = (await get(`${base}/js/main.js`)).text;
const mail = (js.match(/CONTACT_EMAIL:\s*'([^']+)'/) || [])[1];
if (mail === 'hashimura@dolphin.ocn.ne.jp') ok(`送信先 ${mail}`);
else bad(`送信先が ${mail}`);
if (js.includes('YOUR_DEPLOYMENT_ID')) console.log('  ・フォームは未接続（メール送信へ切り替わる動作）');
else ok('フォームは本接続済み');

/* 6. 規約上の禁止表記 */
console.log('\n■ 表記の確認');
const all = Object.values(html).join('\n');
for (const w of ['YOHAKU', 'yamaguchi.g5167', 'cadabra', 'カダブラ', '物流ハシムラ', '春日物流']) {
  if (all.includes(w)) bad(`「${w}」が本文に出ている`);
}
if (!ng) ok('禁止表記なし');

console.log(`\n${ng === 0 ? '✓ すべて問題なし' : `✗ ${ng}件の問題`}`);
process.exit(ng === 0 ? 0 : 1);
