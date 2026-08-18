import { gsap } from 'gsap';

export class CardNav {
  constructor(containerSelector = '.card-nav-container') {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;

    this.navEl = this.container.querySelector('.card-nav');
    this.hamburgerBtn = this.container.querySelector('.card-nav-hamburger');
    this.contentEl = this.container.querySelector('.card-nav-content');
    this.cards = Array.from(this.container.querySelectorAll('.nav-card'));

    this.isExpanded = false;
    this.tl = null;

    this.init();
  }

  calculateHeight() {
    if (!this.navEl) return 260;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile && this.contentEl) {
      const wasVisible = this.contentEl.style.visibility;
      const wasPosition = this.contentEl.style.position;
      const wasHeight = this.contentEl.style.height;

      this.contentEl.style.visibility = 'visible';
      this.contentEl.style.position = 'static';
      this.contentEl.style.height = 'auto';

      const topBar = 64;
      const padding = 16;
      const contentHeight = this.contentEl.scrollHeight;

      this.contentEl.style.visibility = wasVisible;
      this.contentEl.style.position = wasPosition;
      this.contentEl.style.height = wasHeight;

      return topBar + contentHeight + padding;
    }
    return 260; // デスクトップ展開高さ
  }

  createTimeline() {
    if (!this.navEl) return null;

    gsap.set(this.navEl, { height: 64, overflow: 'hidden' });
    gsap.set(this.cards, { y: 40, opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(this.navEl, {
      height: () => this.calculateHeight(),
      duration: 0.4,
      ease: 'power3.out',
    });
    tl.to(
      this.cards,
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: 'power3.out',
        stagger: 0.08,
      },
      '-=0.15'
    );

    return tl;
  }

  toggle() {
    if (!this.tl) return;

    if (!this.isExpanded) {
      this.isExpanded = true;
      this.navEl.classList.add('open');
      this.hamburgerBtn.classList.add('open');
      this.hamburgerBtn.setAttribute('aria-expanded', 'true');
      this.tl.play(0);
    } else {
      this.hamburgerBtn.classList.remove('open');
      this.hamburgerBtn.setAttribute('aria-expanded', 'false');
      this.tl.eventCallback('onReverseComplete', () => {
        this.isExpanded = false;
        this.navEl.classList.remove('open');
        this.tl.eventCallback('onReverseComplete', null);
      });
      this.tl.reverse();
    }
  }

  handleResize() {
    if (!this.tl) return;
    if (this.isExpanded) {
      const newHeight = this.calculateHeight();
      gsap.set(this.navEl, { height: newHeight });
      this.tl.kill();
      this.tl = this.createTimeline();
      if (this.tl) {
        this.tl.progress(1);
      }
    } else {
      this.tl.kill();
      this.tl = this.createTimeline();
    }
  }

  init() {
    this.tl = this.createTimeline();

    if (this.hamburgerBtn) {
      this.hamburgerBtn.addEventListener('click', () => this.toggle());
    }

    // 外側クリックで閉じる
    document.addEventListener('click', (e) => {
      if (this.isExpanded && !this.container.contains(e.target)) {
        this.toggle();
      }
    });

    // Escキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isExpanded) {
        this.toggle();
      }
    });

    window.addEventListener('resize', () => this.handleResize());
  }
}
