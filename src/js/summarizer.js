import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { extractYouTubeId, slugify, renderMarkdown } from './utils.js';

// 推奨モデル定義 (軽量モデルを先頭にして初回ダウンロードの失敗を防ぐ)
const AVAILABLE_MODELS = [
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5-0.5B (超軽量・約350MB・推奨)',
    size: '約350 MB',
  },
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2-360M (極小・約200MB・低スペック端末向け)',
    size: '約200 MB',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5-1.5B (高精度日本語・約1.1GB)',
    size: '約1.1 GB',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama-3.2-1B (高速・約800MB)',
    size: '約800 MB',
  },
];

class SummarizerApp {
  constructor() {
    this.engine = null;
    this.currentModelId = AVAILABLE_MODELS[0].id;
    this.isGenerating = false;
    this.isLoadingEngine = false;
    this.hasWebGPU = false;

    // DOM要素
    this.webgpuWarning = document.getElementById('webgpu-warning');
    this.sourceTypeInputs = document.querySelectorAll('input[name="source-type"]');
    this.videoFields = document.getElementById('video-fields');
    this.articleFields = document.getElementById('article-fields');
    this.modelSelect = document.getElementById('model-select');
    this.btnGenerate = document.getElementById('btn-generate');
    this.btnQuickExtract = document.getElementById('btn-quick-extract');
    
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
    await this.checkWebGPUSupport();
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
      this.showWebGPUUnavailable('お使いのブラウザは WebGPU をサポートしていません。Chrome/Edgeの最新版をご利用いただくか、下記の「クイック抽出モード」をご利用ください。');
      return;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        this.showWebGPUUnavailable('WebGPUアダプタを取得できませんでした。ブラウザのハードウェアアクセラレーションが有効かご確認ください。');
        return;
      }
      this.hasWebGPU = true;
    } catch (e) {
      this.showWebGPUUnavailable(`WebGPUの初期化に失敗しました: ${e.message}`);
    }
  }

  showWebGPUUnavailable(message) {
    this.hasWebGPU = false;
    if (this.webgpuWarning) {
      this.webgpuWarning.style.display = 'flex';
      const p = this.webgpuWarning.querySelector('p');
      if (p) p.textContent = message;
    }
    if (this.btnGenerate) {
      this.btnGenerate.classList.remove('btn-primary');
      this.btnGenerate.classList.add('btn-secondary');
      this.btnGenerate.title = 'WebGPU非対応のため、クイック抽出モードをご利用ください';
    }
  }

  populateModelSelect() {
    if (!this.modelSelect) return;
    this.modelSelect.innerHTML = AVAILABLE_MODELS.map(
      (m) => `<option value="${m.id}">${m.name}</option>`
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
        this.engine = null; // モデル切り替え時はエンジン再初期化
      });
    }

    // WebLLM 要約生成ボタン
    if (this.btnGenerate) {
      this.btnGenerate.addEventListener('click', () => this.handleGenerate());
    }

    // クイック要約（ルールベース）ボタン
    if (this.btnQuickExtract) {
      this.btnQuickExtract.addEventListener('click', () => this.handleQuickExtract());
    }

    // プレビュー編集時のリアルタイムMarkdownレンダリング反映
    if (this.editBody) {
      this.editBody.addEventListener('input', () => {
        this.updateMarkdownPreview();
      });
    }

    // タイトル入力時にスラッグを自動補完
    if (this.editTitle && this.editSlug) {
      this.editTitle.addEventListener('input', (e) => {
        if (!this.editSlug.dataset.manual) {
          this.editSlug.value = slugify(e.target.value);
        }
      });
      this.editSlug.addEventListener('input', () => {
        this.editSlug.dataset.manual = 'true';
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
    this.showProgress(0, 'WebLLM モデルのダウンロード・初期化を開始しています...（モデルサイズに応じたデータ通信が発生します）');

    const initProgressCallback = (report) => {
      const progress = Math.round(report.progress * 100);
      const text = report.text || 'モデルデータをダウンロード中...';
      this.showProgress(progress, text);
    };

    try {
      this.engine = await CreateMLCEngine(this.currentModelId, {
        initProgressCallback,
      });
      this.showProgress(100, 'モデルの準備が完了しました！推論を開始します...');
      return this.engine;
    } catch (err) {
      console.error('Failed to load WebLLM model:', err);
      this.showProgress(0, `モデルの読み込みエラー: ${err.message}`, true);
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
    if (this.btnQuickExtract) this.btnQuickExtract.disabled = true;

    try {
      const engine = await this.initEngine();

      this.showProgress(100, 'AIが要約を生成中...');

      // プレビュー領域を先に開いてストリーミング待機状態にする
      if (this.previewSection) {
        this.previewSection.style.display = 'block';
        this.previewSection.scrollIntoView({ behavior: 'smooth' });
      }
      if (this.editBody) this.editBody.value = '要約を生成しています...';

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
${rawContent.slice(0, 6000)}

上記のフォーマットに沿って日本語で要約を生成してください。`;

      const response = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        stream: false,
      });

      const responseText = response.choices[0]?.message?.content || '';
      this.parseAndPopulateResult(responseText, sourceType, sourceUrl, sourceTitle);
      this.showProgress(100, '要約の生成が完了しました！');
    } catch (err) {
      console.error('Generation failed:', err);
      alert(`要約生成中にエラーが発生しました: ${err.message}\n\nWebGPUの負荷が高い場合や端末メモリが不足している場合は、軽量モデルをお選びいただくか「クイック抽出モード」をお試しください。`);
    } finally {
      this.isGenerating = false;
      if (this.btnGenerate) this.btnGenerate.disabled = false;
      if (this.btnQuickExtract) this.btnQuickExtract.disabled = false;
    }
  }

  /**
   * WebGPUが使えない環境や即座に要約枠を作りたい場合のフォールバック（ルールベース重要文抽出）
   */
  handleQuickExtract() {
    const rawContent = (this.sourceContentInput?.value || '').trim();
    if (!rawContent) {
      alert('本文または字幕テキストを入力してください。');
      return;
    }

    const sourceType = document.querySelector('input[name="source-type"]:checked')?.value || 'article';
    const sourceUrl = (this.sourceUrlInput?.value || '').trim();
    const sourceTitle = (this.sourceTitleInput?.value || '').trim();

    // 文を分割して先頭および重要そうな文を抽出
    const sentences = rawContent
      .split(/[\n。！？]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const title = sourceTitle || (sentences[0] ? sentences[0].slice(0, 40) + '...' : '技術記事要約');
    const summary = sentences.slice(0, 3).join('。') + '。';
    const points = sentences.slice(3, 8).map((s) => `- ${s}`).join('\n');

    const generatedBody = `## 概要

${summary}

## 主なポイント

${points || '- 本文の重要ポイントをここに記載'}

## 詳細解説

${sentences.slice(8, 15).join('。\n\n') || rawContent.slice(0, 500)}

## まとめ

本記事・セッションでは上記内容について解説されています。詳細は出典元をご参照ください。`;

    if (this.editTitle) this.editTitle.value = title;
    if (this.editTags) this.editTags.value = 'Web技術, アーキテクチャ, まとめ';
    if (this.editSlug) this.editSlug.value = slugify(title);
    if (this.editSummary) this.editSummary.value = summary.slice(0, 150);
    if (this.editBody) this.editBody.value = generatedBody;

    if (this.previewSection) {
      this.previewSection.style.display = 'block';
      this.previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    this.updateMarkdownPreview();
  }

  parseAndPopulateResult(responseText, sourceType, sourceUrl, sourceTitle) {
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

    if (this.editTitle) this.editTitle.value = title;
    if (this.editTags) this.editTags.value = tags.join(', ');
    if (this.editSlug) this.editSlug.value = slugify(title);
    if (this.editSummary) this.editSummary.value = summary;
    if (this.editBody) this.editBody.value = body;

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
