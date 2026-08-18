import { formatDate } from './utils.js';
import { initAurora } from './aurora.js';
import { i18n } from './i18n.js';
import { CardNav } from './card-nav.js';
import { animateSplitText } from './split-text.js';

class ArticleListManager {
  constructor() {
    this.articles = [];
    this.filteredArticles = [];
    this.selectedTag = 'all';
    this.searchQuery = '';
    this.sortBy = 'newest';

    this.searchInput = document.getElementById('search-input');
    this.sortSelect = document.getElementById('sort-select');
    this.tagsContainer = document.getElementById('tags-container');
    this.cardNavTagsContainer = document.getElementById('card-nav-tag-links');
    this.articlesGrid = document.getElementById('articles-grid');
    this.resultCountLive = document.getElementById('result-count-live');
    this.emptyState = document.getElementById('empty-state');
    this.heroDescTarget = document.getElementById('split-text-target');

    this.init();
  }

  async init() {
    // i18n 初期化
    i18n.init();
    i18n.onLanguageChange(() => {
      this.updateLanguage();
    });

    // Card Nav 初期化
    new CardNav('.card-nav-container');

    // Split Text アニメーション初期化
    this.triggerSplitText();

    try {
      await this.loadIndex();
      this.setupEventListeners();
      this.renderTags();
      this.renderCardNavTags();
      this.applyFilters();
    } catch (err) {
      console.error('Failed to initialize article list:', err);
      if (this.articlesGrid) {
        this.articlesGrid.innerHTML = `
          <div class="alert alert-error" role="alert">
            <p><strong>Failed to load article index.</strong></p>
            <p>Please ensure <code>npm run build:index</code> has been run.</p>
          </div>
        `;
      }
    }
  }

  triggerSplitText() {
    if (this.heroDescTarget) {
      const text = i18n.t('siteSubtitle');
      animateSplitText(this.heroDescTarget, {
        text,
        splitType: 'words',
        delay: 0.03,
        duration: 0.8,
      });
    }
  }

  updateLanguage() {
    this.triggerSplitText();
    this.renderTags();
    this.renderArticles();
  }

  async loadIndex() {
    const res = await fetch('./content/index.json');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    this.articles = data.articles || [];
    this.filteredArticles = [...this.articles];
  }

  setupEventListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.applyFilters();
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.applyFilters();
      });
    }
  }

  renderTags() {
    if (!this.tagsContainer) return;

    const tagCountMap = {};
    for (const article of this.articles) {
      if (Array.isArray(article.tags)) {
        for (const tag of article.tags) {
          tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
        }
      }
    }

    const uniqueTags = Object.keys(tagCountMap).sort();
    const allLabel = i18n.t('allTags');

    let html = `
      <li>
        <button type="button" class="tag-chip ${this.selectedTag === 'all' ? 'is-active' : ''}" data-tag="all" aria-pressed="${this.selectedTag === 'all'}">
          ${allLabel} (${this.articles.length})
        </button>
      </li>
    `;

    uniqueTags.forEach((tag) => {
      const isActive = this.selectedTag === tag;
      html += `
        <li>
          <button type="button" class="tag-chip ${isActive ? 'is-active' : ''}" data-tag="${tag}" aria-pressed="${isActive}">
            #${tag} (${tagCountMap[tag]})
          </button>
        </li>
      `;
    });

    this.tagsContainer.innerHTML = html;

    this.tagsContainer.querySelectorAll('button[data-tag]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tag = e.currentTarget.getAttribute('data-tag');
        this.selectTag(tag);
      });
    });
  }

  renderCardNavTags() {
    if (!this.cardNavTagsContainer) return;

    const tagCountMap = {};
    for (const article of this.articles) {
      if (Array.isArray(article.tags)) {
        for (const tag of article.tags) {
          tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
        }
      }
    }

    // 上位5タグ
    const topTags = Object.keys(tagCountMap)
      .sort((a, b) => tagCountMap[b] - tagCountMap[a])
      .slice(0, 5);

    let html = `
      <a class="nav-card-link" data-nav-tag="all">
        <span>→ ${i18n.t('allTags')} (${this.articles.length})</span>
      </a>
    `;

    topTags.forEach((tag) => {
      html += `
        <a class="nav-card-link" data-nav-tag="${tag}">
          <span>→ #${tag} (${tagCountMap[tag]})</span>
        </a>
      `;
    });

    this.cardNavTagsContainer.innerHTML = html;

    this.cardNavTagsContainer.querySelectorAll('[data-nav-tag]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const tag = e.currentTarget.getAttribute('data-nav-tag');
        this.selectTag(tag);
        // カードナビを閉じる
        const nav = document.querySelector('.card-nav-hamburger');
        if (nav && nav.classList.contains('open')) {
          nav.click();
        }
      });
    });
  }

  selectTag(tag) {
    this.selectedTag = tag;

    if (this.tagsContainer) {
      this.tagsContainer.querySelectorAll('button[data-tag]').forEach((b) => {
        const active = b.getAttribute('data-tag') === tag;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active);
      });
    }

    this.applyFilters();
  }

  applyFilters() {
    this.filteredArticles = this.articles.filter((article) => {
      if (this.selectedTag !== 'all') {
        if (!article.tags || !article.tags.includes(this.selectedTag)) {
          return false;
        }
      }

      if (this.searchQuery) {
        const titleMatch = (article.title || '').toLowerCase().includes(this.searchQuery);
        const summaryMatch = (article.summary || '').toLowerCase().includes(this.searchQuery);
        const sourceMatch = (article.source_title || '').toLowerCase().includes(this.searchQuery);
        const tagMatch = (article.tags || []).some((t) => t.toLowerCase().includes(this.searchQuery));
        if (!titleMatch && !summaryMatch && !sourceMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });

    if (this.sortBy === 'newest') {
      this.filteredArticles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } else if (this.sortBy === 'oldest') {
      this.filteredArticles.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    }

    this.renderArticles();
  }

  renderArticles() {
    if (!this.articlesGrid) return;

    if (this.resultCountLive) {
      this.resultCountLive.textContent = i18n.t('resultsCount', this.filteredArticles.length);
    }

    if (this.filteredArticles.length === 0) {
      this.articlesGrid.innerHTML = '';
      if (this.emptyState) {
        this.emptyState.style.display = 'block';
      }
      return;
    }

    if (this.emptyState) {
      this.emptyState.style.display = 'none';
    }

    const cardsHtml = this.filteredArticles
      .map((article) => {
        const isVideo = article.source_type === 'video';
        const sourceBadgeClass = isVideo ? 'video' : 'article';
        const sourceBadgeLabel = isVideo ? i18n.t('sourceLabelVideo') : i18n.t('sourceLabelArticle');
        const formattedDate = formatDate(article.date, i18n.lang);

        const tagsHtml = (article.tags || [])
          .map((t) => `<span class="tag-chip">#${t}</span>`)
          .join(' ');

        const sourceIcon = isVideo
          ? `<svg class="icon-source" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`
          : `<svg class="icon-source" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;

        return `
          <li class="article-card">
            <div class="article-card-header">
              <time datetime="${article.date}">${formattedDate}</time>
              <span class="badge-source ${sourceBadgeClass}">
                ${sourceIcon}
                <span>${sourceBadgeLabel}</span>
              </span>
            </div>
            
            <h2 class="article-card-title">
              <a href="./article.html?id=${encodeURIComponent(article.slug)}" class="article-card-link">
                ${escapeHtml(article.title)}
              </a>
            </h2>

            <p class="article-card-summary">
              ${escapeHtml(article.summary || 'No summary available.')}
            </p>

            <div class="article-card-footer">
              <div class="tag-list" aria-label="Article tags">
                ${tagsHtml}
              </div>
            </div>
          </li>
        `;
      })
      .join('');

    this.articlesGrid.innerHTML = cardsHtml;
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
  new ArticleListManager();
});
