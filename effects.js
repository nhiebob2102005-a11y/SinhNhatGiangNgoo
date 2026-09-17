(() => {
  'use strict';

  const root = document.documentElement;
  const canvas = document.querySelector('#celebrationCanvas');
  const context = canvas?.getContext('2d');
  const toggle = document.querySelector('#effectsToggle');
  const label = document.querySelector('#effectsLabel');
  const progress = document.querySelector('#readingProgress');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const photoCards = Array.from(document.querySelectorAll('.photo-card'));
  const hero = document.querySelector('.hero-art');
  const colors = ['#de817d', '#e5b74d', '#7fada6', '#edb9a7', '#c79755'];
  const particles = [];
  let width = window.innerWidth;
  let height = window.innerHeight;
  let enabled = !motion.matches;
  let userEnabled = true;
  let animationFrame = 0;
  let progressFrame = 0;
  let lastFrame = 0;
  let ambientElapsed = 0;
  let lastTrail = 0;
  let lastPointer = null;
  let welcomeCelebration = 0;

  const random = (min, max) => min + Math.random() * (max - min);
  const mobile = () => width < 768 || !finePointer.matches;
  const maxParticles = () => mobile() ? 60 : 150;
  const canAnimate = () => enabled && !document.hidden && Boolean(context);

  function resetParallax() {
    photoCards.forEach((card) => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
    hero?.style.removeProperty('--pointer-x');
    hero?.style.removeProperty('--pointer-y');
    lastPointer = null;
  }

  function clearParticles() {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    if (welcomeCelebration) window.clearTimeout(welcomeCelebration);
    welcomeCelebration = 0;
    animationFrame = 0;
    lastFrame = 0;
    particles.length = 0;
    ambientElapsed = 0;
    context?.clearRect(0, 0, width, height);
  }

  function requestFrame() {
    if (!animationFrame && canAnimate()) animationFrame = window.requestAnimationFrame(drawFrame);
  }

  function fitCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    if (context) {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (particles.length > maxParticles()) particles.splice(0, particles.length - maxParticles());
    }
    queueProgress();
    requestFrame();
  }

  function addParticle(options) {
    if (particles.length >= maxParticles()) particles.shift();
    particles.push({
      x: 0, y: 0, vx: 0, vy: 0, gravity: 0, age: 0,
      life: random(.65, 1.2), size: random(3, 7),
      rotation: random(-Math.PI, Math.PI), spin: random(-3, 3),
      color: colors[Math.floor(Math.random() * colors.length)],
      type: 'star', opacity: .75, ...options
    });
  }

  function burst(x, y, options = {}) {
    if (!canAnimate()) return;
    const requestedCount = Number.isFinite(options.count) ? options.count : (mobile() ? 10 : 20);
    const count = Math.max(0, Math.min(requestedCount, maxParticles()));
    const originX = Number.isFinite(x) ? x : width / 2;
    const originY = Number.isFinite(y) ? y : height / 2;
    for (let index = 0; index < count; index += 1) {
      const angle = random(-Math.PI, Math.PI);
      const speed = random(40, options.celebration ? 265 : 135);
      const type = options.celebration
        ? ['paper', 'heart', 'star', 'paper'][index % 4]
        : (index % 3 === 0 ? 'heart' : 'star');
      addParticle({
        x: originX, y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (options.celebration ? 110 : 35),
        gravity: options.celebration ? 150 : 60,
        life: options.celebration ? random(1.6, 2.8) : random(.6, 1.15),
        size: options.celebration ? random(4, 10) : random(3, 7),
        opacity: options.celebration ? .95 : .8,
        type
      });
    }
    requestFrame();
  }

  function celebrate(options = {}) {
    if (!canAnimate()) return;
    const count = Number.isFinite(options.count) ? options.count : (mobile() ? 44 : 112);
    const x = Number.isFinite(options.x) ? options.x : width * .5;
    const y = Number.isFinite(options.y) ? options.y : height * .44;
    burst(x, y, { celebration: true, count: Math.round(count * .6) });
    burst(width * .12, height * .7, { celebration: true, count: Math.round(count * .2) });
    burst(width * .88, height * .7, { celebration: true, count: Math.round(count * .2) });
  }

  function drawShape(particle, fade) {
    const size = particle.size;
    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation);
    context.globalAlpha = particle.opacity * fade;
    context.fillStyle = particle.color;
    context.beginPath();
    if (particle.type === 'heart') {
      context.moveTo(0, size * .8);
      context.bezierCurveTo(-size * 1.4, -.15 * size, -size * .75, -size, 0, -.35 * size);
      context.bezierCurveTo(size * .75, -size, size * 1.4, -.15 * size, 0, size * .8);
    } else if (particle.type === 'paper') {
      context.scale(1, .45 + Math.abs(Math.cos(particle.age * 7)) * .55);
      context.rect(-size * .5, -size * .3, size, size * .6);
    } else {
      const points = particle.type === 'twinkle' ? 4 : 5;
      const innerRatio = particle.type === 'twinkle' ? .16 : .42;
      for (let index = 0; index < points * 2; index += 1) {
        const angle = index * Math.PI / points - Math.PI / 2;
        const radius = index % 2 ? size * innerRatio : size;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (!index) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
    }
    context.fill();
    context.restore();
  }

  function drawFrame(now) {
    animationFrame = 0;
    if (!canAnimate()) return;
    const elapsed = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : .016;
    lastFrame = now;
    ambientElapsed += elapsed;
    context.clearRect(0, 0, width, height);
    // A small field of warm twinkles leaves the middle of the page easy to read.
    if (ambientElapsed > (mobile() ? .85 : .38)) {
      ambientElapsed = 0;
      const left = Math.random() < .5;
      addParticle({
        x: left ? random(8, width * .18) : random(width * .82, width - 8),
        y: random(30, height - 35),
        vy: random(-11, -4), size: random(3, 7),
        life: random(1.8, 3.3), type: 'twinkle', opacity: .55, spin: .15
      });
    }
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.age += elapsed;
      if (particle.age >= particle.life || particle.y > height + 35) {
        particles.splice(index, 1);
        continue;
      }
      particle.vy += particle.gravity * elapsed;
      particle.x += particle.vx * elapsed;
      particle.y += particle.vy * elapsed;
      particle.rotation += particle.spin * elapsed;
      const lifetime = particle.age / particle.life;
      const fade = particle.type === 'twinkle'
        ? Math.sin(lifetime * Math.PI)
        : Math.min(1, (1 - lifetime) * 2.8);
      drawShape(particle, fade);
    }
    requestFrame();
  }

  function updateProgress() {
    progressFrame = 0;
    if (!progress) return;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
    progress.style.transform = `scaleX(${fraction})`;
  }

  function queueProgress() {
    if (progress && !progressFrame) progressFrame = window.requestAnimationFrame(updateProgress);
  }

  function syncEffects() {
    enabled = userEnabled && !motion.matches;
    root.dataset.effects = enabled ? 'on' : 'off';
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.disabled = motion.matches;
      toggle.title = motion.matches ? 'Hiệu ứng đang tắt theo cài đặt giảm chuyển động của thiết bị.' : '';
    }
    if (label) label.textContent = motion.matches ? 'Giảm chuyển động' : enabled ? 'Tắt hiệu ứng' : 'Bật hiệu ứng';
    if (enabled) requestFrame();
    else {
      clearParticles();
      resetParallax();
    }
    document.dispatchEvent(new CustomEvent('birthday:effectschange', { detail: { enabled } }));
  }

  toggle?.addEventListener('click', () => {
    userEnabled = !enabled;
    syncEffects();
  });
  motion.addEventListener('change', syncEffects);
  finePointer.addEventListener('change', resetParallax);

  document.addEventListener('pointermove', (event) => {
    if (!canAnimate() || !finePointer.matches || event.pointerType === 'touch' || event.buttons) return;
    const now = performance.now();
    if (now - lastTrail < 48) return;
    if (lastPointer && Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y) < 7) return;
    lastTrail = now;
    lastPointer = { x: event.clientX, y: event.clientY };
    addParticle({
      x: event.clientX + random(-5, 5), y: event.clientY + random(-5, 5),
      vx: random(-12, 12), vy: random(-25, -8), gravity: 27,
      life: random(.45, .85), size: random(3, 5), opacity: .65,
      type: Math.random() < .3 ? 'heart' : 'star'
    });
    requestFrame();
  }, { passive: true });

  document.addEventListener('click', (event) => {
    if (!enabled || !(event.target instanceof Element)) return;
    if (event.target.closest('#effectsToggle, #musicPlayer, input, textarea, select, #scratchCanvas')) return;
    const celebrationButton = event.target.closest('#continueBtn, #candleBtn, #celebrateBtn, #revealGiftBtn');
    const target = event.target.closest('button, a') || event.target;
    const bounds = target.getBoundingClientRect();
    const x = event.detail > 0 ? event.clientX : bounds.left + bounds.width / 2;
    const y = event.detail > 0 ? event.clientY : bounds.top + bounds.height / 2;
    if (celebrationButton?.id === 'continueBtn') {
      burst(x, y);
      if (welcomeCelebration) window.clearTimeout(welcomeCelebration);
      welcomeCelebration = window.setTimeout(() => {
        welcomeCelebration = 0;
        celebrate({ y: height * .4 });
      }, 780);
    } else if (celebrationButton && (celebrationButton.id !== 'candleBtn' || celebrationButton.classList.contains('is-blown'))) {
      celebrate({ x: x || width / 2, y: y || height * .4 });
    } else {
      burst(x, y);
    }
    queueProgress();
  });

  photoCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (!enabled || !finePointer.matches || event.pointerType === 'touch') return;
      const bounds = card.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width - .5;
      const vertical = (event.clientY - bounds.top) / bounds.height - .5;
      card.style.setProperty('--tilt-x', `${(-vertical * 9).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(horizontal * 11).toFixed(2)}deg`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  });

  hero?.addEventListener('pointermove', (event) => {
    if (!enabled || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    hero.style.setProperty('--pointer-x', `${(((event.clientX - bounds.left) / bounds.width - .5) * 13).toFixed(2)}px`);
    hero.style.setProperty('--pointer-y', `${(((event.clientY - bounds.top) / bounds.height - .5) * 10).toFixed(2)}px`);
  }, { passive: true });
  hero?.addEventListener('pointerleave', () => {
    hero.style.removeProperty('--pointer-x');
    hero.style.removeProperty('--pointer-y');
  });

  document.addEventListener('birthday:celebrate', (event) => celebrate(event.detail || {}));
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', fitCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => {
    root.dataset.pageHidden = String(document.hidden);
    if (document.hidden) {
      clearParticles();
      resetParallax();
    } else requestFrame();
  });

  window.birthdayEffects = Object.freeze({ burst, celebrate });
  root.dataset.pageHidden = String(document.hidden);
  fitCanvas();
  syncEffects();
})();
