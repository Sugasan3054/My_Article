# 技術記事要約サイト (Tech Summary Hub)

GitHub Pages で公開可能な、デジタル庁デザインシステムを参考にしたアクセシブルな技術記事・テック動画要約サイトです。

ブラウザ内 LLM（WebLLM / WebGPU）を活用し、外部 API キーやサーバーコストを一切使わずに要約 Markdown を生成・管理できます。

---

## 特徴

- **高速かつ軽量な静的サイト**: Vite + Vanilla HTML/CSS/JS で構成。GitHub Pages にそのままデプロイ可能。
- **デジタル庁デザインシステム準拠の UI**:
  - コントラスト比 4.5:1 以上を担保したライトブルー＆ディープブルーのカラー設計
  - ダークモード自動切替 (`prefers-color-scheme`)
  - 44px 以上のタップ領域、視認性の高いフォーカスリング、スキップリンク
  - `aria-live` を用いたアクセシブルな状態通知
- **Markdown ベースのコンテンツ管理**:
  - 記事データは `content/articles/` に配置された Markdown ファイルで管理
  - タイトル、要約、タグ、出典元、YouTube プレイヤー（遅延読み込み `youtube-nocookie.com`）、自動目次生成（見出し3つ以上）、前後ナビゲーション
- **WebLLM によるブラウザ完結型要約ツール (自分専用)**:
  - ブラウザの WebGPU を使用して端末上で LLM を直接実行
  - 記事本文や YouTube 字幕テキストから Markdown 要約を即座に生成
  - 生成結果をプレビュー・編集し、`YYYY-MM-DD-{slug}.md` 形式でダウンロード
- **安全なセキュリティ設計**:
  - GitHub Token や API キーをフロントエンドに一切保持しない設計
  - DOMPurify による徹底した XSS サニタイズ
  - 外部リンクへの `rel="noopener noreferrer"` 自動付与

---

## ディレクトリ構成

```text
My_Article/
├── .gitignore
├── README.md
├── package.json
├── vite.config.js
├── scripts/
│   └── build-index.js            # Markdownから content/index.json を生成
├── content/
│   ├── index.json                # 記事一覧メタデータ
│   └── articles/                 # 記事Markdown配置フォルダ
│       ├── 2026-08-10-gemini-flash-multimodal.md
│       └── 2026-08-15-webgpu-modern-web-llm.md
├── index.html                    # トップページ (記事一覧・検索・タグ絞り込み)
├── article.html                  # 記事詳細ページ
├── summarize.html                # WebLLM要約作成ツール (自分用)
└── src/
    ├── css/
    │   ├── tokens.css            # デジタル庁参考デザイントークン
    │   ├── base.css              # リセット・タイポグラフィ・アクセシビリティ
    │   └── components.css        # カード・目次・バッジ・フォーム
    └── js/
        ├── utils.js              # Markdownパース・DOMPurify・ヘルパー
        ├── articles.js           # 一覧・検索・フィルタ制御
        ├── detail.js             # 詳細表示・目次・YouTube埋め込み・前後ナビ
        └── summarizer.js         # WebLLM要約エンジン・進捗・ダウンロード
```

---

## セットアップとローカル開発

### 1. 依存関係のインストール
```bash
cd My_Article
npm install
```

### 2. 記事インデックスの生成
```bash
npm run build:index
```

### 3. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで `http://localhost:5173/` が開きます。

---

## 記事の追加方法

本サイトは静的サイトとして安全に運用するため、**「WebLLMで生成 → ダウンロード → リポジトリに追加」** という手動運用フローを採用しています。

### 手順
1. ローカルサーバー起動後、ナビゲーションの **「要約ツール (自分用)」** (`/summarize.html`) にアクセスします。
2. コンテンツ種別（記事 または YouTube動画）を選択し、URLと本文（または字幕テキスト）を入力します。
3. **「要約を生成する」** をクリックします（初回はモデルダウンロードが行われます）。
4. 生成結果をプレビューし、必要に応じてタイトルやタグを調整します。
5. **「Markdownファイルをダウンロード」** をクリックします。
6. ダウンロードされたファイル（例: `2026-08-16-my-article.md`）を `content/articles/` フォルダに移動します。
7. 以下のコマンドでインデックスを更新します:
   ```bash
   npm run build:index
   ```
8. 記事一覧に新着記事が反映されます。

---

## GitHub Pages への公開手順

### 方法 1: GitHub Actions による自動デプロイ（推奨）

リポジトリの `.github/workflows/deploy.yml` に以下を配置します:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build site
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

リポジトリ設定の **Settings > Pages > Build and deployment > Source** で **「GitHub Actions」** を選択すると、コミット時に自動ビルド＆公開されます。

### 方法 2: 手動ビルドして `dist` を公開する場合
```bash
npm run build
```
生成された `dist/` フォルダの内容を `gh-pages` ブランチにプッシュして公開します。

---

## セキュリティとプライバシーについて

- **API キー不要**: WebLLM はブラウザ内 WebGPU で動作するため、OpenAI や Anthropic の API キーを設定・公開する必要はありません。
- **データ送信ゼロ**: 要約処理はすべてクライアント端末上で実行され、外部サーバーにテキストが送信されることはありません。
- **XSS 対策**: ユーザー入力および Markdown 描画にはすべて `DOMPurify` によるサニタイズ処理が適用されています。
