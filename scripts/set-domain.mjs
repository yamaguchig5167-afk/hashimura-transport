/**
 * 独自ドメインへの切り替えスクリプト
 *
 *   node scripts/set-domain.mjs hashimura-unso.co.jp
 *   node scripts/set-domain.mjs --revert   （github.io へ戻す）
 *
 * サイト内の絶対URL（canonical・OGP・sitemap・robots）をまとめて書き換え、
 * GitHub Pages 用の CNAME ファイルを作る。
 *
 * 【重要】CNAME ファイルを置いた時点で、github.io のURLは
 * 独自ドメインへ転送されるようになる。DNSの設定が済む前に反映すると
 * サイトが一時的に開けなくなるため、**DNSを設定してから**実行すること。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const OLD_BASE = 'https://yamaguchig5167-afk.github.io/hashimura-transport';
const arg = process.argv[2];

if (!arg) {
  console.error('使い方: node scripts/set-domain.mjs <ドメイン>   例) hashimura-unso.co.jp');
  console.error('        node scripts/set-domain.mjs --revert');
  process.exit(1);
}

const revert = arg === '--revert';
const domain = revert ? null : arg.replace(/^https?:\/\//, '').replace(/\/$/, '');
if (domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) {
  console.error(`ドメインの書式が正しくありません: ${domain}`);
  process.exit(1);
}

const newBase = revert ? OLD_BASE : `https://${domain}`;
const fromBase = revert ? `https://${currentDomain()}` : OLD_BASE;

/** いま使われている基準URLを CNAME から判定する */
function currentDomain() {
  if (existsSync('CNAME')) return readFileSync('CNAME', 'utf8').trim();
  return null;
}

if (revert && !currentDomain()) {
  console.error('CNAME が無いため、戻す対象がありません。');
  process.exit(1);
}

const targets = readdirSync('.').filter(f => /\.(html|xml|txt)$/.test(f));
let changed = 0;

for (const f of targets) {
  const before = readFileSync(f, 'utf8');
  const after = before.split(fromBase).join(newBase);
  if (after !== before) {
    writeFileSync(f, after, 'utf8');
    const n = before.split(fromBase).length - 1;
    console.log(`${f}: ${n}件`);
    changed += n;
  }
}

if (revert) {
  if (existsSync('CNAME')) { unlinkSync('CNAME'); console.log('CNAME を削除'); }
} else {
  writeFileSync('CNAME', domain + '\n', 'utf8');
  console.log(`CNAME を作成: ${domain}`);
}

console.log(`\n基準URL: ${fromBase}\n     → : ${newBase}`);
console.log(`書き換え ${changed} 件`);
console.log('\n反映後にやること:');
console.log('  1. GitHub の Settings → Pages で Custom domain が設定され、HTTPS が有効か確認');
console.log('  2. Google Search Console に新しいURLで登録し、サイトマップを送信');
