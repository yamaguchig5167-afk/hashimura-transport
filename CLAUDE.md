# 有限会社橋村運送 公式サイト — Claude Code プロジェクト

## プロジェクト概要

有限会社橋村運送の公式ホームページ。
電柱輸送・電力インフラ資材輸送に特化した熊本の運送会社。

**公開URL（予定）**: GitHub Pages (`hashimura-transport.github.io` 等)
**制作担当**: YOHAKU Lab. / 山口 剛

---

## ディレクトリ構成

```
hashimura-transport/
├── CLAUDE.md              # このファイル（Claude Codeへの指示書）
├── README.md              # セットアップ・デプロイ手順
├── index.html             # トップページ
├── css/
│   └── style.css          # メインスタイルシート
├── js/
│   └── main.js            # メインJavaScript
├── gas/
│   └── form-handler.gs    # Google Apps Script（フォーム送信処理）
├── images/
│   ├── README.md          # 画像差し替えガイド
│   └── (差し替え用プレースホルダー)
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Pages 自動デプロイ
```

---

## 会社情報（編集禁止・要確認）

```
会社名    : 有限会社 橋村運送
代表者    : 代表取締役社長 橋村 直樹（Naoki Hashimura）
本社      : 〒860-0047 熊本県熊本市西区春日7-13-7
本社TEL   : 096-355-0361
本社FAX   : 096-355-0363
大津営業所: 〒869-1236 熊本県菊池郡大津町杉水3533
大津TEL   : 096-284-5007
大津FAX   : 096-284-5008
メール    : hashimura@dolphin.ocn.ne.jp
従業員    : 20名
車両      : 20台（平ボディ車・ユニック車 等）
エリア    : 九州内を中心に対応
```

---

## デザインシステム

```css
/* カラーパレット */
--blue-primary : #0B5CAD   /* メインブルー */
--blue-dark    : #08407A   /* ダークブルー */
--blue-deeper  : #052D57   /* 最深ブルー */
--blue-light   : #EAF3FB   /* 薄いブルー背景 */
--white        : #FFFFFF
--slate-dark   : #1E2A36   /* フッター・重要テキスト */
--slate-mid    : #6B7C8F   /* サブテキスト */
--accent-gold  : #C8A84B   /* アクセントゴールド */
--bg-light     : #F5F8FB   /* セクション背景 */

/* フォント */
--font-jp      : 'Noto Sans JP', sans-serif
--font-jp-serif: 'Noto Serif JP', serif
--font-en      : 'Oswald', sans-serif
```

---

## 開発ルール（Claude Code への指示）

### 基本原則
- **会社情報は絶対に変更しない**（電話番号・住所・代表者名）
- デザインカラーはパレット変数を使用すること
- モバイルファーストで実装する
- コメントは日本語で記載する

### HTML
- セマンティックHTMLを使用（section, article, nav, footer等）
- SEO用 meta タグは維持する
- OGPタグ（og:title, og:description, og:image）を追加すること
- 構造化データ（LocalBusiness JSON-LD）を追加すること

### CSS
- BEMライクな命名規則を使用
- CSS変数（:root）を積極活用
- メディアブレークポイント: 600px / 900px / 1200px

### JavaScript
- バニラJSのみ（フレームワーク不要）
- フォーム送信はGASエンドポイントにfetch POST
- エラーハンドリングを必ず実装する

### フォーム（GAS連携）
- `gas/form-handler.gs` をデプロイしてエンドポイントURLを取得
- `js/main.js` の `GAS_ENDPOINT` 定数を差し替える
- 送信成功・失敗のフィードバックを必ずユーザーに表示する

### 画像
- `images/` フォルダに配置
- ヒーロー画像: `hero-bg.jpg` （1920×1080px 推奨）
- OGP画像: `ogp.jpg` （1200×630px 推奨）
- alt テキストは必ず日本語で記述する

---

## よく依頼される追加タスク

| タスク | 対応方法 |
|--------|----------|
| 事業内容詳細ページ追加 | `services.html` を新規作成、index.htmlからリンク |
| 採用情報ページ追加 | `recruit.html` を新規作成 |
| ブログ/お知らせ機能 | `news/` ディレクトリ、`news.html` を作成 |
| Googleマップ差し替え | `index.html` の `<!-- GOOGLE MAP -->` コメント箇所 |
| ヒーロー写真差し替え | `images/hero-bg.jpg` を配置、CSSのbg-imageを更新 |
| フォームGAS接続 | `gas/form-handler.gs` をGASにペースト→デプロイ→URLをmain.jsに記述 |

---

## デプロイ手順（GitHub Pages）

1. GitHubリポジトリ作成（`hashimura-transport` 等）
2. このフォルダをpush
3. Settings > Pages > Source: `main` ブランチ `/root`
4. 自動デプロイ（`.github/workflows/deploy.yml` で管理）

---

## 連絡先（制作担当）

YOHAKU Lab. 山口 剛
yamaguchi.g5167@gmail.com / 090-2505-7937
