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

const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// Image Dissolve Scroll (annnimate.com reference): a section dissolves away
// from the bottom edge upward, but along an irregular, organic boundary
// instead of a straight line, with a glowing seam riding that boundary.
// Everywhere else — the top edge and most of the left/right edges — must
// stay perfectly straight, so the mask is two shapes: a plain "core" rect
// (no filter, always exactly the target's own box down to the boundary)
// plus a thin "band" rect that alone gets run through feTurbulence +
// feDisplacementMap (#dissolve-noise in index.html), riding the boundary.
// Only the band distorts, so raggedness never spreads to the top edge —
// the same filter also distorts the glow bar, so its wobble matches.
// Returns a sync(progress) fn: 0 = fully intact, 1 = fully dissolved.
function createDissolveSync(targetSelector, maskId, coreId, bandId) {
  const target = document.querySelector(targetSelector);
  const maskEl = document.getElementById(maskId);
  const coreRect = document.getElementById(coreId);
  const bandRect = document.getElementById(bandId);
  const glow = target ? target.querySelector('.dissolve-glow') : null;
  if (!target || !maskEl || !coreRect || !bandRect || !glow) return null;

  const FEATHER = 55; // px of organic band straddling the boundary, each side

  return (progress) => {
    if (progress <= 0.002) {
      target.style.maskImage = '';
      target.style.webkitMaskImage = '';
      glow.style.opacity = '0';
      return;
    }

    const w = target.offsetWidth || 1;
    const h = target.offsetHeight || 1;
    const visibleH = h * (1 - progress);
    const coreHeight = Math.max(0, visibleH - FEATHER);
    const bandY = Math.max(0, visibleH - FEATHER * 2);
    const bandHeight = Math.min(h - bandY, FEATHER * 3);

    maskEl.setAttribute('x', '0');
    maskEl.setAttribute('y', '0');
    maskEl.setAttribute('width', w);
    maskEl.setAttribute('height', h);
    coreRect.setAttribute('width', w);
    coreRect.setAttribute('height', coreHeight);
    bandRect.setAttribute('y', bandY);
    bandRect.setAttribute('width', w);
    bandRect.setAttribute('height', Math.max(0, bandHeight));

    target.style.maskImage = `url(#${maskId})`;
    target.style.webkitMaskImage = `url(#${maskId})`;
    target.style.maskRepeat = 'no-repeat';
    target.style.webkitMaskRepeat = 'no-repeat';

    glow.style.top = `${visibleH - 32}px`;
    glow.style.opacity = progress < 0.05 ? String(progress / 0.05)
      : progress > 0.92 ? String((1 - progress) / 0.08)
      : '1';
  };
}

// Hero exit: the hero pins in place (.hero-pin-track / .hero — sticky, same
// pattern as .team-pin-track / .team-grid below) for a short stretch of
// scroll so it dissolves while stationary, matching the reference — not
// dissolving while also scrolling away underneath the mask.
const heroExitSection = document.querySelector('.hero');
const heroPinTrack = document.querySelector('.hero-pin-track');

const heroPanelSubInner = document.querySelector('.hero-panel-sub-inner');
const heroPanelSub = document.querySelector('.hero-panel-sub');
const heroPanelPhotoImg = document.querySelector('.hero-panel-photo img');

if (heroExitSection && heroPinTrack && heroPanelSubInner && heroPanelSub && !prefersReducedMotionQuery.matches) {
  const syncHeroDissolve = createDissolveSync('.hero', 'hero-dissolve-mask', 'hero-dissolve-core', 'hero-dissolve-band');
  // First HOLD of the pin track's scroll room happens before any dissolve:
  // the first SLIDE_PORTION of that slides .hero-panel-sub-inner up (only
  // as far as it needs to — zero on most viewports) so the subtitle/button
  // are fully on screen even when the headline alone is taller than one
  // viewport, then the rest of HOLD is a held pause with everything
  // visible, and only after HOLD does the dissolve begin.
  const HOLD = 0.6;
  const SLIDE_PORTION = 0.35;
  let heroExitTicking = false;

  const updateHeroExit = () => {
    heroExitTicking = false;

    const trackRect = heroPinTrack.getBoundingClientRect();
    const scrubRoom = heroPinTrack.offsetHeight - window.innerHeight;
    // .hero sticks at `top: header-h`, not the viewport's very top edge —
    // zero the curve at the moment it actually locks in place (same fix
    // team-grid needs below).
    const stickyOffset = parseFloat(getComputedStyle(heroExitSection).top) || 0;
    const overall = scrubRoom > 0 ? Math.min(Math.max((stickyOffset - trackRect.top) / scrubRoom, 0), 1) : 0;

    const holdProgress = Math.min(overall / HOLD, 1);
    const slideProgress = Math.min(holdProgress / SLIDE_PORTION, 1);
    const slideMax = Math.max(0, heroPanelSubInner.scrollHeight - heroPanelSub.clientHeight);
    heroPanelSubInner.classList.toggle('is-tall', slideMax > 0);
    heroPanelSubInner.style.transform = slideMax > 0 ? `translateY(${-slideMax * slideProgress}px)` : '';

    // Photo pans in step with the text panel's slide (same slideProgress)
    // so both halves of the hero visibly move together instead of only
    // the text side reacting to scroll. Stays anchored at the top at
    // rest (object-position 50% 0% in CSS — nothing is ever cropped off
    // the models' heads) and only ever pans further down from there.
    if (heroPanelPhotoImg) {
      heroPanelPhotoImg.style.objectPosition = `50% ${slideProgress * 22}%`;
    }

    const dissolveProgress = Math.min(Math.max((overall - HOLD) / (1 - HOLD), 0), 1);
    if (syncHeroDissolve) syncHeroDissolve(dissolveProgress);
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
    section.matches('.formats, .project, .terms') ? ZONE_NAVY : ZONE_CREAM
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

// Persistent gold ray pattern for #bg-rays (see style.css) — thin skewed
// rays that fade in and out at their own random spot and timing, plus
// quick twinkling glints. Static once seeded (not scroll-driven): it's
// ambient texture behind the whole page, not tied to any one section.
const bgRays = document.getElementById('bg-rays');

if (bgRays && !prefersReducedMotionQuery.matches) {
  const RAY_COUNT = 16;
  const GLINT_COUNT = 20;
  let html = '';

  for (let i = 0; i < RAY_COUNT; i += 1) {
    const w = (Math.random() * 5 + 2).toFixed(1);
    // Stratified, not pure random: one ray per (100 / RAY_COUNT)% slice of
    // the width, jittered within its slice — guarantees coverage across
    // the full width (including the left edge) instead of leaving gaps
    // pure randomness can produce with only 16 samples.
    const slice = 100 / RAY_COUNT;
    const x = (i * slice + Math.random() * slice).toFixed(1);
    const dur = (Math.random() * 3.5 + 3.5).toFixed(1);
    const delay = (Math.random() * -12).toFixed(1);
    const blur = (Math.random() * 3 + 2).toFixed(1);
    const drift = (Math.random() * 3 - 1.5).toFixed(1) + '%';
    const tilt = (Math.random() * 24 - 12).toFixed(1) + 'deg';
    const o = (Math.random() * 0.3 + 0.14).toFixed(2);
    html += `<span class="bg-ray" style="--w:${w}px; --x:${x}%; --dur:${dur}s; --delay:${delay}s; --blur:${blur}px; --drift:${drift}; --tilt:${tilt}; --o:${o};"></span>`;
  }

  for (let i = 0; i < GLINT_COUNT; i += 1) {
    const gs = (Math.random() * 5 + 3).toFixed(1);
    const gx = (Math.random() * 98 + 1).toFixed(1);
    const gy = (Math.random() * 98 + 1).toFixed(1);
    const gdur = (Math.random() * 2.5 + 2.5).toFixed(1);
    const gdelay = (Math.random() * -6).toFixed(1);
    html += `<span class="bg-glint" style="--gs:${gs}px; --gx:${gx}%; --gy:${gy}%; --gdur:${gdur}s; --gdelay:${gdelay}s;"></span>`;
  }

  bgRays.innerHTML = html;
}

// "Multi Flip" team-card reveal ("Нас трое"): the grid pins in place
// (.team-pin-track / .team-grid — see style.css) for a long stretch of
// scroll, so the cards stay fully on screen for the whole sequence instead
// of finishing after they've already scrolled past. The whole fan fades in
// together while still piled/rotated (see .team-card:nth-child in style.css
// — PILE below mirrors those exact values), then each card settles into its
// grid slot with a stagger. Continuously scrubbed off how much of the pin
// track has been scrolled through (no fixed-duration transition), so it
// plays out exactly as fast or slow as the user scrolls and reverses
// cleanly when scrolling back up.
const teamCardsFlip = Array.from(document.querySelectorAll('.team-card'));
const teamGridFlip = document.querySelector('.team-grid');
const teamPinTrack = document.querySelector('.team-pin-track');

if (teamCardsFlip.length && teamGridFlip && teamPinTrack && !prefersReducedMotionQuery.matches) {
  const PILE_DESKTOP = [
    { x: 45, y: 8, r: -8 },
    { x: -4, y: 8, r: 3 },
    { x: -46, y: 12, r: 7 },
  ];
  const PILE_MOBILE = [
    { x: 5, y: 4, r: -3 },
    { x: -4, y: -4, r: 3 },
    { x: 4, y: 3, r: -3 },
  ];
  // Fractions below are sized against .team-pin-track's scroll room (now
  // 2000px — just enough for the pile-in/settle sequence itself, no held
  // pause after). SETTLE_START/STAGGER/SETTLE_END keep the exact same
  // absolute-px settle pacing this always had (69px / 230px-per-card /
  // 1886px), so cards still unfurl at the same speed — the pin now simply
  // releases right as they finish, instead of holding them frozen on
  // screen afterward. See updateTeamExit below for what happens next.
  const SETTLE_START = 0.0345; // scroll fraction before any card is shown or starts settling
  const STAGGER = 0.115; // per-card offset once settling starts
  const SETTLE_END = 0.943; // last card must be fully in place by here — see settleSpan below.
  let teamFlipTicking = false;

  const updateTeamFlip = () => {
    teamFlipTicking = false;

    const pile = window.innerWidth <= 600 ? PILE_MOBILE : PILE_DESKTOP;
    const trackRect = teamPinTrack.getBoundingClientRect();
    const scrubRoom = teamPinTrack.offsetHeight - window.innerHeight;
    // .team-grid sticks at `top: header-h + 6vh`, not at the viewport's very
    // top edge — without this offset, progress stays at 0 (cards invisible)
    // for that whole stretch even though the grid is already pinned and
    // on screen. Zero the curve at the moment it actually locks in place.
    const stickyOffset = parseFloat(getComputedStyle(teamGridFlip).top) || 0;
    const overall = scrubRoom > 0 ? Math.min(Math.max((stickyOffset - trackRect.top) / scrubRoom, 0), 1) : 1;
    const settleSpan = SETTLE_END - SETTLE_START - (teamCardsFlip.length - 1) * STAGGER;

    teamCardsFlip.forEach((card, i) => {
      const settleStart = SETTLE_START + i * STAGGER;
      const settleProgress = Math.min(Math.max((overall - settleStart) / settleSpan, 0), 1);
      const p = pile[i];

      // Binary visibility snap, not a gradual opacity fade: the card is
      // either fully opaque or not rendered at all, never translucent.
      card.style.visibility = overall > SETTLE_START ? 'visible' : 'hidden';
      card.style.transform = `translate(${p.x * (1 - settleProgress)}%, ${p.y * (1 - settleProgress)}%) rotate(${p.r * (1 - settleProgress)}deg)`;
    });

    // Hover interactions (grow-on-hover flex-basis + text sizing, in
    // style.css) are gated to this class: hovering mid-flip would otherwise
    // fight the pile/fan transform above with a layout change it was never
    // designed to combine with.
    teamGridFlip.classList.toggle('is-settled', overall >= SETTLE_END);
  };

  window.addEventListener('scroll', () => {
    if (!teamFlipTicking) {
      teamFlipTicking = true;
      requestAnimationFrame(updateTeamFlip);
    }
  }, { passive: true });

  window.addEventListener('resize', updateTeamFlip);

  updateTeamFlip();

  // Exit dissolve: once the pin above releases, .team-grid resumes normal
  // document flow and scrolls up with the page like any other content —
  // deliberately no held pause first, cards should already be moving. This
  // is what makes leaving the section read as dissolving away (same
  // inset() mask-reveal technique curtainSections uses for entrances, just
  // run as an exit) rather than a hard cut against the viewport edge.
  // Explicitly gated on is-settled, not just on `stickyOffset - rect.top`
  // being 0 while pinned: any clip-path at all — even a nominal 0% inset —
  // would clip the piled cards' rotated/translated overflow to the grid's
  // own untransformed box (a hard rectangular "frame" around the fan), so
  // this must never even momentarily apply before the pile has settled.
  const EXIT_DISTANCE = 320;
  let teamExitTicking = false;

  const updateTeamExit = () => {
    teamExitTicking = false;
    if (!teamGridFlip.classList.contains('is-settled')) {
      teamGridFlip.style.clipPath = '';
      return;
    }
    const stickyOffset = parseFloat(getComputedStyle(teamGridFlip).top) || 0;
    const rect = teamGridFlip.getBoundingClientRect();
    const exitProgress = Math.min(Math.max((stickyOffset - rect.top) / EXIT_DISTANCE, 0), 1);
    teamGridFlip.style.clipPath = exitProgress > 0 ? `inset(0 0 ${exitProgress * 100}% 0)` : '';
  };

  window.addEventListener('scroll', () => {
    if (!teamExitTicking) {
      teamExitTicking = true;
      requestAnimationFrame(updateTeamExit);
    }
  }, { passive: true });

  window.addEventListener('resize', updateTeamExit);

  updateTeamExit();
} else if (teamGridFlip) {
  // No flip sequence to gate hover behind when motion is reduced — cards
  // are shown at rest from the start (see the reduced-motion override in
  // style.css), so hover should just work immediately.
  teamGridFlip.classList.add('is-settled');
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
).filter((el) => !el.closest('.hero') && !el.classList.contains('fold-heading'));

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

// Group-entrance stagger for card grids (formats, services, project,
// partnership stages, start steps): the .reveal/.stagger classes already
// sat on these in the markup with nothing behind them (see style.css) —
// team-grid is excluded on purpose, its .reveal children are already
// driven every frame by the scroll-scrubbed fan-out above.
const staggerRevealEls = Array.from(
  document.querySelectorAll(
    '.formats-grid > .reveal, .services-grid > .reveal, .project-grid > .reveal, .stages-grid > .reveal, .steps-list > .reveal'
  )
);

const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      staggerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

staggerRevealEls.forEach((el) => staggerObserver.observe(el));

// "Folding text" heading ("Нас трое"): each character starts folded flat
// at its own baseline hinge (rotateX 90°, invisible) and unfolds upright
// as the heading crosses a fixed band of the viewport — continuously
// scroll-scrubbed off scroll position, not a fixed-duration animation.
// Reimplements GSAP's folding-text reference without GSAP: SplitText
// chars → ScrollTrigger start:"top 80%" end:"top 20%" → each char gets an
// equal 1/charCount slice of that range, eased with power2.out.
function splitTextIntoFoldChars(root) {
  const chars = [];

  // "Нас трое" (live-mode typeset session 59049536) stacks onto two lines
  // via child .who-line spans — split each line's own text separately so
  // the block stacking survives, instead of flattening root.textContent
  // (which would merge both lines back into one run). Any other heading
  // that reuses .fold-heading without .who-line children still works: it
  // falls back to treating the whole root as a single container.
  const lineEls = root.querySelectorAll(':scope > .who-line');
  const containers = lineEls.length ? Array.from(lineEls) : [root];

  containers.forEach((container, lineIndex) => {
    const text = container.textContent;
    container.textContent = '';
    const lineChars = [];

    text.split(/(\s+)/).forEach((part) => {
      if (part === '') return;
      if (/^\s+$/.test(part)) {
        container.appendChild(document.createTextNode(part));
        return;
      }
      // "Нас" (line 0) hinges on its LEFT edge (rotateY -90°→0, matching
      // the reference's "fold-left"); "трое" (line 1) hinges on its RIGHT
      // edge ("fold-right", rotateY 90°→0) — a mirrored pair, paired below
      // with a matching reveal-order reversal so each line's hinge side
      // agrees with the direction it fills in from.
      const hingeRight = lineIndex % 2 === 1;
      const wordSpan = document.createElement('span');
      wordSpan.className = 'fold-word';
      Array.from(part).forEach((char) => {
        const charSpan = document.createElement('span');
        charSpan.className = `fold-char ${hingeRight ? 'fold-char--hinge-right' : 'fold-char--hinge-left'}`;
        charSpan.textContent = char;
        charSpan.dataset.foldSign = hingeRight ? '1' : '-1';
        wordSpan.appendChild(charSpan);
        lineChars.push(charSpan);
      });
      container.appendChild(wordSpan);
    });

    // "Нас" reveals left-to-right, in DOM order. "трое" reveals
    // right-to-left — only the ORDER each character is handed its
    // scroll-progress slot is reversed here; the DOM stays in normal
    // left-to-right reading order, so the letters themselves don't move.
    const timingOrder = lineIndex % 2 === 1 ? lineChars.slice().reverse() : lineChars;
    chars.push(...timingOrder);
  });

  return chars;
}

const foldHeading = document.querySelector('.fold-heading');

if (foldHeading && !prefersReducedMotionQuery.matches) {
  const foldChars = splitTextIntoFoldChars(foldHeading);
  const charSpan = foldChars.length ? 1 / foldChars.length : 1;
  const powerOut2 = (t) => 1 - (1 - t) * (1 - t);
  let foldTicking = false;

  const updateFold = () => {
    foldTicking = false;
    const vh = window.innerHeight;
    const rect = foldHeading.getBoundingClientRect();
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    // Widened from the reference's 0.8vh→0.2vh band (0.6vh of scroll) to a
    // full viewport height of scroll, so the reveal reads as deliberate
    // rather than snappy. End is pinned just below the sticky header (not
    // 0) — ending at the bare viewport top let the reveal finish only
    // after the heading had already scrolled behind the header, so the
    // "fully unfolded" state was never actually seen.
    const start = vh * 1.0;
    const end = headerH + 40;
    const overall = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);

    foldChars.forEach((el, i) => {
      const local = Math.min(Math.max((overall - i * charSpan) / charSpan, 0), 1);
      const eased = powerOut2(local);
      const sign = el.dataset.foldSign === '1' ? 1 : -1;
      el.style.opacity = String(eased);
      el.style.transform = `rotateY(${sign * 90 * (1 - eased)}deg)`;
    });
  };

  window.addEventListener('scroll', () => {
    if (!foldTicking) {
      foldTicking = true;
      requestAnimationFrame(updateFold);
    }
  }, { passive: true });

  updateFold();
}

// 3D cursor-follow tilt for every card outside the first screen (.hero).
// .team-card is excluded: its transform is already driven continuously by
// the scroll-scrubbed fan-out above, and this effect's direct
// el.style.transform writes (including clearing it to '' on mouseleave)
// would fight that — e.g. mouseleave would wipe the settled state back to
// the CSS-authored pile pose.
// .format-tile is excluded: it's a full-bleed text row now (the "Строка"
// treatment), not a boxed card, and a 3D perspective tilt across a thin
// horizontal strip looks broken — its own fill-sweep hover already gives it
// directional feedback.
// .service-card is excluded: now one full-width card at a time (Full-Bleed
// Snap), a perspective tilt on something that large reads as broken rather
// than premium — and it fought .card-hint's positioning (.tilt-card > *
// resets every direct child to position: relative).
const tiltEls = Array.from(
  document.querySelectorAll(
    '.promo-block, .project-col, .stage-card, .steps-list li'
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

// Services scroll-snap strip: while the cursor is over the cards, redirect
// vertical wheel input into horizontal scroll (both directions) instead of
// letting it scroll the page straight past the strip to the next section.
// Moving the cursor off the cards immediately hands scrolling back to the
// page. Trackpad/shift-wheel gestures that already carry a deltaX are left
// alone — the browser already routes those horizontally on their own.
const servicesGrid = document.querySelector('.services-grid');

if (servicesGrid) {
  let servicesWheelTimer = null;

  servicesGrid.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();

      // scroll-snap-type fights small JS-driven scrollLeft changes — the
      // browser snaps back to the nearest card after almost every tick,
      // making wheel input feel like it does nothing. Suspend snapping
      // while wheel events are actively arriving, then let it resettle
      // shortly after the user stops turning the wheel.
      servicesGrid.style.scrollSnapType = 'none';
      clearTimeout(servicesWheelTimer);
      servicesWheelTimer = setTimeout(() => {
        servicesGrid.style.scrollSnapType = '';
      }, 150);

      servicesGrid.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // "Scroll right" hint badges (.card-hint, one per card except the last —
  // see style.css): dismissed for good the first time this strip is
  // actually scrolled, by any input (wheel, drag, touch, scrollbar). Once
  // the visitor has demonstrated they know to scroll, repeating the hint
  // would just be noise.
  const serviceHints = servicesGrid.querySelectorAll('.card-hint');
  if (serviceHints.length) {
    let hintsDismissed = false;
    servicesGrid.addEventListener('scroll', () => {
      if (hintsDismissed) return;
      if (servicesGrid.scrollLeft > 20) {
        hintsDismissed = true;
        serviceHints.forEach((hint) => hint.classList.add('is-dismissed'));
      }
    }, { passive: true });
  }
}

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
}
