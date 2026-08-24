# imagesフォルダ — 画像差し替えガイド

## 配置する画像ファイル一覧

| ファイル名 | 推奨サイズ | 用途 | 状態 |
|---|---|---|---|
| `favicon.svg` | SVG | ファビコン | ✅ 配置済み |
| `ogp.png` | 1200×630px | SNSシェア時のOGP画像 | ✅ 配置済み（実写真が用意でき次第差し替え推奨）|
| `truck-unic.png` | — | ユニック車イラスト（ヒーロー・車両紹介） | ✅ 配置済み |
| `hero-bg.jpg` | 1920×1080px | ヒーロー背景写真（トラック・現場写真）| ⬜ 未配置（現在はグラデーション）|
| `truck-01.jpg` | 800×600px | 事業内容・強みセクション用 | ⬜ 未配置 |
| `site-logo.svg` | SVG | 会社ロゴ（あれば） | ⬜ 未配置（現在はインラインSVG）|

## ヒーロー背景写真を差し替える手順

1. `hero-bg.jpg` をこのフォルダに配置する
2. `css/style.css` の該当箇所のコメントを外す：

```css
/* ↓ このコメントブロックを有効にする */
.hero__bg {
  background-image:
    linear-gradient(135deg, rgba(5,45,87,0.88) 0%, rgba(11,92,173,0.72) 100%),
    url('../images/hero-bg.jpg');
  background-size: cover;
  background-position: center;
}
```

3. その上にある無地グラデーションの定義は削除またはコメントアウトする

## OGP画像を差し替える手順

`ogp.png`（1200×630px）を上書き配置するだけでよい。
全ページの head が既に `images/ogp.png` を参照している。

```html
<meta property="og:image" content="https://yamaguchig5167-afk.github.io/hashimura-transport/images/ogp.png">
```

> 差し替え後は、SNS側のキャッシュを更新するため
> [Facebook シェアデバッガー](https://developers.facebook.com/tools/debug/) で再取得すること。

## おすすめの写真素材

- 実際の車両写真（ユニック車・平ボディ車）
- 電柱を積載したトラックの写真
- 現場での作業風景
- 熊本市内・大津町の風景（地域密着感）

著作権・肖像権には十分注意してください。
