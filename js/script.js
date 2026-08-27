// Reading-progress hairline: width tracks overall scroll position directly,
// no easing — it's a 1:1 readout of where you are on the page, not a
// decorative animation, so it stays accurate every frame rather than
// trailing behind.
const scrollProgress = document.getElementById('scroll-progress');

if (scrollProgress) {
  let scrollProgressTicking = false;

  const updateScrollProgress = () => {
    scrollProgressTicking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    scrollProgress.style.transform = `scaleX(${progress})`;
  };

  window.addEventListener('scroll', () => {
    if (!scrollProgressTicking) {
      scrollProgressTicking = true;
      requestAnimationFrame(updateScrollProgress);
    }
  }, { passive: true });

  window.addEventListener('resize', updateScrollProgress);
  updateScrollProgress();
}

const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// Hero graceful exit: the photo shrinks and fades as the hero scrolls out
// of view, instead of just being cut off hard by the next section landing
// on top of it. Progress is measured across the hero's own height (it's
// ~one viewport tall), so the photo finishes fading right as the section
// itself finishes scrolling past — no extra scroll distance added. Purely
// scale + opacity, no translateY, so this reads as the photo settling
// back rather than drifting (kept deliberately distinct from the
// parallax version tried earlier and reverted).
const heroBg = document.querySelector('.hero-bg');
const heroSection = document.querySelector('.hero');

if (heroBg && heroSection && !prefersReducedMotionQuery.matches) {
  let heroExitTicking = false;

  const updateHeroExit = () => {
    heroExitTicking = false;
    const rect = heroSection.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
    const scale = 1 - progress * 0.12;
    const opacity = 1 - progress * 0.85;
    heroBg.style.transform = `scale(${scale})`;
    heroBg.style.opacity = opacity;
  };

  window.addEventListener('scroll', () => {
    if (!heroExitTicking) {
      heroExitTicking = true;
      requestAnimationFrame(updateHeroExit);
    }
  }, { passive: true });

  window.addEventListener('resize', updateHeroExit);
  updateHeroExit();
}

// Every CTA on the site opens Telegram in a new tab — a click can have a
// brief gap before that tab actually appears, separate from :active (which
// only lasts while the mouse button is physically held). Restart a fixed,
// guaranteed-visible pulse (.is-tapped, see style.css) on every click so
// the click always visibly registers, even on a very fast tap.
document.querySelectorAll('a.btn[target="_blank"]').forEach((link) => {
  link.addEventListener('click', () => {
    link.classList.remove('is-tapped');
    void link.offsetWidth;
    link.classList.add('is-tapped');
  });
});

// One-time idle invitation on the hero's primary CTA: two very soft pulses
// (.is-inviting, see style.css) if the visitor hasn't touched the page in
// ~4.5s while the button is on screen — then never again this visit. The
// idle timer only runs while the button is actually visible, so scrolling
// past it doesn't queue up an invite that fires somewhere off-screen.
const heroCta = document.querySelector('.hero-actions .btn');

if (heroCta && !prefersReducedMotionQuery.matches) {
  let ctaIdleTimer = null;
  let ctaHasInvited = false;

  const triggerCtaInvite = () => {
    if (ctaHasInvited) return;
    ctaHasInvited = true;
    heroCta.classList.add('is-inviting');
  };

  const resetCtaIdleTimer = () => {
    if (ctaHasInvited) return;
    clearTimeout(ctaIdleTimer);
    ctaIdleTimer = setTimeout(triggerCtaInvite, 4500);
  };

  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        resetCtaIdleTimer();
      } else {
        clearTimeout(ctaIdleTimer);
      }
    });
  }).observe(heroCta);

  ['mousemove', 'scroll', 'keydown', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, resetCtaIdleTimer, { passive: true });
  });
}

// Hero entrance: fades/settles in once, shortly after load — unlike every
// other section's reveal, this content is above the fold from the first
// paint, so there's nothing to scroll into view. Waits on fonts.ready so
// the stagger starts once the real webfont glyphs are in, rather than
// animating in over a fallback font and reflowing under it.
const heroLoadEls = Array.from(document.querySelectorAll('.hero-load'));

if (heroLoadEls.length) {
  if (prefersReducedMotionQuery.matches) {
    heroLoadEls.forEach((el) => { el.style.opacity = '1'; });
  } else {
    const playHeroLoad = () => {
      heroLoadEls.forEach((el, i) => {
        el.animate(
          [
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 700, delay: 200 + i * 120, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' }
        );
      });
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(playHeroLoad);
    } else {
      playHeroLoad();
    }
  }
}

// Section curtain-reveal: every main section after the hero wipes down into
// place as it crosses into view (clip-path 0% -> 100% height) with a small
// upward settle. Section backgrounds used to alternate cream/navy in hard
// per-section blocks, so the wipe read as the new color being drawn in —
// now the background itself is a continuous wash (see updateBgWash below),
// so the wipe reveals content over an already-transitioning backdrop.
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
      const linear = Math.min(Math.max((triggerY - rect.top) / ENTRY_DISTANCE, 0), 1);
      // Ease-out cubic on the motion itself (not the trigger math above) —
      // the wipe starts fast and decelerates into place instead of moving
      // at the same constant speed all the way through, which read as
      // mechanical next to every other eased transition on the site.
      const progress = 1 - Math.pow(1 - linear, 3);
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

// Continuous background wash (annnimate.com "background-color" reference):
// #bg-wash is a fixed layer behind everything (see style.css). Instead of
// each section painting its own hard cream/navy block, this repaints the
// wash every scroll frame, interpolating smoothly between a section's zone
// color and the next one's as their shared boundary crosses a fixed
// reference line — no seam at the handoff. Hero is excluded: it has its
// own photo/navy split, not part of this cream/navy body alternation.
const bgWash = document.getElementById('bg-wash');
const bgWashSections = Array.from(document.querySelectorAll('main > section:not(.hero)'));

if (bgWash && bgWashSections.length && !prefersReducedMotionQuery.matches) {
  // Mirrors each section's actual CSS background (var(--bg) cream / var(--card-bg)
  // navy) in DOM order — kept as literal hex here since the wash paints
  // between scroll frames and can't afford a getComputedStyle() read per section
  // per frame.
  const ZONE_CREAM = '#f2f2e8';
  const ZONE_NAVY = '#283864';
  const bgWashZones = bgWashSections.map((section) =>
    section.matches('.who, .formats, .services, .project, .partnership, .terms') ? ZONE_NAVY : ZONE_CREAM
  );
  const REFERENCE_RATIO = 0.4; // how far down the viewport the "trigger line" sits
  const TRANSITION_PX = 320; // how much scroll distance the crossfade spans

  const hexToRgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];

  const lerpColor = (hexA, hexB, t) => {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bch = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r}, ${g}, ${bch})`;
  };

  let bgWashTicking = false;

  const updateBgWash = () => {
    bgWashTicking = false;
    const refY = window.innerHeight * REFERENCE_RATIO;

    let idx = -1;
    for (let i = 0; i < bgWashSections.length; i += 1) {
      if (bgWashSections[i].getBoundingClientRect().top <= refY) idx = i;
    }

    if (idx === -1) {
      bgWash.style.backgroundColor = bgWashZones[0];
      return;
    }

    let color = bgWashZones[idx];
    if (idx + 1 < bgWashSections.length) {
      const nextTop = bgWashSections[idx + 1].getBoundingClientRect().top;
      const dist = nextTop - refY;
      if (dist < TRANSITION_PX) {
        const t = 1 - Math.max(dist, 0) / TRANSITION_PX;
        color = lerpColor(bgWashZones[idx], bgWashZones[idx + 1], t);
      }
    }
    bgWash.style.backgroundColor = color;
  };

  window.addEventListener('scroll', () => {
    if (!bgWashTicking) {
      bgWashTicking = true;
      requestAnimationFrame(updateBgWash);
    }
  }, { passive: true });

  updateBgWash();
}

// Shared by the CSS-driven card-grid stagger (.reveal/.is-visible) and the
// text-reveal exclusion below — anything matching this already gets moved
// as one piece by a parent-level reveal.
const blockRevealCardSelector =
  '.team-grid > .reveal, .formats-grid > .reveal, .services-grid > .reveal, .project-grid > .reveal, .stages-grid > .reveal, .terms-grid > .reveal';
// .project's own parts aren't marked with .reveal (they're WAAPI-animated
// individually below) but need the same exclusion from the text reveal.
const blockRevealSelector = `${blockRevealCardSelector}, .project h2, .project-intro, .project-terms`;

// Body text outside .hero and outside anything already riding a
// parent-level block reveal (a card sliding up as one piece, or .project's
// own WAAPI sequence) gets the same fade-up as the card grids, via
// .text-reveal in style.css — replaces the old letter-by-letter split.
const textRevealTargets = Array.from(
  document.querySelectorAll('h2, h3, p, li, .format-link')
).filter((el) => (
  !el.closest('.hero')
  && !el.closest(blockRevealSelector)
));

textRevealTargets.forEach((el) => el.classList.add('text-reveal'));

// Group-entrance stagger for card grids (formats, services, project,
// partnership stages, start steps): the .reveal/.stagger classes already
// sat on these in the markup with nothing behind them (see style.css) —
// team-grid is excluded on purpose, its .reveal children are already
// driven every frame by the scroll-scrubbed fan-out above. .project-grid's
// cards ride the same observer but have their own "Marquee Slide-Stop"
// transform/shimmer in CSS rather than the shared fade-up. The rest of
// .project's entrance (heading group + CTA) still uses its own separate
// WAAPI sequence below.
const staggerRevealEls = Array.from(document.querySelectorAll(blockRevealCardSelector));

// The former letter-reveal targets ride the same observer now that they
// use .text-reveal instead of their own letterObserver.
staggerRevealEls.push(...textRevealTargets);

// .stages-grid itself isn't a .reveal card (its children are) — added
// separately so the timeline connector line can draw in on the same
// trigger as the cards scrolling into view, instead of sitting there
// fully drawn before anything else has appeared.
const stagesGrid = document.querySelector('.stages-grid');
if (stagesGrid) staggerRevealEls.push(stagesGrid);

const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      staggerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

staggerRevealEls.forEach((el) => staggerObserver.observe(el));

// "Проектная работа за 28 дней" entrance: Web Animations API instead of a
// CSS transition — one hardware-accelerated element.animate() call per
// piece (eyebrow, heading, intro, CTA), staggered 70ms apart. Fires once
// via IntersectionObserver, same as staggerObserver above, just through
// WAAPI rather than a toggled class. The three .project-col cards no
// longer ride this — they now use the "Marquee Slide-Stop" CSS treatment
// via staggerObserver above instead. Button hover colors are pure CSS
// (:hover) and untouched by this — WAAPI here
// only ever animates opacity/transform, never background or border-color.
const projectSection = document.querySelector('.project');
const projectInner = projectSection ? projectSection.querySelector('.project-inner') : null;

if (projectSection && projectInner) {
  const projectParts = [
    projectSection.querySelector('h2'),
    projectSection.querySelector('.project-intro'),
    projectSection.querySelector('.project-terms'),
  ].filter(Boolean);

  if (prefersReducedMotionQuery.matches) {
    projectParts.forEach((el) => { el.style.opacity = '1'; });
  } else {
    // The section itself is much taller than a single card grid, so a plain
    // area-ratio threshold (like staggerObserver's 0.15 above) would fire
    // while it's still mostly below the fold — the section's top edge alone
    // can satisfy 15% of its own height before any text is readable.
    // rootMargin shrinks the effective viewport from the bottom instead, so
    // this fires once the section has actually scrolled up into view.
    const projectObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        projectInner.animate(
          [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }],
          { duration: 650, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' }
        );

        projectParts.forEach((el, i) => {
          el.animate(
            [
              { opacity: 0, transform: 'translateY(34px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 620, delay: 140 + i * 70, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' }
          );
        });

        projectObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -25% 0px' });

    projectObserver.observe(projectSection);
  }
}

// Full-screen overlay menu, toggled from the floating burger button.
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

// Services scroll-snap strip: plain vertical wheel/trackpad input always
// scrolls the page — cards are navigated via the "Назад"/"Далее" buttons
// or the gold scrubber below, not by hijacking scroll. (Previously
// redirected vertical wheel into horizontal card scroll; removed because
// it fought the page's normal scroll on desktop/laptop.)
const servicesGrid = document.querySelector('.services-grid');

// Gold scroll scrubber for the services strip: primary scroll control now
// that only one card is visible at a time. Thumb width tracks the visible
// fraction (like a minimap), and it's both draggable and click-to-jump.
const servicesScrubberWrap = document.getElementById('services-scrubber');
const servicesScrubberThumb = document.getElementById('services-scrubber-thumb');

if (servicesGrid && servicesScrubberWrap && servicesScrubberThumb) {
  const maxServicesScroll = () => Math.max(1, servicesGrid.scrollWidth - servicesGrid.clientWidth);

  const syncServicesThumb = () => {
    const trackW = servicesScrubberWrap.clientWidth;
    const visibleFrac = Math.min(1, servicesGrid.clientWidth / servicesGrid.scrollWidth);
    const thumbW = Math.max(24, trackW * visibleFrac);
    const pct = servicesGrid.scrollLeft / maxServicesScroll();
    servicesScrubberThumb.style.width = `${thumbW}px`;
    servicesScrubberThumb.style.left = `${pct * (trackW - thumbW)}px`;
  };

  let servicesScrubberTicking = false;
  servicesGrid.addEventListener('scroll', () => {
    if (!servicesScrubberTicking) {
      servicesScrubberTicking = true;
      requestAnimationFrame(() => {
        servicesScrubberTicking = false;
        syncServicesThumb();
      });
    }
  }, { passive: true });
  window.addEventListener('resize', syncServicesThumb);
  syncServicesThumb();

  let scrubberDragging = false;
  let scrubberStartX = 0;
  let scrubberStartLeft = 0;

  servicesScrubberThumb.addEventListener('pointerdown', (e) => {
    scrubberDragging = true;
    servicesScrubberThumb.classList.add('dragging');
    servicesScrubberThumb.setPointerCapture(e.pointerId);
    scrubberStartX = e.clientX;
    scrubberStartLeft = parseFloat(servicesScrubberThumb.style.left) || 0;
    e.stopPropagation();
  });

  servicesScrubberThumb.addEventListener('pointermove', (e) => {
    if (!scrubberDragging) return;
    const trackW = servicesScrubberWrap.clientWidth;
    const thumbW = servicesScrubberThumb.offsetWidth;
    const newLeft = Math.max(0, Math.min(trackW - thumbW, scrubberStartLeft + (e.clientX - scrubberStartX)));
    servicesGrid.scrollLeft = (newLeft / (trackW - thumbW)) * maxServicesScroll();
  });

  const endScrubberDrag = () => {
    scrubberDragging = false;
    servicesScrubberThumb.classList.remove('dragging');
  };
  servicesScrubberThumb.addEventListener('pointerup', endScrubberDrag);
  servicesScrubberThumb.addEventListener('pointercancel', endScrubberDrag);

  servicesScrubberWrap.addEventListener('pointerdown', (e) => {
    if (e.target === servicesScrubberThumb) return;
    const trackW = servicesScrubberWrap.clientWidth;
    const thumbW = servicesScrubberThumb.offsetWidth;
    const x = e.clientX - servicesScrubberWrap.getBoundingClientRect().left - thumbW / 2;
    const clamped = Math.max(0, Math.min(trackW - thumbW, x));
    servicesGrid.scrollLeft = (clamped / (trackW - thumbW)) * maxServicesScroll();
  });

  // "Назад"/"Далее" buttons: move exactly one card (cards are each 100% of
  // the grid's width), letting native scroll-snap settle it into place.
  // Disabled at whichever end has nothing further to move to.
  const servicesPrevBtn = document.getElementById('services-prev');
  const servicesNextBtn = document.getElementById('services-next');

  if (servicesPrevBtn && servicesNextBtn) {
    servicesPrevBtn.addEventListener('click', () => {
      servicesGrid.scrollBy({ left: -servicesGrid.clientWidth, behavior: 'smooth' });
    });
    servicesNextBtn.addEventListener('click', () => {
      servicesGrid.scrollBy({ left: servicesGrid.clientWidth, behavior: 'smooth' });
    });

    const syncServicesNavButtons = () => {
      const max = maxServicesScroll();
      servicesPrevBtn.disabled = servicesGrid.scrollLeft <= 4;
      servicesNextBtn.disabled = servicesGrid.scrollLeft >= max - 4;
    };
    servicesGrid.addEventListener('scroll', syncServicesNavButtons, { passive: true });
    syncServicesNavButtons();
  }
}

