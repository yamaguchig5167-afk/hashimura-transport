# 有限会社橋村運送 公式サイト — Claude Code プロジェクト

## プロジェクト概要

有限会社橋村運送の公式ホームページ。
電柱輸送・電力インフラ資材輸送に特化した熊本の運送会社。

**公開URL**: https://yamaguchig5167-afk.github.io/hashimura-transport/
**制作担当**: ソルエイト株式会社

---

## ディレクトリ構成

```
hashimura-transport/
├── CLAUDE.md              # このファイル（Claude Codeへの指示書）
├── README.md              # セットアップ・デプロイ手順
├── robots.txt             # クローラ設定
├── sitemap.xml            # サイトマップ（ページ追加時は必ず追記）
├── index.html             # トップページ
├── services.html          # 事業内容
├── recruit.html           # 採用情報
├── news.html              # お知らせ
├── pilot-car.html         # 先導車事業部
├── yard-operations.html   # 出荷ヤード作業事業部
├── kasuga-logistics.html  # 【旧URL】yard-operations.html への転送用
├── fleet-hashimura.html   # 【旧URL】pilot-car.html への転送用
├── css/
│   └── style.css          # メインスタイルシート（全ページ共通）
├── js/
│   └── main.js            # メインJavaScript
├── gas/
│   └── form-handler.gs    # Google Apps Script（フォーム送信処理）
├── favicon.ico            # ファビコン
├── images/                # 実車両写真一式（詳細は images/README.md）
│   ├── favicon.svg / ogp.jpg
│   ├── hero-fleet.jpg / pilot-car.jpg / yard-poles.jpg
│   ├── fleet-lineup.jpg / fleet-unic.jpg / safety-bg.jpg
│   └── README.md          # 画像ガイド
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

### 事業部の所在地と業務範囲（2026-09-05 クライアント確認済み・推測で書かない）

| 事業部 | 所在地 | 問い合わせ |
|---|---|---|
| 先導車事業部 | **大津営業所内**（菊池郡大津町杉水3533） | 本社 096-355-0361 |
| 出荷ヤード作業事業部 | **大津営業所内**（同上） | 本社 096-355-0361 |

**出荷ヤード作業事業部が行うのは、出荷ヤード作業・荷積み・荷締め・出発前の安全確認のみ。**
在庫管理・出荷記録・出庫管理は**お客様の工場側**の業務であり、当社は行わない。
ヤードは**お客様の工場のヤード**であって、当社が在庫を保有しているわけではない。
「ヤード作業」という言葉から在庫管理・受入検査・棚卸まで書いてしまう誤りを一度起こしているので、
この事業部の説明を書くときは上記の範囲を超えないこと。

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
- **旧グループ会社名をサイト上に出さない**（2026-08-24 クライアント指示）
  - 「合同会社物流ハシムラ」→ **先導車事業部**（`pilot-car.html`）
  - 「有限会社春日物流」→ **出荷ヤード作業事業部**（`yard-operations.html`）
  - 「グループ事業／グループ会社」という区分も使わず、**橋村運送の事業部**として記載する
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
- `js/main.js` の `GAS_ENDPOINT` 定数を差し替える（判定は `isGasConfigured()` が自動で行う）
- 送信成功・失敗のフィードバックを必ずユーザーに表示する
- **禁止：送信が実際に行われていない状態で「受け付けました」と表示すること。**
  GAS未設定時は `openMailFallback()` でメール作成画面を開き、その旨を正直に案内する

### 画像
- `images/` フォルダに配置。詳細と注意事項は `images/README.md` が正
- alt テキストは必ず日本語で記述する
- 公開前に必ず EXIF を削除する（`magick ... -strip`）
- **車体に「物流ハシムラ」が明瞭に読める写真は使わない**（事業部表記に統一しているため）
- **従業員の顔が判別できる写真は、本人の同意が確認できるまで使わない**
- 取引先の社名・ロゴの写り込みがないか確認する

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

ソルエイト株式会社
g.yamaguchi@sol8-co.com / 090-2505-7937
