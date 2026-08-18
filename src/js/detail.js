import { renderMarkdown, parseFrontMatter, formatDate, extractYouTubeId } from './utils.js';
import { initAurora } from './aurora.js';
import { i18n } from './i18n.js';
import { CardNav } from './card-nav.js';

class ArticleDetailManager {
  constructor() {
    this.slug = this.getSlugFromUrl();
    this.articleData = null;
    this.allArticles = [];
    this.prevArticle = null;
    this.nextArticle = null;

    this.container = document.getElementById('article-container');
    this.loading = document.getElementById('article-loading');

    this.init();
  }

  getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async init() {
    // i18n 初期化
    i18n.init();
    i18n.onLanguageChange(() => {
      this.renderArticle();
    });

    // CardNav 初期化
    new CardNav('.card-nav-container');

    if (!this.slug) {
      this.renderError('No article specified. Please select an article from the home page.');
      return;
    }

    try {
      await this.loadAllArticles();
      await this.loadArticleContent();
      this.renderArticle();
    } catch (err) {
      console.error('Failed to load article:', err);
      this.renderError('Failed to load article content. The file might not exist or the URL is invalid.');
    }
  }

  async loadAllArticles() {
    try {
      const res = await fetch('./content/index.json');
      if (res.ok) {
        const data = await res.json();
        this.allArticles = data.articles || [];

        const currentIndex = this.allArticles.findIndex((a) => a.slug === this.slug);
        if (currentIndex !== -1) {
          this.nextArticle = currentIndex > 0 ? this.allArticles[currentIndex - 1] : null;
          this.prevArticle = currentIndex < this.allArticles.length - 1 ? this.allArticles[currentIndex + 1] : null;
        }
      }
    } catch (e) {
      console.warn('Index load error:', e);
    }
  }

  async loadArticleContent() {
    const res = await fetch(`./content/articles/${encodeURIComponent(this.slug)}.md`);
    if (!res.ok) {
      throw new Error(`Article not found (status: ${res.status})`);
    }
    const rawMarkdown = await res.text();
    const { data, body } = parseFrontMatter(rawMarkdown);
    this.articleData = {
      ...data,
      body,
    };
  }

  renderError(message) {
    if (this.loading) this.loading.style.display = 'none';
    if (this.container) {
      this.container.innerHTML = `
        <div class="alert alert-error" role="alert">
          <p><strong>Error:</strong> ${message}</p>
          <p style="margin-top: 1rem;"><a href="./index.html" class="btn btn-secondary">← Back to Articles</a></p>
        </div>
      `;
    }
  }

  renderArticle() {
    if (this.loading) this.loading.style.display = 'none';
    if (!this.container || !this.articleData) return;

    const {
      title = this.slug,
      date = '',
      tags = [],
      source_url = '',
      source_type = 'article',
      source_title = '',
      video_id = '',
      body = '',
    } = this.articleData;

    document.title = `${title} | Tech Summary Hub`;

    const breadcrumbTitle = document.getElementById('breadcrumb-title');
    if (breadcrumbTitle) {
      breadcrumbTitle.textContent = title;
    }

    const formattedDate = formatDate(date, i18n.lang);
    const isVideo = source_type === 'video';
    const sourceBadgeClass = isVideo ? 'video' : 'article';
    const sourceBadgeLabel = isVideo ? i18n.t('sourceLabelVideo') : i18n.t('sourceLabelArticle');

    const ytId = video_id || extractYouTubeId(source_url);

    const tagsHtml = (Array.isArray(tags) ? tags : [tags])
      .filter(Boolean)
      .map((t) => `<span class="tag-chip">#${t}</span>`)
      .join(' ');

    const parsedBodyHtml = renderMarkdown(body);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = parsedBodyHtml;
    const headings = tempDiv.querySelectorAll('h2, h3');

    let tocHtml = '';
    if (headings.length >= 3) {
      let tocItems = '';
      headings.forEach((h, index) => {
        const headingText = h.textContent;
        const headingId = `heading-${index}`;
        h.setAttribute('id', headingId);

        const levelClass = h.tagName.toLowerCase() === 'h3' ? 'toc-level-3' : 'toc-level-2';
        tocItems += `
          <li class="${levelClass}">
            <a href="#${headingId}">${escapeHtml(headingText)}</a>
          </li>
        `;
      });

      tocHtml = `
        <nav class="toc-card" aria-label="Table of contents">
          <div class="toc-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span>${i18n.t('tocTitle')}</span>
          </div>
          <ol class="toc-list">
            ${tocItems}
          </ol>
        </nav>
      `;
    }

    let videoEmbedHtml = '';
    if (isVideo && ytId) {
      videoEmbedHtml = `
        <div class="video-embed-container" aria-label="YouTube video player">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}"
            title="${escapeHtml(source_title || title)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </div>
      `;
    }

    let sourceLinkHtml = '';
    if (source_url) {
      sourceLinkHtml = `
        <div class="alert alert-info" style="margin-top: var(--space-6);">
          <div>
            <strong>${i18n.t('sourceLinkPrefix')} (${sourceBadgeLabel}): </strong>
            <a href="${escapeHtml(source_url)}" class="external-link" target="_blank" rel="noopener noreferrer">
              <span>${escapeHtml(source_title || source_url)}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="${i18n.t('externalLinkAria')}">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      `;
    }

    let postNavHtml = '';
    if (this.prevArticle || this.nextArticle) {
      postNavHtml = `
        <nav class="post-navigation" aria-label="Adjacent articles">
          ${
            this.prevArticle
              ? `
            <a href="./article.html?id=${encodeURIComponent(this.prevArticle.slug)}" class="post-nav-card post-nav-prev">
              <span class="post-nav-label">← ${i18n.t('prevArticle')}</span>
              <span class="post-nav-title">${escapeHtml(this.prevArticle.title)}</span>
            </a>
          `
              : '<div></div>'
          }
          ${
            this.nextArticle
              ? `
            <a href="./article.html?id=${encodeURIComponent(this.nextArticle.slug)}" class="post-nav-card post-nav-next">
              <span class="post-nav-label">${i18n.t('nextArticle')} →</span>
              <span class="post-nav-title">${escapeHtml(this.nextArticle.title)}</span>
            </a>
          `
              : ''
          }
        </nav>
      `;
    }

    const sourceIcon = isVideo
      ? `<svg class="icon-source" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`
      : `<svg class="icon-source" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;

    this.container.innerHTML = `
      <article>
        <header style="margin-bottom: var(--space-8);">
          <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
            <time datetime="${date}" style="color: var(--color-text-muted); font-size: var(--font-size-sm);">${formattedDate}</time>
            <span class="badge-source ${sourceBadgeClass}">
              ${sourceIcon}
              <span>${sourceBadgeLabel}</span>
            </span>
          </div>

          <h1 style="margin-bottom: var(--space-4);">${escapeHtml(title)}</h1>

          <div class="tag-list" aria-label="Tags" style="margin-bottom: var(--space-4);">
            ${tagsHtml}
          </div>

          ${sourceLinkHtml}
        </header>

        ${videoEmbedHtml}

        ${tocHtml}

        <div class="markdown-body" id="article-body-content">
          ${tempDiv.innerHTML}
        </div>

        ${postNavHtml}
      </article>
    `;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  initAurora('#aurora-bg');
  new ArticleDetailManager();
});
