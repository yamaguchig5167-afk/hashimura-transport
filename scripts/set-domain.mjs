/**
 * 独自ドメインへの切り替えスクリプト
 *
 *   node scripts/set-domain.mjs hashimura-unso.com
 *   node scripts/set-domain.mjs hashimura-unso.com --force   （DNS確認を飛ばす）
 *   node scripts/set-domain.mjs --check hashimura-unso.com   （DNSだけ確認する）
 *   node scripts/set-domain.mjs --revert                     （github.io へ戻す）
 *
 * サイト内の絶対URL（canonical・OGP・sitemap・robots・手元の説明文）をまとめて
 * 書き換え、GitHub Pages 用の CNAME ファイルを作る。
 *
 * 【事故を防ぐ仕組み】
 * CNAME を置いた時点で github.io のURLは独自ドメインへ転送される。
 * DNSが未設定のまま反映するとサイトが開けなくなるため、
 * **実行前にDNSを引いて GitHub Pages を向いているか確かめ、
 * 向いていなければ中止する。**（どうしても進めるときだけ --force）
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resolver } from 'node:dns/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const OLD_BASE = 'https://yamaguchig5167-afk.github.io/hashimura-transport';

/** GitHub Pages の配信元IP（4件すべてが正しく登録されている必要がある） */
const GH_PAGES_IPS = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];

const args = process.argv.slice(2);
const force = args.includes('--force');
const checkOnly = args.includes('--check');
const revert = args.includes('--revert');
const domainArg = args.find(a => !a.startsWith('--'));

function usage() {
  console.error('使い方:');
  console.error('  node scripts/set-domain.mjs <ドメイン>          例) hashimura-unso.com');
  console.error('  node scripts/set-domain.mjs --check <ドメイン>  DNSだけ確認');
  console.error('  node scripts/set-domain.mjs --revert            github.io へ戻す');
  process.exit(1);
}

if (!revert && !domainArg) usage();

const domain = domainArg ? domainArg.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
if (domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) {
  console.error(`ドメインの書式が正しくありません: ${domain}`);
  process.exit(1);
}

/** いま使われている基準URLを CNAME から判定する */
function currentDomain() {
  return existsSync('CNAME') ? readFileSync('CNAME', 'utf8').trim() : null;
}

/** DNSが GitHub Pages を向いているか確かめる */
async function checkDns(name) {
  const resolver = new Resolver();
  resolver.setServers(['1.1.1.1', '8.8.8.8']); // 手元のキャッシュに惑わされないよう公開DNSで引く
  const report = { ok: false, a: [], missing: [], extra: [], www: null };

  try {
    report.a = (await resolver.resolve4(name)).sort();
  } catch (err) {
    report.error = `Aレコードを引けません（${err.code}）`;
    return report;
  }
  report.missing = GH_PAGES_IPS.filter(ip => !report.a.includes(ip));
  report.extra = report.a.filter(ip => !GH_PAGES_IPS.includes(ip));

  try {
    report.www = (await resolver.resolveCname('www.' + name))[0] || null;
  } catch {
    report.www = null;
  }

  report.ok = report.missing.length === 0 && report.extra.length === 0;
  return report;
}

function printDns(name, r) {
  console.log(`\nDNS確認: ${name}`);
  if (r.error) { console.log(`  ✗ ${r.error}`); return; }
  console.log(`  Aレコード: ${r.a.join(', ') || '(なし)'}`);
  if (r.missing.length) console.log(`  ✗ 不足: ${r.missing.join(', ')}`);
  if (r.extra.length)   console.log(`  ✗ 余分: ${r.extra.join(', ')}（GitHub Pages以外を向いています）`);
  console.log(`  www の CNAME: ${r.www || '(未設定)'}`);
  if (r.ok) console.log('  ✓ GitHub Pages を正しく向いています');
}

/* ---- DNS確認だけして終わる ---- */
if (checkOnly) {
  if (!domain) usage();
  const r = await checkDns(domain);
  printDns(domain, r);
  console.log(r.ok ? '\n切り替えて問題ありません。' : '\nまだ切り替えないでください。');
  process.exit(r.ok ? 0 : 1);
}

/* ---- 戻す ---- */
if (revert && !currentDomain()) {
  console.error('CNAME が無いため、戻す対象がありません。');
  process.exit(1);
}

/* ---- 切り替え前のDNS確認 ---- */
if (!revert) {
  const r = await checkDns(domain);
  printDns(domain, r);
  if (!r.ok && !force) {
    console.error('\n中止しました。DNSが GitHub Pages を向いていないまま反映すると、');
    console.error('サイトが開けなくなります。DNSを設定し、反映を待ってからやり直してください。');
    console.error('（確認だけ: node scripts/set-domain.mjs --check ' + domain + '）');
    process.exit(1);
  }
  if (!r.ok && force) console.warn('\n--force が指定されたため、DNSが未設定でも続行します。');
  if (r.www && !/github\.io\.?$/.test(r.www)) {
    console.warn(`注意: www の CNAME が ${r.www} です。GitHub Pages 以外を向いています。`);
  }
}

const newBase = revert ? OLD_BASE : `https://${domain}`;
const fromBase = revert ? `https://${currentDomain()}` : OLD_BASE;

/* 公開ファイルに加えて、手元の説明文（README・CLAUDE.md）も直す。
   URLが古いまま残ると、次に触る人が誤ったURLを前提に作業してしまう。 */
const targets = readdirSync('.').filter(f => /\.(html|xml|txt|md)$/.test(f));
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
console.log('  1. GitHub の Settings → Pages で Custom domain を設定し、HTTPS を有効化');
console.log('  2. Google Search Console に新しいURLで登録し、サイトマップを送信');
