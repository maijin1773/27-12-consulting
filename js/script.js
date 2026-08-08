const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach((el) => revealObserver.observe(el));

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
    '.team-card, .format-tile, .service-card, .promo-block, .project-col, .stage-card, .fix-block, .steps-list li'
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
