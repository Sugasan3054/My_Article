import { CreateWebWorkerMLCEngine, CreateMLCEngine } from '@mlc-ai/web-llm';
import { extractYouTubeId, slugify, renderMarkdown } from './utils.js';
import { initAurora } from './aurora.js';
import { i18n } from './i18n.js';
import { CardNav } from './card-nav.js';

// 推奨モデル定義 (軽量モデルを先頭に配置)
const AVAILABLE_MODELS = [
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5-0.5B (Ultra-light · ~350MB · Recommended)',
    size: '~350 MB',
  },
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2-360M (Compact · ~200MB)',
    size: '~200 MB',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama-3.2-1B (Fast · ~800MB)',
    size: '~800 MB',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5-1.5B (Accurate · ~1.1GB)',
    size: '~1.1 GB',
  },
];

class SummarizerApp {
  constructor() {
    this.engine = null;
    this.worker = null;
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
    i18n.init();
    new CardNav('.card-nav-container');

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
      this.showWebGPUUnavailable(i18n.t('webgpuWarningBody'));
      return;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        this.showWebGPUUnavailable(i18n.t('webgpuWarningBody'));
        return;
      }
      this.hasWebGPU = true;
    } catch (e) {
      this.showWebGPUUnavailable(`WebGPU initialization error: ${e.message}`);
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
      this.btnGenerate.title = 'WebGPU unavailable. Please use Quick Extract.';
    }
  }

  populateModelSelect() {
    if (!this.modelSelect) return;
    this.modelSelect.innerHTML = AVAILABLE_MODELS.map(
      (m) => `<option value="${m.id}">${m.name}</option>`
    ).join('');
  }

  setupEventListeners() {
    this.sourceTypeInputs.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const type = e.target.value;
        const isVideo = type === 'video';
        if (this.videoFields) this.videoFields.style.display = isVideo ? 'block' : 'none';
        if (this.articleFields) this.articleFields.style.display = isVideo ? 'none' : 'block';

        const contentLabel = document.getElementById('content-label');
        if (contentLabel) {
          contentLabel.textContent = isVideo ? i18n.t('labelContentTextVideo') : i18n.t('labelContentTextArticle');
        }
      });
    });

    if (this.modelSelect) {
      this.modelSelect.addEventListener('change', (e) => {
        this.currentModelId = e.target.value;
        this.destroyEngine();
      });
    }

    if (this.btnGenerate) {
      this.btnGenerate.addEventListener('click', () => this.handleGenerate());
    }

    if (this.btnQuickExtract) {
      this.btnQuickExtract.addEventListener('click', () => this.handleQuickExtract());
    }

    if (this.editBody) {
      this.editBody.addEventListener('input', () => {
        this.updateMarkdownPreview();
      });
    }

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

    if (this.btnDownload) {
      this.btnDownload.addEventListener('click', () => this.downloadMarkdown());
    }

    if (this.btnCopy) {
      this.btnCopy.addEventListener('click', () => this.copyToClipboard());
    }
  }

  destroyEngine() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.engine = null;
  }

  async initEngine() {
    if (this.engine) return this.engine;

    this.isLoadingEngine = true;
    this.showProgress(0, i18n.t('progressLoading'));

    const initProgressCallback = (report) => {
      const progress = Math.round(report.progress * 100);
      const text = report.text || 'Loading model weights...';
      this.showProgress(progress, text);
    };

    try {
      if (typeof Worker !== 'undefined') {
        this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
        this.engine = await CreateWebWorkerMLCEngine(this.worker, this.currentModelId, {
          initProgressCallback,
        });
      } else {
        this.engine = await CreateMLCEngine(this.currentModelId, {
          initProgressCallback,
        });
      }

      this.showProgress(100, i18n.t('progressDone'));
      return this.engine;
    } catch (err) {
      console.error('Failed to load WebLLM model:', err);
      this.showProgress(0, `Model load error: ${err.message}`, true);
      this.destroyEngine();
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
      alert(i18n.lang === 'ja' ? '本文または字幕テキストを入力してください。' : 'Please enter article or transcript text.');
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

      this.showProgress(100, i18n.lang === 'ja' ? 'AIが要約テキストをリアルタイム生成中...' : 'AI is generating summary in real-time...');

      if (this.previewSection) {
        this.previewSection.style.display = 'block';
        this.previewSection.scrollIntoView({ behavior: 'smooth' });
      }
      if (this.editBody) this.editBody.value = '';

      const isJa = i18n.lang === 'ja';
      const systemPrompt = isJa
        ? `あなたは優秀な技術コミュニケーターです。入力された技術記事または動画の字幕テキストを読み込み、以下のフォーマットの日本語Markdownで要約を作成してください。

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
（今後の展望や実務での活用指針）`
        : `You are an expert technical communicator. Given the following technical article or video transcript, generate a structured summary in Markdown format with the following template:

# Article Title (Engaging & concise title)
TAGS: [Comma-separated 3-5 technical tags]
SUMMARY: [2-3 line concise summary for card view]

## Overview
(3-4 sentences summarizing background & purpose)

## Key Takeaways
- Key technical point 1
- Key architectural insight 2
- Performance / developer benefits

## Technical Details
(Architecture, implementation patterns, code concepts)

## Summary & Future Outlook
(Next steps, takeaways for developers)`;

      const userPrompt = isJa
        ? `【コンテンツ種別】: ${sourceType === 'video' ? 'YouTube動画字幕' : '技術記事'}
【元タイトル】: ${sourceTitle || '未指定'}
【元URL】: ${sourceUrl || '未指定'}
【本文テキスト】:
${rawContent.slice(0, 5000)}`
        : `[Content Type]: ${sourceType === 'video' ? 'YouTube Transcript' : 'Tech Article'}
[Original Title]: ${sourceTitle || 'Untitled'}
[Original URL]: ${sourceUrl || 'N/A'}
[Text Content]:
${rawContent.slice(0, 5000)}`;

      const chunks = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullResponse += delta;
        if (this.editBody) {
          this.editBody.value = fullResponse;
          this.updateMarkdownPreview();
        }
      }

      this.parseAndPopulateResult(fullResponse, sourceType, sourceUrl, sourceTitle);
      this.showProgress(100, isJa ? '要約の生成が完了しました！' : 'Summary generated successfully!');
    } catch (err) {
      console.error('Generation failed:', err);
      alert(`Error during summary generation: ${err.message}\n\nPlease try the "Quick Extract" button if WebGPU is unavailable.`);
    } finally {
      this.isGenerating = false;
      if (this.btnGenerate) this.btnGenerate.disabled = false;
      if (this.btnQuickExtract) this.btnQuickExtract.disabled = false;
    }
  }

  handleQuickExtract() {
    const rawContent = (this.sourceContentInput?.value || '').trim();
    if (!rawContent) {
      alert(i18n.lang === 'ja' ? '本文または字幕テキストを入力してください。' : 'Please enter article or transcript text.');
      return;
    }

    const sourceType = document.querySelector('input[name="source-type"]:checked')?.value || 'article';
    const sourceUrl = (this.sourceUrlInput?.value || '').trim();
    const sourceTitle = (this.sourceTitleInput?.value || '').trim();
    const isJa = i18n.lang === 'ja';

    const sentences = rawContent
      .split(/[\n.!?。！？]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const title = sourceTitle || (sentences[0] ? sentences[0].slice(0, 40) + '...' : (isJa ? '技術記事要約' : 'Tech Article Summary'));
    const summary = sentences.slice(0, 3).join('. ') + (sentences.length > 0 ? '.' : '');
    const points = sentences.slice(3, 8).map((s) => `- ${s}`).join('\n');

    const generatedBody = isJa
      ? `## 概要

${summary || '概要をここに記載します。'}

## 主なポイント

${points || '- 本文の主要な論点をここに記載'}

## 詳細解説

${sentences.slice(8, 15).join('。\n\n') || rawContent.slice(0, 500)}

## まとめ

本記事・セッションでは上記内容について解説されています。詳細は出典元をご参照ください。`
      : `## Overview

${summary || 'Overview of the article / session.'}

## Key Takeaways

${points || '- Key point 1\n- Key point 2'}

## Detailed Breakdown

${sentences.slice(8, 15).join('.\n\n') || rawContent.slice(0, 500)}

## Summary

This article outlines key technical concepts and insights. Please refer to the original source link for complete details.`;

    if (this.editTitle) this.editTitle.value = title;
    if (this.editTags) this.editTags.value = isJa ? 'Web技術, アーキテクチャ, AI' : 'Web, AI, Architecture';
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
    let title = sourceTitle || 'Article Summary';
    let tags = ['AI', 'Tech'];
    let summary = '';
    let body = responseText;

    const titleMatch = responseText.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    const tagsMatch = responseText.match(/^TAGS:\s*\[?([^\]\n]+)\]?/m);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map((t) => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    }

    const summaryMatch = responseText.match(/^SUMMARY:\s*(.+)$/m);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

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
    const tags = (this.editTags?.value || 'Tech')
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
      alert(i18n.lang === 'ja' ? 'Markdownコードをクリップボードにコピーしました！' : 'Markdown copied to clipboard!');
    } catch {
      alert('Failed to copy to clipboard.');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAurora('#aurora-bg');
  new SummarizerApp();
});
