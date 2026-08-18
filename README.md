# Tech Summary Hub 🚀

ブラウザ内 AI（WebLLM / WebGPU）による**ゼロサーバー・完全プライベート**な技術記事・YouTube動画の要約ナレッジポータルです。
GitHub Pages や Vercel 等の静的ホスティングで完全無料で運用できます。

---

## 🌟 特徴

- **In-Browser WebLLM / WebGPU 要約**: 外部APIキー不要、通信コストゼロ、サーバーへのデータ送信なしで完全ローカル推論。
- **モダンなインタラクション & UI**:
  - **Card Nav**: GSAP Timeline による滑らかな展開・タグ絞り込みメニュー（AI・セキュリティ・開発）。
  - **Split Text**: 単語単位のタイポグラフィアニメーション。
  - **Aurora WebGL Background**: OGL ベースの美しいオーロラ背景シェーダー。
  - **英語 (EN) / 日本語 (JA) リアルタイム切替**: ナビ右上のスイッチで即座に多言語切り替え。
  - **ワイド・フルスクリーン対応**: 画面サイズに柔軟にフィットする左右対称な記事カードグリッド。

---

## ⚖️ 著作権・コンテンツの取り扱いおよび公開ポリシー (Legal & Copyright)

本リポジトリおよび公開サイト（GitHub Pages / Vercel 等）における技術記事・YouTube動画の要約データの取り扱い方針は以下の通りです。

### 1. 著作権法（引用・要約）およびフェアユースの遵守
- **主従関係とオリジナリティ**: 本サイトで公開されている Markdown ファイルは、元のコンテンツをそのまま転載・複製したものではなく、技術の学習・研究・普及を目的として AI および人間により独自に構造化・再編集された「要約・解説（二次的成果物）」です。
- **引用の正当性（著作権法第32条 / 米フェアユース規定）**: 元の著作物の市場価値を損なわず、むしろ一次ソースへのアクセスを促進する批評・紹介の範囲内で運用されています。

### 2. 出典の明記と導線確保
- すべての要約記事において、元の記事タイトル・動画タイトル、および**一次情報源への直接リンク（URL）を明記**しています。
- YouTube 動画の再生は、YouTube 利用規約に準拠した公式 iframe 埋め込みプレイヤー（`youtube-nocookie.com`）を使用しており、動画著作者の再生回数や広告収益に寄与する設計となっています。

### 3. オプトアウト（削除要請）ポリシー
- 原著作者様・権利者様からの要請があった場合は、速やかに該当する要約記事および関連ファイルの削除・非公開化対応を行います。
- 削除依頼・ご相談は、本リポジトリの [Issues](https://github.com/Sugasan3054/My_Article/issues) にて受け付けております。

---

## 🚀 開発・ローカル実行

```bash
# 依存パッケージのインストール
npm install

# 記事インデックスのビルド
npm run build:index

# 開発サーバーの起動 (ローカルWi-Fi経由でスマホ等からもアクセス可能)
npm run dev -- --host

# プロダクションビルド
npm run build
```

---

## 🛠️ 技術スタック

- **Core**: HTML5, Vanilla JavaScript (ES Modules), CSS (Vanilla + Design Tokens)
- **Animation & Graphics**: GSAP (Timeline, SplitText), OGL (WebGL 2.0 Shader)
- **Local AI**: `@mlc-ai/web-llm` (WebGPU / Web Worker)
- **Build Tool**: Vite (MPA Architecture)
