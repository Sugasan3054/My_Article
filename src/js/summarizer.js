import { extractYouTubeId, slugify, renderMarkdown } from './utils.js';
import { initAurora } from './aurora.js';
import { i18n } from './i18n.js';
import { CardNav } from './card-nav.js';
import { geminiService, GEMINI_MODELS } from './gemini.js';

class SummarizerApp {
  constructor() {
    this.currentModelId = GEMINI_MODELS[0].id;
    this.isGenerating = false;

    // API Key 要素
    this.apiKeyInput = document.getElementById('gemini-api-key-input');
    this.btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
    this.btnSaveKey = document.getElementById('btn-save-key');
    this.btnClearKey = document.getElementById('btn-clear-key');
    this.apiKeyStatusBadge = document.getElementById('api-key-status-badge');

    // フォーム要素
    this.sourceTypeInputs = document.querySelectorAll('input[name="source-type"]');
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

    this.populateModelSelect();
    this.setupApiKeyUI();
    this.setupEventListeners();
    this.setDefaultDate();
  }

  setDefaultDate() {
    if (this.editDate) {
      const today = new Date().toISOString().split('T')[0];
      this.editDate.value = today;
    }
  }

  populateModelSelect() {
    if (!this.modelSelect) return;
    this.modelSelect.innerHTML = GEMINI_MODELS.map(
      (m) => `<option value="${m.id}">${m.name}</option>`
    ).join('');
  }

  setupApiKeyUI() {
    this.updateApiKeyStatus();

    if (this.btnSaveKey) {
      this.btnSaveKey.addEventListener('click', () => {
        const key = this.apiKeyInput?.value.trim() || '';
        if (!key) {
          alert(i18n.lang === 'ja' ? 'APIキーを入力してください。' : 'Please enter an API key.');
          return;
        }
        geminiService.setApiKey(key);
        this.updateApiKeyStatus();
        alert(i18n.t('apiKeySavedAlert'));
      });
    }

    if (this.btnClearKey) {
      this.btnClearKey.addEventListener('click', () => {
        geminiService.clearApiKey();
        if (this.apiKeyInput) this.apiKeyInput.value = '';
        this.updateApiKeyStatus();
        alert(i18n.t('apiKeyClearedAlert'));
      });
    }

    if (this.btnToggleKeyVisibility && this.apiKeyInput) {
      this.btnToggleKeyVisibility.addEventListener('click', () => {
        const isPass = this.apiKeyInput.type === 'password';
        this.apiKeyInput.type = isPass ? 'text' : 'password';
      });
    }
  }

  updateApiKeyStatus() {
    const hasKey = geminiService.hasApiKey();
    const currentKey = geminiService.getApiKey();

    if (this.apiKeyInput && currentKey && !this.apiKeyInput.value) {
      this.apiKeyInput.value = currentKey;
    }

    if (this.apiKeyStatusBadge) {
      if (hasKey) {
        this.apiKeyStatusBadge.textContent = `✓ ${i18n.t('apiKeySavedStatus')}`;
        this.apiKeyStatusBadge.className = 'tag-chip is-active';
        this.apiKeyStatusBadge.style.color = '#3fb950';
        this.apiKeyStatusBadge.style.borderColor = 'rgba(63, 185, 80, 0.4)';
      } else {
        this.apiKeyStatusBadge.textContent = `⚠ ${i18n.t('apiKeyMissingStatus')}`;
        this.apiKeyStatusBadge.className = 'tag-chip';
        this.apiKeyStatusBadge.style.color = 'var(--color-text-muted)';
        this.apiKeyStatusBadge.style.borderColor = 'var(--color-border)';
      }
    }
  }

  setupEventListeners() {
    this.sourceTypeInputs.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const type = e.target.value;
        const isVideo = type === 'video';

        const contentLabel = document.getElementById('content-label');
        if (contentLabel) {
          contentLabel.textContent = isVideo ? i18n.t('labelContentTextVideo') : i18n.t('labelContentTextArticle');
        }
      });
    });

    if (this.modelSelect) {
      this.modelSelect.addEventListener('change', (e) => {
        this.currentModelId = e.target.value;
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

    if (!geminiService.hasApiKey()) {
      alert(i18n.lang === 'ja' ? 'Gemini APIキーが設定されていません。上の設定欄にAPIキーを入力して「保存」してください。' : 'Gemini API key is not configured. Please enter and save your key above.');
      this.apiKeyInput?.focus();
      return;
    }

    const sourceType = document.querySelector('input[name="source-type"]:checked')?.value || 'article';
    const sourceUrl = (this.sourceUrlInput?.value || '').trim();
    const sourceTitle = (this.sourceTitleInput?.value || '').trim();
    const isJa = i18n.lang === 'ja';

    this.isGenerating = true;
    if (this.btnGenerate) this.btnGenerate.disabled = true;
    if (this.btnQuickExtract) this.btnQuickExtract.disabled = true;

    try {
      this.showProgress(50, isJa ? 'Gemini API に接続中...' : 'Connecting to Gemini API...');

      if (this.previewSection) {
        this.previewSection.style.display = 'block';
        this.previewSection.scrollIntoView({ behavior: 'smooth' });
      }
      if (this.editBody) this.editBody.value = '';

      const systemInstruction = isJa
        ? `あなたは高度な技術リサーチ力を持つシニアテクニカルライターです。入力された技術記事や動画字幕を深く読み解き、以下の厳格なフォーマットに従ってプロフェッショナルな日本語Markdown要約を生成してください。

フォーマット要件:
# 記事のタイトル（魅力的で具体的）
TAGS: [3〜5個の技術タグ、カンマ区切り]
SUMMARY: [一覧カード用の2〜3行の簡潔な要約]

## 概要
（背景とコアとなる課題解決を3〜4行で整理）

## 主なポイント
- 箇条書きで重要な論点を深く解説
- 技術的メリットや注意点

## 技術的詳細・アーキテクチャ
（コード例、仕組み、データフロー、設計思想）

## まとめ・実務への示唆
（今後の展望や開発者が今すぐ活用できるポイント）`
        : `You are an expert senior technical writer. Read the provided article text or video transcript and generate a structured, professional Markdown summary following this exact format:

# Article Title (Engaging & specific)
TAGS: [3-5 technical tags, comma-separated]
SUMMARY: [2-3 line concise summary for card view]

## Overview
(3-4 sentences explaining background & core problem solved)

## Key Takeaways
- Deep explanation of key points
- Performance, architectural, or DX benefits

## Technical Details & Architecture
(Mechanism, code patterns, data flow, or system design)

## Summary & Actionable Insights
(Future outlook and takeaways for developers)`;

      const prompt = isJa
        ? `【種別】: ${sourceType === 'video' ? 'YouTube動画字幕' : '技術記事'}
【元タイトル】: ${sourceTitle || '未指定'}
【元URL】: ${sourceUrl || '未指定'}
【本文テキスト】:
${rawContent}`
        : `[Content Type]: ${sourceType === 'video' ? 'YouTube Transcript' : 'Tech Article'}
[Original Title]: ${sourceTitle || 'Untitled'}
[Original URL]: ${sourceUrl || 'N/A'}
[Text Content]:
${rawContent}`;

      let streamedText = '';
      const fullResponse = await geminiService.generateSummaryStream(
        {
          model: this.currentModelId,
          systemInstruction,
          prompt,
        },
        (chunk, currentFull) => {
          streamedText = currentFull;
          if (this.editBody) {
            this.editBody.value = streamedText;
            this.updateMarkdownPreview();
          }
        }
      );

      this.parseAndPopulateResult(fullResponse, sourceType, sourceUrl, sourceTitle);
      this.showProgress(100, isJa ? 'Geminiによる要約が完了しました！' : 'Gemini summary generated successfully!');
    } catch (err) {
      console.error('Generation failed:', err);
      alert(`Error during summary generation: ${err.message}`);
      this.showProgress(0, `Error: ${err.message}`, true);
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
    if (this.editTags) this.editTags.value = isJa ? 'AI, アーキテクチャ, 開発' : 'AI, Architecture, Development';
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
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
tags: [${tags.join(', ')}]
source_url: ${sourceUrl}
source_type: ${sourceType}
source_title: "${(sourceTitle || title).replace(/"/g, '\\"')}"
video_id: "${videoId}"
summary: "${summary.replace(/"/g, '\\"')}"
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
