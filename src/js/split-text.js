import { gsap } from 'gsap';

/**
 * SplitText アニメーション (vue-bits SplitText の Vanilla JS + GSAP 実装)
 * @param {HTMLElement|string} target 要素またはセレクタ
 * @param {object} options
 */
export function animateSplitText(target, options = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  const text = options.text ?? el.textContent.trim();
  const splitType = options.splitType || 'words'; // 'words' | 'chars'
  const delay = options.delay ?? 0.03;
  const duration = options.duration ?? 0.7;
  const ease = options.ease || 'power3.out';

  // 既存のアニメーションをクリア
  gsap.killTweensOf(el.querySelectorAll('.split-item'));

  let innerHTML = '';
  if (splitType === 'chars') {
    innerHTML = Array.from(text)
      .map((char) => {
        if (char === ' ') return '<span class="split-space">&nbsp;</span>';
        return `<span class="split-item inline-block" style="display:inline-block; opacity:0; transform:translateY(30px); will-change:transform,opacity;">${escapeHtml(char)}</span>`;
      })
      .join('');
  } else {
    // words
    const words = text.split(/\s+/);
    innerHTML = words
      .map((word) => {
        return `<span class="split-item inline-block" style="display:inline-block; opacity:0; transform:translateY(30px); will-change:transform,opacity; margin-right: 0.3em;">${escapeHtml(word)}</span>`;
      })
      .join(' ');
  }

  el.innerHTML = innerHTML;

  const items = el.querySelectorAll('.split-item');
  if (items.length === 0) return;

  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration,
    ease,
    stagger: delay,
    overwrite: 'auto',
  });
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
