# 有限会社橋村運送 公式ホームページ

制作: YOHAKU Lab. / 山口 剛

---

## ファイル構成

```
hashimura-transport/
├── CLAUDE.md                  ← Claude Code 指示書（必読）
├── README.md                  ← このファイル
├── index.html                 ← トップページ（メイン）
├── css/
│   └── style.css              ← スタイルシート
├── js/
│   └── main.js                ← JavaScript（フォーム送信含む）
├── gas/
│   └── form-handler.gs        ← Google Apps Script（フォーム→メール）
├── images/
│   └── README.md              ← 画像差し替えガイド
└── .github/
    └── workflows/
        └── deploy.yml         ← GitHub Pages 自動デプロイ
```

---

## セットアップ手順

### 1. ローカル確認

```bash
# ブラウザで直接開くか、簡易サーバーを立てる
npx serve .
# または
python3 -m http.server 8000
```

### 2. フォーム送信（GAS）設定

1. [Google Apps Script](https://script.google.com/) を開く
2. 新しいプロジェクト作成（名前例：「橋村運送_フォーム」）
3. `gas/form-handler.gs` の内容をすべて貼り付ける
4. `SETTINGS.NOTIFY_EMAIL` が正しいか確認
5. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」
6. 実行者：**自分** / アクセス：**全員**
7. デプロイURLをコピー
8. `js/main.js` の `GAS_ENDPOINT` に貼り付け
9. `DEBUG_MODE: false` に変更

```javascript
// js/main.js
const CONFIG = {
  GAS_ENDPOINT: 'https://script.google.com/macros/s/AKfycb.../exec', // ← ここ
  DEBUG_MODE: false, // ← trueからfalseに変更
};
```

### 3. Googleマップ埋め込み

1. [Google Maps](https://maps.google.com) で住所を検索
2. 「共有」→「地図を埋め込む」→HTMLをコピー
3. `index.html` の `<div class="map-embed" id="map-honsha">` 内に貼り付け

```html
<!-- 変更前 -->
<div class="map-embed" id="map-honsha">
  🗺️ Googleマップを埋め込めます
</div>

<!-- 変更後 -->
<div class="map-embed" id="map-honsha" style="padding:0;">
  <iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>
</div>
```

### 4. 写真差し替え

1. `images/hero-bg.jpg` に実際の写真を配置
2. `css/style.css` の `.hero__bg` のコメントを外す（画像使用版に切り替え）

### 5. GitHub Pagesデプロイ

```bash
git init
git add .
git commit -m "初回コミット：有限会社橋村運送 公式サイト"
git remote add origin https://github.com/[ユーザー名]/hashimura-transport.git
git push -u origin main
```

GitHubリポジトリの Settings > Pages > Source: `main` に設定すると自動デプロイ。

---

## カスタマイズポイント

| 項目 | ファイル | 変更箇所 |
|------|----------|----------|
| 電話番号 | index.html | `096-355-0361` で検索 |
| メールアドレス | index.html / gas/ | `hashimura@dolphin.ocn.ne.jp` |
| カラー変更 | css/style.css | `:root` 内の変数 |
| フォーム送信先 | js/main.js | `GAS_ENDPOINT` |
| OGP画像 | index.html | `og:image` |
| サイトURL | index.html | `canonical` / `og:url` |
| 構造化データ | index.html | `application/ld+json` |

---

## 追加ページの作成（Claude Codeへの指示例）

```
CLAUDE.mdを読んで、以下のページを作成してください：
- services.html（事業内容詳細ページ）
- recruit.html（採用情報ページ）
- news.html（お知らせ一覧ページ）

デザインはindex.htmlと統一し、ヘッダー・フッターは共通化してください。
```

---

## 連絡先

制作・保守: YOHAKU Lab. / 山口 剛  
yamaguchi.g5167@gmail.com / 090-2505-7937
