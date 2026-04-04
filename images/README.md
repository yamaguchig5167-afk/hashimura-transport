# imagesフォルダ — 画像差し替えガイド

## 配置する画像ファイル一覧

| ファイル名 | 推奨サイズ | 用途 |
|---|---|---|
| `hero-bg.jpg` | 1920×1080px | ヒーロー背景写真（トラック・現場写真）|
| `ogp.jpg` | 1200×630px | SNSシェア時のOGP画像 |
| `truck-01.jpg` | 800×600px | 事業内容・強みセクション用 |
| `truck-02.jpg` | 800×600px | ギャラリー用 |
| `site-logo.svg` | SVG | 会社ロゴ（あれば） |

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

## OGP画像を設定する手順

`ogp.jpg` を配置後、`index.html` の head 内を確認：

```html
<meta property="og:image" content="https://[your-domain]/images/ogp.jpg">
```

## おすすめの写真素材

- 実際の車両写真（ユニック車・平ボディ車）
- 電柱を積載したトラックの写真
- 現場での作業風景
- 熊本市内・大津町の風景（地域密着感）

著作権・肖像権には十分注意してください。
