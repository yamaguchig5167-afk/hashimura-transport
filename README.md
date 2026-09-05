# 有限会社橋村運送 公式ホームページ

熊本を拠点に電柱・電力インフラ資材輸送を行う「有限会社橋村運送」の公式サイト。
静的HTML／CSS／バニラJSのみで構成し、GitHub Pages で公開している。

> **表記ルール（2026-08-24〜）**
> 旧「合同会社物流ハシムラ」「有限会社春日物流」は、**有限会社橋村運送の事業部**として表記する。
> - 合同会社物流ハシムラ → **先導車事業部**（`pilot-car.html`）
> - 有限会社春日物流 → **出荷ヤード作業事業部**（`yard-operations.html`）
>
> サイト上に旧社名を出さない。新規ページ作成時も同様。

- 公開URL: https://yamaguchig5167-afk.github.io/hashimura-transport/
- 制作・保守: ソルエイト株式会社

---

## ファイル構成

```
hashimura-transport/
├── CLAUDE.md                  ← Claude Code 指示書（会社情報・開発ルール）
├── README.md                  ← このファイル
├── robots.txt                 ← クローラ設定
├── sitemap.xml                ← サイトマップ（ページ追加時は要更新）
│
├── index.html                 ← トップページ
├── services.html              ← 事業内容
├── recruit.html               ← 採用情報
├── news.html                  ← お知らせ
├── pilot-car.html             ← 先導車事業部
├── yard-operations.html       ← 出荷ヤード作業事業部
├── kasuga-logistics.html      ← 【旧URL】yard-operations.html への転送用（1年後に削除可）
├── fleet-hashimura.html       ← 【旧URL】pilot-car.html への転送用（1年後に削除可）
│
├── css/style.css              ← スタイルシート（全ページ共通）
├── js/main.js                 ← JavaScript（フォーム送信・アニメーション）
├── gas/form-handler.gs        ← Google Apps Script（フォーム→メール）
├── favicon.ico                ← ファビコン（ブラウザ既定の要求先）
├── images/                    ← 実車両写真一式。詳細は images/README.md
│   ├── favicon.svg  ogp.jpg
│   ├── hero-fleet.jpg  pilot-car.jpg  yard-poles.jpg
│   ├── fleet-lineup.jpg  fleet-unic.jpg  safety-meeting.jpg
│   └── README.md              ← 画像ガイド（社名の写り込み等の注意あり）
└── .github/workflows/deploy.yml ← GitHub Pages 自動デプロイ
```

---

## ローカル確認

```bash
npx serve .
```

ブラウザで `http://localhost:3000` を開く。ビルド工程は無い。

---

## お問い合わせフォームの状態

**現在、Google Apps Script（GAS）は未設定です。**
`js/main.js` の `GAS_ENDPOINT` が初期値のままの間、フォームは以下の挙動になります。

| 状態 | 挙動 |
|---|---|
| GAS未設定（現在） | 入力内容を本文に差し込んだ**メール作成画面を自動で開く**（`hashimura@dolphin.ocn.ne.jp` 宛）。画面には「メールソフトを起動しました」と案内を表示する |
| GAS設定済み | GASへPOST送信し、担当者への通知メール＋送信者への自動返信メールを送る |

> 未設定の状態で「受け付けました」という**偽の成功表示は出しません**。
> 問い合わせが届かないまま完了したように見えるのを防ぐための仕様です。

### GASを有効にする手順

1. [Google Apps Script](https://script.google.com/) で新規プロジェクトを作成（例：「橋村運送_フォーム」）
2. `gas/form-handler.gs` の内容をすべて貼り付ける
3. `SETTINGS.NOTIFY_EMAIL` が `hashimura@dolphin.ocn.ne.jp` になっているか確認
4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」
   - 実行者：**自分**
   - アクセスできるユーザー：**全員**
5. 発行されたデプロイURLをコピー
6. `js/main.js` の `GAS_ENDPOINT` に貼り付ける

```javascript
// js/main.js
const CONFIG = {
  GAS_ENDPOINT: 'https://script.google.com/macros/s/AKfycb.../exec', // ← ここ
  CONTACT_EMAIL: 'hashimura@dolphin.ocn.ne.jp',
  CONTACT_TEL: '096-355-0361',
};
```

7. コミットしてpushすれば自動デプロイされる（設定判定は自動：`isGasConfigured()`）

---

## デプロイ

`main` ブランチへpushすると `.github/workflows/deploy.yml` により GitHub Pages へ自動デプロイされる。

```bash
git add .
git commit -m "変更内容"
git push
```

---

## カスタマイズポイント

| 項目 | ファイル | 変更箇所 |
|------|----------|----------|
| 電話番号 | 各HTML | `096-355-0361` で検索 |
| メールアドレス | 各HTML / js / gas | `hashimura@dolphin.ocn.ne.jp` |
| カラー変更 | css/style.css | `:root` 内の変数 |
| フォーム送信先 | js/main.js | `GAS_ENDPOINT` |
| OGP画像 | images/ogp.png | 差し替え（1200×630） |
| サイトURL | 各HTML | `canonical` / `og:url` / sitemap.xml |
| 構造化データ | index.html | `application/ld+json` |
| Googleマップ | index.html | `map-embed` 内のiframe（設定済み） |

---

## 未対応・今後の候補

- [ ] GASフォーム連携の有効化（上記手順）
- [ ] ヒーロー背景に実写真を使用する場合の差し替え（`images/README.md` 参照）
- [ ] 独自ドメイン取得とCNAME設定（現在は GitHub Pages の既定URL）
- [ ] `news.html` の記事追加運用ルールの決定

---

## 連絡先

制作・保守: ソルエイト株式会社
g.yamaguchi@sol8-co.com / 090-2505-7937
