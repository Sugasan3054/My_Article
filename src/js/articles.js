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
    this.articlesGrid = document.getElementById('articles-grid');
    this.resultCountLive = document.getElementById('result-count-live');
    this.emptyState = document.getElementById('empty-state');
    this.heroDescTarget = document.getElementById('split-text-target');
    this.activeFilterBadge = document.getElementById('active-filter-badge');
    this.activeFilterName = document.getElementById('active-filter-name');

    this.init();
  }

  async init() {
    i18n.init();
    i18n.onLanguageChange(() => {
      this.updateLanguage();
    });

    new CardNav('.card-nav-container');
    this.triggerSplitText();

    try {
      await this.loadIndex();
      this.setupEventListeners();
      this.setupCardNavFilters();
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

    if (this.activeFilterName) {
      this.activeFilterName.addEventListener('click', () => {
        this.selectTag('all');
      });
    }
  }

  setupCardNavFilters() {
    document.querySelectorAll('[data-nav-filter]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const filter = e.currentTarget.getAttribute('data-nav-filter');
        this.selectTag(filter);

        // ハンバーガーメニューを閉じる
        const hamburger = document.querySelector('.card-nav-hamburger');
        if (hamburger && hamburger.classList.contains('open')) {
          hamburger.click();
        }

        // 記事リストへスムーズスクロール
        if (this.articlesGrid) {
          this.articlesGrid.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  selectTag(tag) {
    this.selectedTag = tag;

    if (this.activeFilterBadge && this.activeFilterName) {
      if (tag === 'all') {
        this.activeFilterBadge.style.display = 'none';
      } else {
        this.activeFilterBadge.style.display = 'inline-flex';
        this.activeFilterName.textContent = `#${tag} ✕`;
      }
    }

    this.applyFilters();
  }

  applyFilters() {
    this.filteredArticles = this.articles.filter((article) => {
      if (this.selectedTag !== 'all') {
        if (!article.tags || !article.tags.some((t) => t.toLowerCase() === this.selectedTag.toLowerCase())) {
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
          .map((t) => `<button type="button" class="tag-chip" data-card-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`)
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

    // カード内のタグクリックで絞り込み
    this.articlesGrid.querySelectorAll('[data-card-tag]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = e.currentTarget.getAttribute('data-card-tag');
        this.selectTag(tag);
      });
    });
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
