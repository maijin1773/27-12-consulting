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
// past, the halves visibly part like doors — driven continuously by scroll
// position, so it reverses smoothly when scrolling back up.
const heroSplitSection = document.querySelector('.hero');
const heroSplitPhoto = document.querySelector('.hero-panel-photo');
const heroSplitSub = document.querySelector('.hero-panel-sub');
const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if (heroSplitSection && heroSplitPhoto && heroSplitSub && !prefersReducedMotionQuery.matches) {
  const MAX_SPLIT_PERCENT = 38;
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
  };

  window.addEventListener('scroll', () => {
    if (!heroSplitTicking) {
      heroSplitTicking = true;
      requestAnimationFrame(updateHeroSplit);
    }
  }, { passive: true });

  updateHeroSplit();
}

// Section curtain-reveal: every main section after the hero wipes down into
// place as it crosses into view (clip-path 0% -> 100% height) with a small
// upward settle, most sections now alternate cream/navy backgrounds, so the
// wipe reads as the new color being drawn in rather than an abrupt cut.
const curtainSections = Array.from(document.querySelectorAll('main > section:not(.hero)'));

if (curtainSections.length && !prefersReducedMotionQuery.matches) {
  const ENTRY_TRIGGER_RATIO = 0.85;
  const ENTRY_DISTANCE = 220;
  const ENTRY_SETTLE_PX = 36;
  let curtainTicking = false;

  const updateCurtainSections = () => {
    curtainTicking = false;
    const triggerY = window.innerHeight * ENTRY_TRIGGER_RATIO;

    curtainSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const progress = Math.min(Math.max((triggerY - rect.top) / ENTRY_DISTANCE, 0), 1);
      section.style.clipPath = `inset(0 0 ${(1 - progress) * 100}% 0)`;
      section.style.transform = `translateY(${(1 - progress) * ENTRY_SETTLE_PX}px)`;
    });
  };

  window.addEventListener('scroll', () => {
    if (!curtainTicking) {
      curtainTicking = true;
      requestAnimationFrame(updateCurtainSections);
    }
  }, { passive: true });

  updateCurtainSections();
}

// Team card reveal ("Нас трое"): each card wipes in top-down with a
// staggered gold top-line draw, and its photo wipes in with a slight
// offset — layered on top of the section-level curtain above.
const teamCards = Array.from(document.querySelectorAll('.team-card'));

if (teamCards.length && !prefersReducedMotionQuery.matches) {
  const CARD_TRIGGER_RATIO = 0.85;
  const CARD_ENTRY_DISTANCE = 260;
  const CARD_STAGGER_PX = 40;
  let teamCardTicking = false;

  const updateTeamCards = () => {
    teamCardTicking = false;
    const triggerY = window.innerHeight * CARD_TRIGGER_RATIO;

    teamCards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const raw = (triggerY - rect.top - i * CARD_STAGGER_PX) / CARD_ENTRY_DISTANCE;
      const progress = Math.min(Math.max(raw, 0), 1);

      card.style.clipPath = `inset(0 0 ${(1 - progress) * 100}% 0)`;
      card.style.setProperty('--line-scale', Math.min(progress * 1.6, 1));

      const avatar = card.querySelector('.team-avatar');
      if (avatar) {
        const photoProgress = Math.min(Math.max((progress - 0.3) / 0.7, 0), 1);
        avatar.style.clipPath = `inset(0 0 ${(1 - photoProgress) * 100}% 0)`;
      }
    });
  };

  window.addEventListener('scroll', () => {
    if (!teamCardTicking) {
      teamCardTicking = true;
      requestAnimationFrame(updateTeamCards);
    }
  }, { passive: true });

  updateTeamCards();
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

// Full-screen overlay menu, toggled from the header burger button.
const menuToggle = document.querySelector('.menu-toggle');
const siteMenu = document.getElementById('site-menu');

if (menuToggle && siteMenu) {
  const openMenu = () => {
    siteMenu.classList.add('is-open');
    siteMenu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    siteMenu.classList.remove('is-open');
    siteMenu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  menuToggle.addEventListener('click', () => {
    if (siteMenu.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  siteMenu.querySelector('.site-menu-close').addEventListener('click', closeMenu);

  siteMenu.querySelectorAll('.site-menu-nav a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && siteMenu.classList.contains('is-open')) {
      closeMenu();
    }
  });
}
