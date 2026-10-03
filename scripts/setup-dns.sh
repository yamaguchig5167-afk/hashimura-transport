#!/usr/bin/env bash
# Vercelで取得したドメインに、GitHub Pages 向けのDNSレコードを登録する。
#
#   bash scripts/setup-dns.sh hashimura-unso.com
#
# ドメインの購入後に実行する（購入は本人の操作が必要）。
# ホスティングは GitHub Pages のまま。Vercel は DNS だけ使うので、
# ドメインを Vercel のプロジェクトに割り当てないこと。
set -euo pipefail

DOMAIN="${1:-}"
GH_USER="yamaguchig5167-afk"

if [ -z "$DOMAIN" ]; then
  echo "使い方: bash scripts/setup-dns.sh <ドメイン>" >&2
  exit 1
fi

# GitHub Pages の配信元IP（4件すべて必要）
IPS=(185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153)

echo "対象ドメイン: $DOMAIN"
echo

echo "■ 既存レコードの確認"
vercel dns ls "$DOMAIN" || true
echo

echo "■ Aレコードを登録（apex）"
for ip in "${IPS[@]}"; do
  echo "  @ A $ip"
  vercel dns add "$DOMAIN" '@' A "$ip"
done
echo

echo "■ CNAMEを登録（www）"
vercel dns add "$DOMAIN" www CNAME "${GH_USER}.github.io"
echo

echo "■ 登録後の一覧"
vercel dns ls "$DOMAIN"
echo
echo "次: DNSが行き渡るまで待ってから"
echo "  node scripts/set-domain.mjs --check $DOMAIN"
echo "で確認し、✓ が出たら切り替える。"
