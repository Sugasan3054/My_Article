/**
 * i18n (多言語対応) モジュール
 * - デフォルト言語: 英語 (en)
 * - 英語 / 日本語 の切り替え
 * - localStorage による言語設定の永続化
 */

export const translations = {
  en: {
    siteTitle: 'Tech Summary Hub',
    siteSubtitle: 'Curated summaries of next-generation tech articles & developer talks. Powered by in-browser AI.',
    navArticles: 'Articles',
    navSummarizer: 'AI Summarizer',
    navAbout: 'About',
    navCategories: 'Topics',
    searchPlaceholder: 'Search articles by keywords, tags, or topics...',
    sortBy: 'Sort by:',
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',
    filterByTag: 'Filter by Tag:',
    allTags: 'All',
    resultsCount: (n) => `Found ${n} article${n === 1 ? '' : 's'}.`,
    noArticlesFound: 'No articles found matching your criteria.',
    readTime: 'Quick Read',
    sourceLabelArticle: 'Article',
    sourceLabelVideo: 'Video',
    sourceLinkPrefix: 'Source',
    externalLinkAria: '(Opens in new tab)',
    tocTitle: 'Table of Contents',
    prevArticle: 'Previous Article',
    nextArticle: 'Next Article',
    backToArticles: 'Back to Articles',
    
    // Card Nav
    cardNavAboutTitle: 'Platform',
    cardNavAboutDesc: 'Privacy-first tech knowledge repository with zero-server AI summarization.',
    cardNavTopicsTitle: 'Popular Topics',
    cardNavToolsTitle: 'Quick Actions',
    cardNavActionNew: 'Create New Summary',
    cardNavActionGh: 'GitHub Repository',

    // Summarizer Tool
    summarizerTitle: 'WebLLM Article Summarizer',
    summarizerSubtitle: 'Run open-weight AI models locally inside your browser using WebGPU. Completely private with zero API costs.',
    securityNoteTitle: 'Static Site Architecture:',
    securityNoteBody: 'To maintain top security, no GitHub tokens are stored on the client. Generate your summary, download the Markdown file, and push it to your repository.',
    section1Title: '1. Enter Content Details',
    labelContentType: 'Content Type',
    typeArticle: 'Web Article',
    typeVideo: 'YouTube Video',
    labelSourceUrl: 'Source URL',
    helpSourceUrl: 'Enter the original article or YouTube URL.',
    labelSourceTitle: 'Original Title (Optional)',
    labelContentTextArticle: 'Article Text Content',
    labelContentTextVideo: 'YouTube Transcript Text',
    helpContentText: 'For YouTube videos, paste the transcript text copied from YouTube transcript viewer.',
    labelModelSelect: 'WebLLM Model',
    helpModelSelect: 'Initial run will cache the model weights inside your browser.',
    btnGenerateAi: 'Generate AI Summary (WebLLM)',
    btnQuickExtract: 'Quick Extract (Instant / No GPU)',
    progressLoading: 'Downloading & preparing model weights...',
    progressDone: 'Ready! Generating summary...',
    
    section2Title: '2. Review & Edit Generated Summary',
    labelEditTitle: 'Article Title',
    labelEditDate: 'Publish Date',
    labelEditSlug: 'Filename Slug',
    labelEditTags: 'Tags (Comma-separated)',
    labelEditSummary: 'Short Card Summary (2-3 lines)',
    labelEditBody: 'Summary Body (Markdown)',
    previewTitle: 'Live Markdown Preview:',
    btnDownloadMd: 'Download Markdown File',
    btnCopyMd: 'Copy Full Markdown',
    postDownloadSuccess: 'Markdown file downloaded successfully!',
    postDownloadStep1: 'Move the downloaded .md file into content/articles/',
    postDownloadStep2: 'Run `npm run build:index` in terminal to refresh index.',
    postDownloadStep3: 'Commit and push changes to update GitHub Pages.',
    
    webgpuWarningTitle: 'WebGPU is not supported in this browser.',
    webgpuWarningBody: 'To run in-browser WebLLM, please use the latest version of Chrome or Edge, or use the "Quick Extract" mode below.'
  },
  ja: {
    siteTitle: 'Tech Summary Hub',
    siteSubtitle: '次世代の技術記事・開発者セッションを厳選要約。ブラウザ内AIによるゼロサーバー要約ナレッジハブ。',
    navArticles: '記事一覧',
    navSummarizer: '要約ツール (自分用)',
    navAbout: 'サイト概要',
    navCategories: 'トピック',
    searchPlaceholder: 'キーワード、タグ、トピックで記事を検索...',
    sortBy: '並び替え:',
    sortNewest: '新着順',
    sortOldest: '古い順',
    filterByTag: 'タグで絞り込み:',
    allTags: 'すべて',
    resultsCount: (n) => `検索結果: ${n}件の記事が見つかりました。`,
    noArticlesFound: '該当する記事が見つかりませんでした。条件を変更してお試しください。',
    readTime: '要約',
    sourceLabelArticle: '記事',
    sourceLabelVideo: '動画',
    sourceLinkPrefix: '出典元',
    externalLinkAria: '（新しいタブで開く外部リンク）',
    tocTitle: '目次',
    prevArticle: '前の記事',
    nextArticle: '次の記事',
    backToArticles: '記事一覧に戻る',

    // Card Nav
    cardNavAboutTitle: 'プラットフォーム',
    cardNavAboutDesc: 'ブラウザ内AIでゼロサーバー要約を実現するプライバシー重視のナレッジベース。',
    cardNavTopicsTitle: '人気トピック',
    cardNavToolsTitle: 'クイック操作',
    cardNavActionNew: '新規要約を作成',
    cardNavActionGh: 'GitHub リポジトリ',

    // Summarizer Tool
    summarizerTitle: 'WebLLM 要約作成ツール (自分専用)',
    summarizerSubtitle: 'ブラウザ上でローカルLLM（WebGPU）を実行し、外部APIコスト不要・完全プライベートにMarkdown要約を生成します。',
    securityNoteTitle: '静的サイト運用フロー:',
    securityNoteBody: '静的サイトのセキュリティを維持するため、GitHub Token等の認証情報はフロントエンドに保持しません。要約生成後にMarkdownファイルをダウンロードし、リポジトリの content/articles/ に配置してコミットする運用です。',
    section1Title: '1. 要約対象の情報を入力',
    labelContentType: 'コンテンツの種別',
    typeArticle: 'Web技術記事',
    typeVideo: 'YouTube動画',
    labelSourceUrl: '出典URL',
    helpSourceUrl: '記事のURLまたはYouTube動画のURLを入力してください。',
    labelSourceTitle: '元の記事/動画タイトル (任意)',
    labelContentTextArticle: '記事の本文テキスト',
    labelContentTextVideo: 'YouTube 字幕テキスト',
    helpContentText: 'YouTube動画の場合は、YouTubeの「文字起こしを表示」からテキストをコピーして貼り付けてください。',
    labelModelSelect: 'WebLLM モデル',
    helpModelSelect: '初回実行時はブラウザ内にモデルのダウンロード（重みデータ）が行われます。',
    btnGenerateAi: 'WebLLMでAI要約を生成',
    btnQuickExtract: 'クイック抽出 (WebGPU不要・即時)',
    progressLoading: 'モデルデータをダウンロード・初期化中...',
    progressDone: 'モデルの準備が完了しました！要約を生成中...',
    
    section2Title: '2. 生成結果の確認 & 編集',
    labelEditTitle: '記事タイトル',
    labelEditDate: '日付 (YYYY-MM-DD)',
    labelEditSlug: 'ファイル名スラッグ',
    labelEditTags: 'タグ (カンマ区切り)',
    labelEditSummary: 'カード表示用要約 (2〜3行)',
    labelEditBody: '要約本文 (Markdown)',
    previewTitle: '本文プレビュー:',
    btnDownloadMd: 'Markdownファイルをダウンロード',
    btnCopyMd: '全文をクリップボードにコピー',
    postDownloadSuccess: 'ファイルのダウンロードが完了しました！',
    postDownloadStep1: 'ダウンロードした .md ファイルを content/articles/ フォルダに配置します。',
    postDownloadStep2: 'ターミナルで `npm run build:index` を実行し、一覧データを更新します。',
    postDownloadStep3: '変更をリポジトリにコミット＆プッシュすると、GitHub Pagesに反映されます。',
    
    webgpuWarningTitle: 'お使いのブラウザは WebGPU をサポートしていません。',
    webgpuWarningBody: 'WebLLMを実行するには、WebGPUが有効化された最新の Chrome, Edge をご利用いただくか、下記の「クイック抽出モード」をご利用ください。'
  }
};

class I18nManager {
  constructor() {
    // デフォルト言語は英語 ('en')
    this.currentLang = localStorage.getItem('site_lang') || 'en';
    this.listeners = [];
  }

  get lang() {
    return this.currentLang;
  }

  t(key, ...args) {
    const val = translations[this.currentLang]?.[key] || translations['en']?.[key] || key;
    if (typeof val === 'function') {
      return val(...args);
    }
    return val;
  }

  setLanguage(lang) {
    if (lang !== 'en' && lang !== 'ja') return;
    this.currentLang = lang;
    localStorage.setItem('site_lang', lang);
    document.documentElement.lang = lang;
    this.updateDOM();
    this.notify();
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang === 'en' ? 'ja' : 'en');
  }

  onLanguageChange(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentLang);
      } catch (e) {
        console.error(e);
      }
    });
  }

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    // スイッチトグルの同期
    const toggleInput = document.getElementById('lang-toggle-checkbox');
    if (toggleInput) {
      toggleInput.checked = this.currentLang === 'ja';
    }
    const langLabel = document.getElementById('lang-switch-label');
    if (langLabel) {
      langLabel.textContent = this.currentLang === 'en' ? 'EN' : 'JA';
    }
  }

  init() {
    document.documentElement.lang = this.currentLang;
    this.updateDOM();

    // スイッチトグル要素のイベントバインド
    const toggleInput = document.getElementById('lang-toggle-checkbox');
    if (toggleInput) {
      toggleInput.checked = this.currentLang === 'ja';
      toggleInput.addEventListener('change', (e) => {
        this.setLanguage(e.target.checked ? 'ja' : 'en');
      });
    }
  }
}

export const i18n = new I18nManager();
