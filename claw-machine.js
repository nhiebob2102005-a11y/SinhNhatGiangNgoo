(() => {
  'use strict';

  // Change these six personal gifts to customize the machine. Nothing is ordered
  // or redeemed automatically; the collection lasts only for this page visit.
  const CLAW_PRIZES = [
    { title: '1 ly trà sữa trân châu Mixue', icon: '🧋', drink: 'trà sữa trân châu' },
    { title: '1 ly trà sữa trân châu đường đen Mixue', icon: '🧋', drink: 'trà sữa trân châu đường đen' },
    { title: '1 ly trà sữa Bá Vương Mixue', icon: '🧋', drink: 'trà sữa Bá Vương' },
    { title: '1 ly trà đào bốn mùa Mixue', icon: '🍑', drink: 'trà đào bốn mùa' },
    { title: '1 ly nước chanh tươi lạnh Mixue', icon: '🍋', drink: 'nước chanh tươi lạnh' },
    { title: '1 ly trà Olong Kiwi Mixue', icon: '🥝', drink: 'trà Olong Kiwi' }
  ];

  const cabinet = document.querySelector('#clawMachine');
  if (!cabinet) return;
  const ids = [
    'clawStage', 'clawCapsules', 'clawCarriage', 'clawCable', 'clawHead',
    'clawHeldCapsule', 'clawAim', 'clawLeft', 'clawRight', 'clawGrab',
    'clawStatus', 'clawReadout', 'clawRemaining', 'clawCollected',
    'clawOpenPrize', 'clawReset', 'clawOutputLabel', 'clawPrizeDialog',
    'clawPrizeIcon', 'clawPrizeTitle', 'clawPrizeDescription', 'clawPrizeNumber',
    'clawPrizeClose', 'clawPlayAgain', 'clawCollection', 'clawCollectionWrap'
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  if (Object.values(elements).some((element) => !element)) return;
  const {
    clawStage: stage, clawCapsules: capsuleLayer, clawCarriage: carriage,
    clawCable: cable, clawHead: head, clawHeldCapsule: heldLayer,
    clawAim: aim, clawLeft: left, clawRight: right, clawGrab: grab,
    clawStatus: status, clawReadout: readout, clawRemaining: remaining,
    clawCollected: collected, clawOpenPrize: openPrize, clawReset: reset,
    clawOutputLabel: outputLabel, clawPrizeDialog: dialog,
    clawPrizeIcon: prizeIcon, clawPrizeTitle: prizeTitle,
    clawPrizeDescription: prizeDescription, clawPrizeNumber: prizeNumber,
    clawPrizeClose: closePrize, clawPlayAgain: playAgain,
    clawCollection: collection, clawCollectionWrap: collectionWrap
  } = elements;
  const guide = document.getElementById('clawGuide');
  const target = document.getElementById('clawTarget');
  const fingerLeft = document.getElementById('clawFingerLeft');
  const fingerRight = document.getElementById('clawFingerRight');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const svgNS = 'http://www.w3.org/2000/svg';
  const positions = [55, 113, 171, 229, 287, 345];
  const palette = ['#df969c', '#dcb75c', '#96bcb3', '#bfabd1', '#dfab85', '#91b6c8'];
  const controls = [aim, left, right, grab];
  let grabLabel = Array.from(grab.childNodes).find((node) => node.nodeType === 3 && node.textContent.trim());
  if (!grabLabel) {
    grabLabel = document.createTextNode('');
    grab.prepend(grabLabel);
  }
  let capsules = [];
  let prizeQueue = [];
  let pendingPrize = null;
  let busy = false;
  let awarded = 0;
  let aimX = 200;
  let carriageX = 200;
  let extension = 38;
  let activeAnimation = null;
  let draggingPointer = null;

  function svg(tag, attributes = {}, text) {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function makeCapsule(color) {
    const capsule = svg('g', { class: 'claw-capsule' });
    capsule.append(
      svg('circle', { r: 23, fill: '#fff8ee', stroke: '#ffffff', 'stroke-width': 2 }),
      svg('path', { class: 'claw-capsule-top', d: 'M-22 0a22 22 0 0 1 44 0Z', fill: color }),
      svg('path', { class: 'claw-capsule-bottom', d: 'M-22 0a22 22 0 0 0 44 0Z', fill: color, opacity: '.42' }),
      svg('path', { d: 'M-21 0H21', stroke: '#fff', 'stroke-width': '1.5', opacity: '.7' }),
      svg('ellipse', { class: 'claw-capsule-shine', cx: -9, cy: -10, rx: 4, ry: 7, fill: '#fff', opacity: '.55', transform: 'rotate(35 -9 -10)' }),
      svg('circle', { cy: 2, r: 10, fill: '#fffaf2', opacity: '.95' }),
      svg('text', { class: 'claw-capsule-mark', x: 0, y: 7, 'text-anchor': 'middle', fill: '#785b50', 'font-size': 15, 'font-weight': 700, 'font-family': 'sans-serif' }, '?')
    );
    return capsule;
  }

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function fastMotion() {
    return reducedMotion.matches || document.documentElement.dataset.effects === 'off' || document.hidden;
  }

  // Every transition has a timeout fallback and can finish immediately if the
  // tab is hidden or motion is disabled. No animation frame runs while idle.
  function animate(duration, update) {
    if (fastMotion()) {
      update(1);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let frame = 0;
      let timeout = 0;
      let finished = false;
      const started = performance.now();
      const animation = { finish };
      function finish() {
        if (finished) return;
        finished = true;
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
        update(1);
        if (activeAnimation === animation) activeAnimation = null;
        resolve();
      }
      function tick(now) {
        if (fastMotion()) { finish(); return; }
        const progress = Math.min(1, (now - started) / duration);
        update(progress * progress * (3 - 2 * progress));
        if (progress === 1) finish();
        else frame = window.requestAnimationFrame(tick);
      }
      activeAnimation = animation;
      timeout = window.setTimeout(finish, duration + 100);
      frame = window.requestAnimationFrame(tick);
    });
  }

  function paintClaw() {
    carriage.setAttribute('transform', `translate(${carriageX} 14)`);
    cable.setAttribute('y2', String(extension));
    head.setAttribute('transform', `translate(0 ${extension})`);
  }

  function moveClaw(x, length, duration) {
    const oldX = carriageX;
    const oldLength = extension;
    return animate(duration, (progress) => {
      carriageX = oldX + (x - oldX) * progress;
      extension = oldLength + (length - oldLength) * progress;
      paintClaw();
    });
  }

  function grip(closed) {
    head.classList.toggle('is-gripping', closed);
    fingerLeft?.setAttribute('d', closed ? 'M-11 7L-18 24Q-18 34-4 38' : 'M-11 7L-26 25Q-28 32-19 36');
    fingerRight?.setAttribute('d', closed ? 'M11 7L18 24Q18 34 4 38' : 'M11 7L26 25Q28 32 19 36');
  }

  function setPhase(phase, label) {
    cabinet.dataset.state = phase;
    readout.textContent = label;
  }

  function say(message) {
    if (status.textContent !== message) status.textContent = message;
  }

  function syncControls() {
    const locked = busy || Boolean(pendingPrize) || capsules.length === 0;
    controls.forEach((control) => { control.disabled = locked; });
    openPrize.disabled = !pendingPrize || busy;
    reset.disabled = busy || Boolean(pendingPrize) || capsules.length > 0;
    remaining.textContent = String(capsules.length);
    collected.textContent = String(awarded);
    cabinet.classList.toggle('is-prize-ready', Boolean(pendingPrize) && !busy);
    cabinet.classList.toggle('is-empty', capsules.length === 0);
    cabinet.setAttribute('aria-busy', String(busy));
    grabLabel.textContent = `${busy ? 'Đang gắp…' : capsules.length === 0 ? 'Đã gắp hết quà' : 'Gắp quà ngay'} `;
    outputLabel.textContent = pendingPrize ? (pendingPrize.revealed ? 'XEM LẠI PHẦN THƯỞNG' : 'MỞ QUÀ BÍ ẨN') : 'QUÀ ĐANG CHỜ BẠN';
  }

  function setAim(value) {
    if (busy || pendingPrize || capsules.length === 0) return;
    aimX = Math.max(40, Math.min(360, Number(value) || 200));
    aim.value = String(aimX);
    const percent = Math.round((aimX - 40) / 320 * 100);
    aim.setAttribute('aria-valuetext', `${percent}% từ trái sang phải`);
    carriageX = aimX;
    paintClaw();
    guide?.setAttribute('x1', String(aimX));
    guide?.setAttribute('x2', String(aimX));
    target?.setAttribute('cx', String(aimX));
  }

  function refill() {
    if (busy || pendingPrize) return;
    awarded = 0;
    prizeQueue = shuffle(CLAW_PRIZES);
    capsuleLayer.replaceChildren();
    heldLayer.replaceChildren();
    heldLayer.setAttribute('transform', 'translate(0 38)');
    heldLayer.removeAttribute('opacity');
    collection.replaceChildren();
    collectionWrap.hidden = true;
    capsules = positions.map((x, index) => {
      const element = makeCapsule(palette[index]);
      element.setAttribute('transform', `translate(${x} 255)`);
      capsuleLayer.append(element);
      return { x, color: palette[index], element };
    });
    extension = 38;
    grip(false);
    setPhase('idle', 'SẴN SÀNG');
    setAim(200);
    syncControls();
    say('Di chuyển càng gắp đến một viên quà, rồi bấm Gắp quà ngay.');
  }

  async function catchPrize() {
    if (busy || pendingPrize || capsules.length === 0) return;
    busy = true;
    draggingPointer = null;
    syncControls();
    setPhase('descending', 'ĐANG HẠ CÀNG');
    say('Càng gắp đang hạ xuống…');
    const nearest = capsules.reduce((best, capsule) => Math.abs(capsule.x - aimX) < Math.abs(best.x - aimX) ? capsule : best);
    const caught = Math.abs(nearest.x - aimX) <= 25 ? nearest : null;
    await moveClaw(aimX, 203, 470);
    setPhase('grabbing', 'GIỮ THẬT CHẶT');
    grip(true);
    await animate(140, () => {});
    if (caught) {
      caught.element.remove();
      capsules = capsules.filter((capsule) => capsule !== caught);
      heldLayer.append(makeCapsule(caught.color));
      pendingPrize = { ...prizeQueue.shift(), revealed: false, number: awarded + 1 };
      remaining.textContent = String(capsules.length);
    }
    setPhase('ascending', caught ? 'GẮP ĐƯỢC RỒI!' : 'SUÝT NỮA THÌ…');
    await moveClaw(aimX, 38, 430);
    if (!caught) {
      grip(false);
      busy = false;
      setPhase('idle', 'THỬ LẠI NHÉ');
      syncControls();
      say('Suýt trúng rồi! Đưa vạch ngắm vào giữa một viên quà và thử lại nhé.');
      grab.focus({ preventScroll: true });
      return;
    }
    setPhase('delivering', 'ĐƯA QUÀ VỀ NÀO');
    await moveClaw(340, 38, 360);
    await moveClaw(340, 110, 200);
    grip(false);
    await animate(260, (progress) => {
      heldLayer.setAttribute('transform', `translate(0 ${38 + progress * 105})`);
      heldLayer.setAttribute('opacity', String(1 - progress));
    });
    heldLayer.replaceChildren();
    heldLayer.setAttribute('transform', 'translate(0 38)');
    heldLayer.removeAttribute('opacity');
    await moveClaw(aimX, 38, 300);
    busy = false;
    setPhase('ready', 'MỞ QUÀ THÔI!');
    syncControls();
    say('Bạn gắp được một viên quà bí ẩn! Bấm Mở quà để khám phá phần thưởng.');
    openPrize.focus({ preventScroll: true });
  }

  function revealPrize() {
    if (busy || !pendingPrize || dialog.open) return;
    prizeIcon.textContent = pendingPrize.icon;
    prizeTitle.textContent = pendingPrize.title;
    prizeDescription.textContent = `Phần thưởng của bạn là một ly ${pendingPrize.drink} Mixue. Chụp lại chiếc vé này và nhắn mình để cùng chọn ngày nhận nhé.`;
    prizeNumber.textContent = `${String(pendingPrize.number).padStart(2, '0')} / ${String(CLAW_PRIZES.length).padStart(2, '0')}`;
    playAgain.textContent = capsules.length ? 'Gắp thêm một viên' : 'Về máy gắp';
    dialog.showModal();
    prizeTitle.focus({ preventScroll: true });
    if (pendingPrize.revealed) return;
    pendingPrize.revealed = true;
    awarded += 1;
    const item = document.createElement('li');
    item.className = 'claw-collection-item';
    const icon = document.createElement('span');
    icon.className = 'claw-collection-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = pendingPrize.icon;
    const title = document.createElement('span');
    title.className = 'claw-collection-title';
    title.textContent = pendingPrize.title;
    item.append(icon, title);
    collection.append(item);
    collectionWrap.hidden = false;
    syncControls();
    document.dispatchEvent(new CustomEvent('birthday:celebrate', { detail: { count: 70 } }));
  }

  function resumeGame() {
    if (!pendingPrize || !pendingPrize.revealed) return;
    pendingPrize = null;
    dialog.close();
    setPhase('idle', capsules.length ? 'SẴN SÀNG' : 'TRỌN BỘ BẤT NGỜ');
    syncControls();
    if (capsules.length) {
      say('Thêm một bất ngờ đang chờ. Chọn viên quà tiếp theo nhé!');
      grab.focus({ preventScroll: true });
    } else {
      say('Bạn đã khám phá đủ 6 phần thưởng! Bấm Nạp lại quà để chơi một lượt mới.');
      reset.focus({ preventScroll: true });
    }
  }

  function aimFromPointer(event) {
    const matrix = stage.getScreenCTM();
    if (!matrix) return;
    const point = stage.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    setAim(point.matrixTransform(matrix.inverse()).x);
  }

  aim.addEventListener('input', () => setAim(aim.value));
  left.addEventListener('click', () => setAim(aimX - 14));
  right.addEventListener('click', () => setAim(aimX + 14));
  grab.addEventListener('click', catchPrize);
  openPrize.addEventListener('click', revealPrize);
  closePrize.addEventListener('click', () => dialog.close());
  playAgain.addEventListener('click', resumeGame);
  reset.addEventListener('click', () => {
    if (reset.disabled) return;
    refill();
    grab.focus({ preventScroll: true });
  });
  dialog.addEventListener('close', () => {
    if (pendingPrize) openPrize.focus({ preventScroll: true });
  });
  cabinet.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target !== cabinet && ![left, right, grab].includes(event.target)) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setAim(aimX + (event.key === 'ArrowLeft' ? -10 : 10));
    } else if (event.target === cabinet && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      if (!event.repeat) catchPrize();
    }
  });
  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || busy || pendingPrize || !capsules.length) return;
    draggingPointer = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    aimFromPointer(event);
  });
  stage.addEventListener('pointermove', (event) => {
    if (draggingPointer === event.pointerId) aimFromPointer(event);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => stage.addEventListener(type, () => { draggingPointer = null; }));
  function finishIfNeeded() {
    if (fastMotion()) activeAnimation?.finish();
  }
  document.addEventListener('visibilitychange', finishIfNeeded);
  document.addEventListener('birthday:effectschange', finishIfNeeded);
  reducedMotion.addEventListener('change', finishIfNeeded);
  refill();
})();
