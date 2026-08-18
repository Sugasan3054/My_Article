import { marked } from 'marked';
import DOMPurify from 'dompurify';
import yaml from 'js-yaml';

// marked の設定
marked.setOptions({
  breaks: true,
  gfm: true,
});

// DOMPurify にフックを追加して外部リンクに rel="noopener noreferrer" と target="_blank" を自動付与
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  if ('target' in node && node.tagName === 'A') {
    const href = node.getAttribute('href') || '';
    if (href.startsWith('http://') || href.startsWith('https://')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }
});

/**
 * Markdown文字列をサニタイズされた安全なHTMLに変換
 * @param {string} markdown 
 * @returns {string} サニタイズ済みHTML
 */
export function renderMarkdown(markdown) {
  if (!markdown) return '';
  const rawHtml = marked.parse(markdown);
  return DOMPurify.sanitize(rawHtml);
}

/**
 * フロントマター付きMarkdownをパース
 * @param {string} content 
 * @returns {{ data: object, body: string }}
 */
export function parseFrontMatter(content) {
  if (!content) return { data: {}, body: '' };
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: content };
  }
  try {
    const data = yaml.load(match[1]) || {};
    return { data, body: match[2].trim() };
  } catch (e) {
    console.error('YAML parse error:', e);
    return { data: {}, body: content };
  }
}

/**
 * 日付文字列をフォーマット (英語 / 日本語)
 * @param {string} dateStr 
 * @param {string} lang ('en' | 'ja')
 * @returns {string}
 */
export function formatDate(dateStr, lang = 'en') {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (lang === 'ja') {
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/**
 * YouTube URLからvideo_idを抽出
 * @param {string} url 
 * @returns {string|null}
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * スラッグ文字列を生成 (日本語や記号を英数字ハイフンに整形)
 * @param {string} text 
 * @returns {string}
 */
export function slugify(text) {
  return (text || 'article')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'article';
}
