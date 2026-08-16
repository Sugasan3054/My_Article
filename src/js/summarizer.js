import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { extractYouTubeId, slugify, renderMarkdown } from './utils.js';

// 推奨モデル定義
const AVAILABLE_MODELS = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5-1.5B (推奨・日本語対応・高速)',
    size: '約1.1 GB',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama-3.2-1B (軽量・高速)',
    size: '約800 MB',
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    name: 'Gemma-2-2B (高品質・Google製)',
    size: '約1.6 GB',
  },
];

class SummarizerApp {
  constructor() {
    this.engine = null;
    this.currentModelId = AVAILABLE_MODELS[0].id;
    this.isGenerating = false;
    this.isLoadingEngine = false;

    // DOM要素
    this.webgpuWarning = document.getElementById('webgpu-warning');
    this.sourceTypeInputs = document.querySelectorAll('input[name="source-type"]');
    this.videoFields = document.getElementById('video-fields');
    this.articleFields = document.getElementById('article-fields');
    this.modelSelect = document.getElementById('model-select');
    this.btnGenerate = document.getElementById('btn-generate');
    
    // 入力要素
    this.sourceUrlInput = document.getElementById('source-url');
    this.sourceTitleInput = document.getElementById('source-title');
    this.sourceContentInput = document.getElementById('source-content');
    
    // プログレス要素
    this.progressSection = document.getElementById('progress-section');
    this.progressBar = document.getElementById('progress-bar');
    this.progressStatus = document.getElementById('progress-status');
    this.progressPercent = document.getElementById('progress-percent');
    
    // プレビュー・編集要素
    this.previewSection = document.getElementById('preview-section');
    this.editTitle = document.getElementById('edit-title');
    this.editDate = document.getElementById('edit-date');
    this.editTags = document.getElementById('edit-tags');
    this.editSlug = document.getElementById('edit-slug');
    this.editSummary = document.getElementById('edit-summary');
    this.editBody = document.getElementById('edit-body');
    this.markdownPreviewRender = document.getElementById('markdown-preview-render');
    this.btnDownload = document.getElementById('btn-download');
    this.btnCopy = document.getElementById('btn-copy');

    this.init();
  }

  async init() {
    this.checkWebGPUSupport();
    this.populateModelSelect();
    this.setupEventListeners();
    this.setDefaultDate();
  }

  setDefaultDate() {
    if (this.editDate) {
      const today = new Date().toISOString().split('T')[0];
      this.editDate.value = today;
    }
  }

  async checkWebGPUSupport() {
    if (!navigator.gpu) {
      if (this.webgpuWarning) {
        this.webgpuWarning.style.display = 'flex';
      }
      if (this.btnGenerate) {
        this.btnGenerate.disabled = true;
      }
    }
  }

  populateModelSelect() {
    if (!this.modelSelect) return;
    this.modelSelect.innerHTML = AVAILABLE_MODELS.map(
      (m) => `<option value="${m.id}">${m.name} (${m.size})</option>`
    ).join('');
  }

  setupEventListeners() {
    // 入力タイプの切り替え
    this.sourceTypeInputs.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const type = e.target.value;
        const isVideo = type === 'video';
        if (this.videoFields) this.videoFields.style.display = isVideo ? 'block' : 'none';
        if (this.articleFields) this.articleFields.style.display = isVideo ? 'none' : 'block';

        const contentLabel = document.getElementById('content-label');
        if (contentLabel) {
          contentLabel.textContent = isVideo ? 'YouTube 字幕テキスト' : '記事の本文テキスト';
        }
      });
    });

    // モデル変更
    if (this.modelSelect) {
      this.modelSelect.addEventListener('change', (e) => {
        this.currentModelId = e.target.value;
        this.engine = null; // モデル切り替え時はエンジン再ロード
      });
    }

    // 生成開始ボタン
    if (this.btnGenerate) {
      this.btnGenerate.addEventListener('click', () => this.handleGenerate());
    }

    // プレビュー編集時のリアルタイムMarkdownレンダリング反映
    if (this.editBody) {
      this.editBody.addEventListener('input', () => {
        this.updateMarkdownPreview();
      });
    }

    // Markdownダウンロードボタン
    if (this.btnDownload) {
      this.btnDownload.addEventListener('click', () => this.downloadMarkdown());
    }

    // クリップボードコピーボタン
    if (this.btnCopy) {
      this.btnCopy.addEventListener('click', () => this.copyToClipboard());
    }
  }

  async initEngine() {
    if (this.engine) return this.engine;

    this.isLoadingEngine = true;
    this.showProgress(0, 'WebLLM モデルのダウンロード・初期化を開始しています...（初回は数分かかります）');

    const initProgressCallback = (report) => {
      const progress = Math.round(report.progress * 100);
      this.showProgress(progress, report.text || 'ロード中...');
    };

    try {
      this.engine = await CreateMLCEngine(this.currentModelId, {
        initProgressCallback,
      });
      this.showProgress(100, 'モデルの準備が完了しました！');
      return this.engine;
    } catch (err) {
      console.error('Failed to load WebLLM model:', err);
      this.showProgress(0, `モデルの読み込みに失敗しました: ${err.message}`, true);
      throw err;
    } finally {
      this.isLoadingEngine = false;
    }
  }

  showProgress(percent, text, isError = false) {
    if (!this.progressSection) return;
    this.progressSection.style.display = 'block';
    if (this.progressBar) this.progressBar.style.width = `${percent}%`;
    if (this.progressPercent) this.progressPercent.textContent = `${percent}%`;
    if (this.progressStatus) {
      this.progressStatus.textContent = text;
      this.progressStatus.style.color = isError ? 'var(--color-error-text)' : 'inherit';
    }
  }

  async handleGenerate() {
    const rawContent = (this.sourceContentInput?.value || '').trim();
    if (!rawContent) {
      alert('本文または字幕テキストを入力してください。');
      return;
    }

    const sourceType = document.querySelector('input[name="source-type"]:checked')?.value || 'article';
    const sourceUrl = (this.sourceUrlInput?.value || '').trim();
    const sourceTitle = (this.sourceTitleInput?.value || '').trim();

    this.isGenerating = true;
    if (this.btnGenerate) this.btnGenerate.disabled = true;

    try {
      const engine = await this.initEngine();

      this.showProgress(100, '要約テキストを生成中...');

      const systemPrompt = `あなたは優秀な技術コミュニケーターです。入力された技術記事または動画の字幕テキストを読み込み、以下のフォーマットの日本語Markdownで要約を作成してください。

必ず以下の構成で出力してください:
# 記事のタイトル（簡潔で魅力的なタイトル）
TAGS: [カンマ区切りの技術タグ3〜5個]
SUMMARY: [一覧カード用の2〜3行の簡潔な要約]

## 概要
（主要なポイントと背景を3〜4行で整理）

## 主なポイント
- 箇条書きで重要な論点を解説
- 技術的メリットや注意点

## 技術的詳細
（必要に応じてコードや仕組み、アーキテクチャの解説）

## まとめ
（今後の展望や実務での活用指針）`;

      const userPrompt = `【コンテンツ種別】: ${sourceType === 'video' ? 'YouTube動画字幕' : '技術記事'}
【元タイトル】: ${sourceTitle || '未指定'}
【元URL】: ${sourceUrl || '未指定'}
【本文テキスト】:
${rawContent.slice(0, 8000)}

上記のフォーマットに沿って要約を生成してください。`;

      const chunks = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        stream: false,
      });

      const responseText = chunks.choices[0]?.message?.content || '';
      this.parseAndPopulateResult(responseText, sourceType, sourceUrl, sourceTitle);
    } catch (err) {
      console.error('Generation failed:', err);
      alert(`要約生成中にエラーが発生しました: ${err.message}`);
    } finally {
      this.isGenerating = false;
      if (this.btnGenerate) this.btnGenerate.disabled = false;
    }
  }

  parseAndPopulateResult(responseText, sourceType, sourceUrl, sourceTitle) {
    // 抽出ロジック
    let title = sourceTitle || '要約記事';
    let tags = ['AI', '技術'];
    let summary = '';
    let body = responseText;

    // タイトル抽出
    const titleMatch = responseText.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // タグ抽出
    const tagsMatch = responseText.match(/^TAGS:\s*\[?([^\]\n]+)\]?/m);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map((t) => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    }

    // 要約抽出
    const summaryMatch = responseText.match(/^SUMMARY:\s*(.+)$/m);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    // 本文からメタ情報を除去して整形
    body = responseText
      .replace(/^#\s+.+$/m, '')
      .replace(/^TAGS:.+$/m, '')
      .replace(/^SUMMARY:.+$/m, '')
      .trim();

    // フォームにセット
    if (this.editTitle) this.editTitle.value = title;
    if (this.editTags) this.editTags.value = tags.join(', ');
    if (this.editSlug) this.editSlug.value = slugify(title);
    if (this.editSummary) this.editSummary.value = summary;
    if (this.editBody) this.editBody.value = body;

    // プレビュー表示
    if (this.previewSection) {
      this.previewSection.style.display = 'block';
      this.previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    this.updateMarkdownPreview();
  }

  updateMarkdownPreview() {
    if (!this.markdownPreviewRender || !this.editBody) return;
    this.markdownPreviewRender.innerHTML = renderMarkdown(this.editBody.value);
  }

  generateFullMarkdown() {
    const title = this.editTitle?.value || 'Untitled';
    const date = this.editDate?.value || new Date().toISOString().split('T')[0];
    const tags = (this.editTags?.value || '技術')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const sourceType = document.querySelector('input[name="source-type"]:checked')?.value || 'article';
    const sourceUrl = (this.sourceUrlInput?.value || '').trim();
    const sourceTitle = (this.sourceTitleInput?.value || '').trim();
    const videoId = sourceType === 'video' ? (extractYouTubeId(sourceUrl) || '') : '';
    const summary = (this.editSummary?.value || '').trim();
    const body = (this.editBody?.value || '').trim();

    const frontMatter = `---
title: ${title}
date: ${date}
tags: [${tags.join(', ')}]
source_url: ${sourceUrl}
source_type: ${sourceType}
source_title: ${sourceTitle || title}
video_id: "${videoId}"
summary: ${summary}
---

${body}
`;
    return frontMatter;
  }

  downloadMarkdown() {
    const date = this.editDate?.value || new Date().toISOString().split('T')[0];
    const slug = this.editSlug?.value || 'article';
    const filename = `${date}-${slug}.md`;
    const content = this.generateFullMarkdown();

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    // ダウンロード後の案内通知
    const guideBox = document.getElementById('post-download-guide');
    if (guideBox) {
      guideBox.style.display = 'block';
      guideBox.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async copyToClipboard() {
    const content = this.generateFullMarkdown();
    try {
      await navigator.clipboard.writeText(content);
      alert('Markdownコードをクリップボードにコピーしました！');
    } catch {
      alert('クリップボードへのコピーに失敗しました。手動でコピーしてください。');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SummarizerApp();
});
