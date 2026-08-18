/**
 * i18n (多言語対応) モジュール
 * - デフォルト言語: 英語 (en)
 * - 英語 / 日本語 の切り替え
 * - localStorage による言語設定の永続化
 */

export const translations = {
  en: {
    siteTitle: 'Tech Summary Hub',
    siteSubtitle: 'Curated summaries of next-generation tech articles & developer talks. Powered by Gemini AI.',
    siteDescription: 'A high-performance static knowledge hub covering modern AI, Web architecture, cloud security, and developer tools. Summaries are powered by Google Gemini API with zero server storage and 100% client-side privacy.',
    scrollDown: 'Scroll down to explore summaries',
    navArticles: 'Articles',
    navSummarizer: 'AI Summarizer',
    searchPlaceholder: 'Search articles...',
    sortBy: 'Sort by:',
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',
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
    
    // Card Nav 3項目
    cardNavAiTitle: 'AI & LLM',
    cardNavAiDesc: 'Large language models, Gemini, multimodal architectures, and intelligent systems.',
    cardNavSecurityTitle: 'Security',
    cardNavSecurityDesc: 'Web application security, XSS prevention, zero-trust architectures, and privacy.',
    cardNavDevTitle: 'Development',
    cardNavDevDesc: 'WebGPU, modern frontend engineering, performance optimization, and system design.',

    // Gemini API & Summarizer Tool
    summarizerTitle: 'Gemini AI Article Summarizer',
    summarizerSubtitle: 'Fast, high-quality technical summaries powered by Google Gemini API. Completely client-side with zero server storage.',
    apiKeySectionTitle: 'Gemini API Key Settings (BYOK)',
    apiKeyLabel: 'Your Gemini API Key',
    apiKeyPlaceholder: 'AIzaSy...',
    apiKeyHelp: 'Get a free API key from Google AI Studio. Your key is stored exclusively in your browser localStorage and is never uploaded anywhere.',
    apiKeySaveBtn: 'Save Key',
    apiKeyClearBtn: 'Clear Key',
    apiKeySavedStatus: 'API Key is configured and ready.',
    apiKeyMissingStatus: 'No API Key configured. Please enter your key above.',
    apiKeySavedAlert: 'API Key saved successfully in your local browser.',
    apiKeyClearedAlert: 'API Key removed from browser storage.',
    
    securityNoteTitle: 'Zero-Leak Security & Cost Protection:',
    securityNoteBody: 'Your API key is never exposed to GitHub or Vercel. A client-side rate limit (max 3 calls/min) and character guard prevent accidental overuse.',
    
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
    labelModelSelect: 'Gemini Model',
    helpModelSelect: 'Gemini 1.5 Flash is fast and included in the free tier of Google AI Studio.',
    btnGenerateAi: 'Generate Summary (Gemini API)',
    btnQuickExtract: 'Quick Extract (Instant / No API)',
    progressLoading: 'Connecting to Gemini API...',
    progressDone: 'Summary generated successfully!',
    
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
    postDownloadStep3: 'Commit and push changes to update GitHub Pages / Vercel.'
  },
  ja: {
    siteTitle: 'Tech Summary Hub',
    siteSubtitle: '次世代の技術記事・開発者セッションを厳選要約。Gemini AIによるゼロサーバー要約ナレッジハブ。',
    siteDescription: '最先端のAI、Webアーキテクチャ、セキュリティ、開発者向けツールを網羅したナレッジポータルです。Google Gemini APIにより高品質な要約を完全クライアントサイド（ゼロサーバー）で生成・管理できます。',
    scrollDown: 'スクロールして記事一覧を見る',
    navArticles: '記事一覧',
    navSummarizer: '要約ツール (自分用)',
    searchPlaceholder: '記事を検索...',
    sortBy: '並び替え:',
    sortNewest: '新着順',
    sortOldest: '古い順',
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

    // Card Nav 3項目
    cardNavAiTitle: 'AI',
    cardNavAiDesc: '大規模言語モデル (LLM)、Gemini、マルチモーダル、インテリジェントシステム。',
    cardNavSecurityTitle: 'セキュリティ',
    cardNavSecurityDesc: 'Webアプリケーション脆弱性対策、XSSサニタイズ、ゼロトラスト、プライバシー設計。',
    cardNavDevTitle: '開発 (ソフトウェア)',
    cardNavDevDesc: 'WebGPU、モダンフロントエンド、パフォーマンス最適化、システム設計。',

    // Gemini API & Summarizer Tool
    summarizerTitle: 'Gemini AI 要約作成ツール (自分専用)',
    summarizerSubtitle: 'Google Gemini API を活用し、長文の技術記事やYouTube動画から高品質なMarkdown要約を即座に生成します。',
    apiKeySectionTitle: 'Gemini API Key 設定 (BYOK方式)',
    apiKeyLabel: 'Gemini API キー',
    apiKeyPlaceholder: 'AIzaSy...',
    apiKeyHelp: 'Google AI Studioから無料枠のAPIキーを取得して入力してください。キーはお使いのブラウザ（localStorage）にのみ保存され、Gitや外部サーバーには一切送信されません。',
    apiKeySaveBtn: 'キーを保存',
    apiKeyClearBtn: 'キーを削除',
    apiKeySavedStatus: 'APIキーが保存されています（準備完了）',
    apiKeyMissingStatus: 'APIキーが設定されていません。上記から入力してください。',
    apiKeySavedAlert: 'APIキーをブラウザ内に安全に保存しました。',
    apiKeyClearedAlert: 'APIキーをブラウザから削除しました。',
    
    securityNoteTitle: '漏洩防止 & 不当課金ガードレール:',
    securityNoteBody: 'APIキーはGitHubやVercelに一切保持されません。また、意図せぬ連続実行を防ぐレートリミット（最大3回/分）と入力文字数ガードが組み込まれています。',
    
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
    labelModelSelect: 'Gemini モデル',
    helpModelSelect: 'Gemini 1.5 Flash は Google AI Studio の無料枠内で超高速に利用可能です。',
    btnGenerateAi: 'Gemini APIで要約を生成',
    btnQuickExtract: 'クイック抽出 (API不要・即時)',
    progressLoading: 'Gemini API に接続中...',
    progressDone: '要約の生成が完了しました！',
    
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
    postDownloadStep3: '変更をリポジトリにコミット＆プッシュすると、GitHub Pages / Vercelに反映されます。'
  }
};

class I18nManager {
  constructor() {
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
