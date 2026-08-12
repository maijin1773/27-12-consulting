// Keep --header-h in sync with the sticky header, so the hero can fill exactly
// the rest of the first screen: min-height: calc(100svh - var(--header-h)).
const siteHeader = document.querySelector('.site-header');

if (siteHeader) {
  const syncHeaderHeight = () => {
    const h = Math.round(siteHeader.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--header-h', h + 'px');
  };

  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncHeaderHeight);
  }
}

// Curtain-split scroll effect: as the hero (split into two halves) scrolls
// past, the halves visibly part like doors, and the next section settles
// into place as it arrives — driven continuously by scroll position, so it
// reverses smoothly when scrolling back up.
const heroSplitSection = document.querySelector('.hero');
const heroSplitPhoto = document.querySelector('.hero-panel-photo');
const heroSplitSub = document.querySelector('.hero-panel-sub');
const heroSplitNext = heroSplitSection ? heroSplitSection.nextElementSibling : null;
const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if (heroSplitSection && heroSplitPhoto && heroSplitSub && !prefersReducedMotionQuery.matches) {
  const MAX_SPLIT_PERCENT = 38;
  const NEXT_SETTLE_PX = 36;
  const NEXT_ENTRY_DISTANCE = 220;
  let heroSplitTicking = false;

  const updateHeroSplit = () => {
    heroSplitTicking = false;

    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const heroRect = heroSplitSection.getBoundingClientRect();
    const heroHeight = heroSplitSection.offsetHeight || 1;
    const splitProgress = Math.min(Math.max((headerH - heroRect.top) / heroHeight, 0), 1);
    const shift = splitProgress * MAX_SPLIT_PERCENT;

    heroSplitPhoto.style.transform = `translateX(${-shift}%)`;
    heroSplitSub.style.transform = `translateX(${shift}%)`;

    if (heroSplitNext) {
      const nextRect = heroSplitNext.getBoundingClientRect();
      const triggerY = window.innerHeight * 0.85;
      const entryProgress = Math.min(Math.max((triggerY - nextRect.top) / NEXT_ENTRY_DISTANCE, 0), 1);
      heroSplitNext.style.transform = `translateY(${(1 - entryProgress) * NEXT_SETTLE_PX}px)`;
    }
  };

  window.addEventListener('scroll', () => {
    if (!heroSplitTicking) {
      heroSplitTicking = true;
      requestAnimationFrame(updateHeroSplit);
    }
  }, { passive: true });

  updateHeroSplit();
}

// Letter-by-letter reveal for body text outside the first screen (.hero).
function splitTextIntoLetters(root) {
  // Only split root's own direct text; nested elements (e.g. an <img>, or a
  // child that is itself a separate letter-reveal target) are left untouched.
  const textNodes = Array.from(root.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length
  );

  let letterIndex = 0;
  const maxStaggerSteps = 50;
  const stepMs = 10;

  textNodes.forEach((textNode) => {
    const frag = document.createDocumentFragment();
    const parts = textNode.textContent.split(/(\s+)/);
    parts.forEach((part) => {
      if (part === '') return;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        return;
      }
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      Array.from(part).forEach((char) => {
        const letterSpan = document.createElement('span');
        letterSpan.className = 'letter';
        letterSpan.textContent = char;
        letterSpan.style.transitionDelay = `${Math.min(letterIndex, maxStaggerSteps) * stepMs}ms`;
        letterIndex += 1;
        wordSpan.appendChild(letterSpan);
      });
      frag.appendChild(wordSpan);
    });
    textNode.parentNode.replaceChild(frag, textNode);
  });
}

const letterTargets = Array.from(
  document.querySelectorAll('h2, h3, p, li, .format-link, .step-num, .step-text')
).filter((el) => !el.closest('.hero'));

letterTargets.forEach((el) => {
  if (el.dataset.lettered) return;
  el.dataset.lettered = 'true';
  splitTextIntoLetters(el);
});

const letterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('letters-visible');
      letterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

letterTargets.forEach((el) => letterObserver.observe(el));

// 3D cursor-follow tilt for every card outside the first screen (.hero).
const tiltEls = Array.from(
  document.querySelectorAll(
    '.team-card, .format-tile, .service-card, .promo-block, .project-col, .stage-card, .steps-list li'
  )
).filter((el) => !el.closest('.hero'));

const MAX_TILT_DEG = 10;

function applyTilt(el, clientX, clientY) {
  const rect = el.getBoundingClientRect();
  const px = (clientX - rect.left) / rect.width; // 0..1
  const py = (clientY - rect.top) / rect.height; // 0..1
  const rotateY = (px - 0.5) * MAX_TILT_DEG * 2;
  const rotateX = (0.5 - py) * MAX_TILT_DEG * 2;
  el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
  el.style.setProperty('--tilt-x', `${px * 100}%`);
  el.style.setProperty('--tilt-y', `${py * 100}%`);
}

tiltEls.forEach((el) => {
  el.classList.add('tilt-card');

  el.addEventListener('mouseenter', (e) => {
    el.classList.add('tilt-active');
    el.style.transition = 'transform 0.1s linear';
    applyTilt(el, e.clientX, e.clientY);
  });

  el.addEventListener('mousemove', (e) => {
    applyTilt(el, e.clientX, e.clientY);
  });

  el.addEventListener('mouseleave', () => {
    el.classList.remove('tilt-active');
    el.style.transition = 'transform 0.5s ease';
    el.style.transform = '';
  });
});
