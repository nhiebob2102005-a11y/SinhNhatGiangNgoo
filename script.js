const revealItems = document.querySelectorAll('.reveal');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
function animationEnabled() {
  return !motionPreference.matches && document.documentElement.dataset.effects !== 'off';
}
function scrollToSection(target, options = {}) {
  target.scrollIntoView({ behavior: animationEnabled() ? 'smooth' : 'instant', ...options });
}
let journeyStarted = false;
const welcomePasscode = '05102005';
const welcomeUnlockForm = document.querySelector('#welcomeUnlockForm');
const welcomePasscodeInput = document.querySelector('#welcomePasscode');
const welcomeCodeError = document.querySelector('#welcomeCodeError');
const welcomeUnlocked = document.querySelector('#welcomeUnlocked');
const welcomeBackButton = document.querySelector('#welcomeBackBtn');
let welcomeCodeAccepted = false;

welcomeUnlockForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (journeyStarted) return;
  const code = welcomePasscodeInput.value;
  if (code !== welcomePasscode) {
    welcomeCodeAccepted = false;
    welcomeCodeError.textContent = !code
      ? 'Bạn nhập mật mã trước nhé.'
      : !/^[0-9]{8}$/.test(code)
        ? 'Mật mã cần đủ 8 chữ số nhé.'
        : 'Mật mã chưa đúng. Bạn thử lại nhé!';
    welcomePasscodeInput.setAttribute('aria-invalid', 'true');
    welcomePasscodeInput.focus();
    welcomePasscodeInput.select();
    return;
  }
  welcomeCodeAccepted = true;
  welcomeCodeError.textContent = '';
  welcomePasscodeInput.removeAttribute('aria-invalid');
  welcomeUnlockForm.reset();
  welcomePasscodeInput.blur();
  welcomeUnlockForm.hidden = true;
  welcomeUnlocked.hidden = false;
  document.querySelector('#welcomeSuccessTitle').focus({ preventScroll: true });
});
welcomePasscodeInput.addEventListener('input', () => {
  welcomeCodeError.textContent = '';
  welcomePasscodeInput.removeAttribute('aria-invalid');
});
welcomeBackButton.addEventListener('click', () => {
  if (journeyStarted) return;
  welcomeCodeAccepted = false;
  welcomeUnlocked.hidden = true;
  welcomeUnlockForm.hidden = false;
  welcomeUnlockForm.reset();
  welcomeCodeError.textContent = '';
  welcomePasscodeInput.removeAttribute('aria-invalid');
  welcomePasscodeInput.focus({ preventScroll: true });
});

const birthdayCountdownTarget = Date.parse(document.querySelector('#birthdayCountdownTarget').dateTime);
const countdownFields = ['Days', 'Hours', 'Minutes', 'Seconds'].map(unit => document.querySelector(`#countdown${unit}`));
let countdownTimer;
function updateBirthdayCountdown() {
  if (journeyStarted) return;
  // Derive from the clock so background tabs and screen locks cannot cause drift.
  const totalSeconds = Math.max(0, Math.ceil((birthdayCountdownTarget - Date.now()) / 1000));
  const values = [Math.floor(totalSeconds / 86400), Math.floor(totalSeconds / 3600) % 24, Math.floor(totalSeconds / 60) % 60, totalSeconds % 60];
  countdownFields.forEach((field, index) => {
    const value = String(values[index]).padStart(2, '0');
    if (field.textContent !== value) field.textContent = value;
  });
  document.querySelector('#countdownMessage').hidden = totalSeconds > 0;
  if (totalSeconds === 0) window.clearInterval(countdownTimer);
}
countdownTimer = window.setInterval(updateBirthdayCountdown, 1000);
updateBirthdayCountdown();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateBirthdayCountdown();
});

document.querySelector('#continueBtn').addEventListener('click', () => {
  if (journeyStarted || !welcomeCodeAccepted) return;
  journeyStarted = true;
  window.clearInterval(countdownTimer);
  const welcomeScreen = document.querySelector('#welcomeScreen');
  const continueButton = document.querySelector('#continueBtn');
  continueButton.disabled = true;
  welcomeBackButton.disabled = true;
  continueButton.setAttribute('aria-busy', 'true');
  startMusic();
  function openBirthdayPage() {
    welcomeScreen.hidden = true;
    welcomeScreen.classList.remove('is-opening');
    continueButton.removeAttribute('aria-busy');
    document.querySelector('#birthdayPage').hidden = false;
    document.querySelector('#birthdayPage').classList.add('journey-entered');
    musicToggle.hidden = false;
    document.querySelector('#musicPlayer').hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const heroTitle = document.querySelector('#hero-title');
    heroTitle.setAttribute('tabindex', '-1');
    heroTitle.focus({ preventScroll: true });
    window.dispatchEvent(new Event('resize'));
  }
  if (animationEnabled()) {
    welcomeScreen.classList.add('is-opening');
    window.setTimeout(openBirthdayPage, 760);
  } else {
    openBirthdayPage();
  }
});
const petalLayer = document.querySelector('#fallingPetals');
const petalColors = ['#ed91a4', '#cf6b72', '#e4b969', '#aab784', '#f3b7c5', '#dda295'];
function updatePetals() {
  petalLayer.replaceChildren();
  if (!animationEnabled()) {
    if (typeof confetti === 'function') confetti.reset();
    document.querySelectorAll('.gift-burst').forEach((burst) => burst.remove());
    return;
  }
  const petalFragment = document.createDocumentFragment();
  const petalCount = window.innerWidth < 768 ? 30 : 64;
  for (let index = 0; index < petalCount; index += 1) {
    const petal = document.createElement('i');
    petal.className = `paper-petal petal-depth-${index % 3}${index % 9 === 0 ? ' is-heart' : ''}`;
    petal.style.setProperty('--petal-left', `${Math.random() * 100}%`);
    petal.style.setProperty('--petal-duration', `${12 + Math.random() * 18}s`);
    petal.style.setProperty('--petal-delay', `${-Math.random() * 30}s`);
    petal.style.setProperty('--petal-size', `${8 + (index % 3) * 4 + Math.random() * 8}px`);
    petal.style.setProperty('--petal-drift', `${Math.random() * 360 - 180}px`);
    petal.style.setProperty('--petal-sway', `${15 + Math.random() * 35}px`);
    petal.style.setProperty('--petal-opacity', `${.35 + Math.random() * .4}`);
    petal.style.setProperty('--petal-flutter', `${2 + Math.random() * 3}s`);
    petal.style.setProperty('--petal-color', petalColors[index % petalColors.length]);
    petal.append(document.createElement('span'));
    petalFragment.append(petal);
  }
  petalLayer.append(petalFragment);
}
updatePetals();
motionPreference.addEventListener('change', updatePetals);
document.addEventListener('birthday:effectschange', updatePetals);
window.matchMedia('(max-width: 767px)').addEventListener('change', updatePetals);
const toastMessage = document.querySelector('#toastMessage');
const openCardButton = document.querySelector('#openCardBtn');
const wishButton = document.querySelector('#wishBtn');
const celebrateButton = document.querySelector('#celebrateBtn');
const candleButton = document.querySelector('#candleBtn');
const candleStatus = document.querySelector('#candleStatus');
candleButton.setAttribute('aria-pressed', 'false');
candleButton.addEventListener('click', () => {
  const blown = candleButton.classList.toggle('is-blown');
  candleButton.setAttribute('aria-pressed', String(blown));
  candleButton.setAttribute('aria-label', blown ? 'Thắp lại ngọn nến' : 'Thổi nến để ước');
  candleStatus.textContent = blown
    ? 'Điều ước của bạn sẽ thành hiện thực ✦ Chạm để thắp lại nến.'
    : 'Chạm vào ngọn nến để ước ✦';
  if (blown) launchConfetti();
});

const giftButton = document.querySelector('#giftBtn');
const giftResult = document.querySelector('#giftResult');
const giftTitle = document.querySelector('#giftResultTitle');
const giftMessage = document.querySelector('#giftResultMessage');
const giftSurprises = [
  { title: 'Một vé mời đi ăn bánh 🎂', message: 'Giang chọn chiếc bánh mình thích, mình dành một buổi ngồi cùng nhau và kể đủ thứ chuyện nhé. Khi nào rảnh, nhắn mình để chốt lịch nha!' },
  { title: 'Một lời nhắn dành riêng cho bạn ✨', message: 'Mong Giang luôn được yêu thương, có đủ can đảm theo đuổi điều mình thích và tìm thấy niềm vui trong cả những ngày bình thường nhất.' },
  { title: 'Một vé cho buổi chiều thảnh thơi ☀', message: 'Tạm gác những bận rộn, chọn một bài nhạc hay và tự thưởng cho mình một buổi chiều thật dễ chịu. Hôm nay, hãy dành chút dịu dàng cho bản thân nhé!' }
];
let giftIndex = -1;
function burstGiftPaper() {
  if (!animationEnabled() || typeof Element.prototype.animate !== 'function') return;
  document.querySelectorAll('.gift-burst').forEach((burst) => burst.remove());
  const bounds = giftButton.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.className = 'gift-burst';
  burst.setAttribute('aria-hidden', 'true');
  burst.style.left = `${bounds.left + bounds.width / 2}px`;
  burst.style.top = `${bounds.top + 65}px`;
  document.body.append(burst);
  const count = window.innerWidth < 768 ? 65 : 100;
  for (let index = 0; index < count; index += 1) {
    const paper = document.createElement('i');
    paper.className = index % 3 === 0 ? 'gift-paper is-petal' : 'gift-paper';
    paper.style.backgroundColor = petalColors[index % petalColors.length];
    const size = 7 + Math.random() * 9;
    paper.style.width = `${size}px`;
    paper.style.height = `${size * .65}px`;
    burst.append(paper);
    const horizontal = (Math.random() - .5) * Math.min(window.innerWidth * 1.2, 950);
    const height = 110 + Math.random() * 250;
    const spin = (Math.random() - .5) * 1400;
    paper.animate([
      { transform: 'translate(-50%, -50%) scale(.3)', opacity: 1, offset: 0 },
      { transform: `translate(${horizontal * .65}px, ${-height}px) rotate(${spin * .4}deg) scale(1)`, opacity: 1, offset: .3 },
      { transform: `translate(${horizontal}px, ${100 + Math.random() * 250}px) rotate(${spin}deg) scale(.7)`, opacity: 0, offset: 1 }
    ], { duration: 1700 + Math.random() * 1000, delay: Math.random() * 180, easing: 'linear', fill: 'both' });
  }
  window.setTimeout(() => burst.remove(), 3100);
}
function chooseTicketPrize() {
  // Advance by a random nonzero step so consecutive gifts are different.
  giftIndex = giftIndex < 0 ? 0 : (giftIndex + 1 + Math.floor(Math.random() * (giftSurprises.length - 1))) % giftSurprises.length;
  giftTitle.textContent = giftSurprises[giftIndex].title;
  giftMessage.textContent = giftSurprises[giftIndex].message;
}
const scratchCanvas = document.querySelector('#scratchCanvas');
const scratchContext = scratchCanvas.getContext('2d', { willReadFrequently: true });
const scratchStatus = document.querySelector('#scratchStatus');
const revealGiftButton = document.querySelector('#revealGiftBtn');
let ticketRevealed = false;
let scratchPointer = null;
let lastScratchPoint = null;
let scratchMoves = 0;
function prepareTicket() {
  chooseTicketPrize();
  ticketRevealed = false;
  scratchPointer = null;
  lastScratchPoint = null;
  scratchMoves = 0;
  giftResult.setAttribute('aria-hidden', 'true');
  scratchCanvas.hidden = false;
  if (revealGiftButton) revealGiftButton.hidden = false;
  scratchStatus.textContent = 'Đã cào 0% — cào đủ 80% để nhận quà nhé!';
  if (!scratchContext) return;
  scratchContext.globalCompositeOperation = 'source-over';
  const shine = scratchContext.createLinearGradient(0, 0, 600, 420);
  shine.addColorStop(0, '#e9be64');
  shine.addColorStop(.45, '#fff0bf');
  shine.addColorStop(1, '#bd8536');
  scratchContext.fillStyle = shine;
  scratchContext.fillRect(0, 0, 600, 420);
  for (let i = 0; i < 900; i += 1) {
    scratchContext.fillStyle = i % 2 ? '#ffffff66' : '#91632833';
    scratchContext.fillRect(Math.random() * 600, Math.random() * 420, 2, 2);
  }
  scratchContext.textAlign = 'center';
  scratchContext.fillStyle = '#664517';
  scratchContext.font = 'bold 32px sans-serif';
  scratchContext.fillText('CÀO ĐỂ NHẬN QUÀ', 300, 200);
  scratchContext.font = '22px sans-serif';
  scratchContext.fillText('Một bất ngờ dành cho Giang ♡', 300, 244);
}
function revealTicket(fromButton = false) {
  if (ticketRevealed) return;
  ticketRevealed = true;
  scratchPointer = null;
  scratchCanvas.hidden = true;
  giftResult.removeAttribute('aria-hidden');
  if (revealGiftButton) revealGiftButton.hidden = true;
  scratchStatus.textContent = `Chúc mừng! Món quà dành cho bạn: ${giftTitle.textContent}`;
  if (fromButton) giftTitle.focus({ preventScroll: true });
  burstGiftPaper();
  giftResult.classList.add('gift-unwrapped');
  if (!fromButton) document.dispatchEvent(new CustomEvent('birthday:celebrate'));
}
revealGiftButton?.addEventListener('click', () => revealTicket(true));
function scratchAt(event) {
  if (!scratchContext || ticketRevealed) return;
  const rect = scratchCanvas.getBoundingClientRect();
  const point = { x: (event.clientX - rect.left) * 600 / rect.width, y: (event.clientY - rect.top) * 420 / rect.height };
  scratchContext.globalCompositeOperation = 'destination-out';
  scratchContext.lineWidth = 48;
  scratchContext.lineCap = 'round';
  scratchContext.beginPath();
  scratchContext.moveTo(lastScratchPoint?.x ?? point.x, lastScratchPoint?.y ?? point.y);
  scratchContext.lineTo(point.x, point.y);
  scratchContext.stroke();
  scratchContext.beginPath();
  scratchContext.arc(point.x, point.y, 24, 0, Math.PI * 2);
  scratchContext.fill();
  lastScratchPoint = point;
  if (++scratchMoves % 8 !== 0) return;
  checkScratchProgress();
}
function checkScratchProgress() {
  if (!scratchContext || ticketRevealed) return;
  const pixels = scratchContext.getImageData(0, 0, 600, 420).data;
  let cleared = 0;
  let sampled = 0;
  for (let i = 3; i < pixels.length; i += 4) { sampled += 1; if (pixels[i] < 128) cleared += 1; }
  const progress = cleared / sampled;
  scratchStatus.textContent = `Đã cào ${Math.floor(progress * 100)}% — cào đủ 80% để nhận quà nhé!`;
  if (progress >= .8) revealTicket();
}
scratchCanvas.addEventListener('pointerdown', (event) => {
  if (scratchPointer !== null || event.button !== 0 || ticketRevealed) return;
  scratchPointer = event.pointerId;
  lastScratchPoint = null;
  scratchCanvas.setPointerCapture(event.pointerId);
  scratchAt(event);
});
scratchCanvas.addEventListener('pointermove', (event) => {
  if (event.pointerId === scratchPointer) scratchAt(event);
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  scratchCanvas.addEventListener(eventName, () => {
    scratchPointer = null;
    lastScratchPoint = null;
    checkScratchProgress();
  });
}
prepareTicket();
// Change these values to match the recipient. This is a playful client-side gate.
const letterRecipient = { name: 'Vũ Thị Giang', passcode: '0510' };
const letterUnlockForm = document.querySelector('#letterUnlockForm');
const birthdayLetter = document.querySelector('#birthdayLetter');
const letterUnlockStatus = document.querySelector('#letterUnlockStatus');
const letterInputs = [letterUnlockForm.elements.recipient, letterUnlockForm.elements.passcode];
function clearLetterError() {
  letterUnlockStatus.textContent = '';
  letterInputs.forEach((input) => input.removeAttribute('aria-invalid'));
}
letterInputs.forEach((input) => {
  const descriptionIds = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  descriptionIds.add('letterUnlockStatus');
  input.setAttribute('aria-describedby', [...descriptionIds].join(' '));
  input.addEventListener('input', clearLetterError);
});
function normalizeRecipientName(value) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}
letterUnlockForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = letterUnlockForm.elements.recipient.value;
  const passcode = letterUnlockForm.elements.passcode.value;
  if (normalizeRecipientName(name) !== normalizeRecipientName(letterRecipient.name) || passcode !== letterRecipient.passcode) {
    letterInputs.forEach((input) => input.setAttribute('aria-invalid', 'true'));
    letterUnlockStatus.textContent = 'Tên hoặc mật mã chưa đúng. Bạn kiểm tra lại nhé!';
    letterInputs[0].focus({ preventScroll: true });
    return;
  }
  clearLetterError();
  letterUnlockForm.reset();
  letterUnlockForm.hidden = true;
  birthdayLetter.hidden = false;
  birthdayLetter.focus({ preventScroll: true });
  scrollToSection(birthdayLetter, { block: 'center' });
  launchConfetti();
  document.dispatchEvent(new CustomEvent('birthday:celebrate'));
});
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  birthdayLetter.hidden = true;
  letterUnlockForm.hidden = false;
  letterUnlockForm.reset();
  clearLetterError();
});
const birthdayMusic = document.querySelector('#birthdayMusic');
const musicToggle = document.querySelector('#musicToggle');
const musicLabel = document.querySelector('#musicLabel');
let musicManuallyPaused = false;
let musicStarting = false;
let musicNeedsInteraction = true;

birthdayMusic.volume = 0.35;

function updateMusicControl() {
  const playing = !birthdayMusic.paused;
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', playing ? 'Tạm dừng nhạc' : 'Phát nhạc');
  musicLabel.textContent = playing ? 'Tạm dừng nhạc' : 'Phát nhạc';
}

async function startMusic() {
  if (!journeyStarted) return;
  if (musicStarting || musicManuallyPaused || !birthdayMusic.paused) return;
  musicStarting = true;
  musicNeedsInteraction = false;
  musicToggle.setAttribute('aria-busy', 'true');
  try {
    if (birthdayMusic.error || birthdayMusic.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      birthdayMusic.load();
    }
    await birthdayMusic.play();
    // A second click can pause while the play promise is still pending.
    if (musicManuallyPaused) birthdayMusic.pause();
  } catch (error) {
    musicNeedsInteraction = error.name === 'NotAllowedError' && !musicManuallyPaused;
    if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
      musicLabel.textContent = 'Thử lại nhạc';
    }
  } finally {
    musicStarting = false;
    musicToggle.removeAttribute('aria-busy');
  }
}

birthdayMusic.addEventListener('play', updateMusicControl);
birthdayMusic.addEventListener('pause', updateMusicControl);
birthdayMusic.addEventListener('error', () => {
  musicLabel.textContent = 'Nhạc chưa tải được';
});
musicToggle.addEventListener('click', () => {
  if (musicStarting || !birthdayMusic.paused) {
    musicManuallyPaused = true;
    musicNeedsInteraction = false;
    birthdayMusic.pause();
    updateMusicControl();
  } else {
    musicManuallyPaused = false;
    startMusic();
  }
});
function startMusicOnInteraction(event) {
  if (!musicNeedsInteraction || musicManuallyPaused) return;
  if (event.target instanceof Element && event.target.closest('#musicPlayer')) return;
  startMusic();
}
document.addEventListener('click', startMusicOnInteraction);
document.addEventListener('keydown', startMusicOnInteraction);

const wishes = [
  'Chúc bạn hôm nay nhận được thật nhiều tin nhắn dễ thương ✦',
  'Tuổi mới: nhiều niềm vui, ít deadline và thật nhiều chuyến đi!',
  'Mong điều tốt lành sẽ tìm thấy bạn thường xuyên hơn nhé ☼',
  'Bạn xứng đáng với những điều tử tế và bất ngờ thật vui.'
];

if ('IntersectionObserver' in window && !motionPreference.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealItems.forEach((item) => observer.observe(item));
  motionPreference.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    revealItems.forEach((item) => item.classList.add('is-visible'));
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

let toastTimer;
function showToast(message) {
  window.clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toastMessage.classList.add('show');
  toastTimer = window.setTimeout(() => toastMessage.classList.remove('show'), 4200);
}

function launchConfetti() {
  if (!animationEnabled() || document.hidden) return;
  if (typeof confetti !== 'function') {
    window.birthdayEffects?.celebrate();
    return;
  }
  confetti({ particleCount: 90, spread: 75, origin: { y: .68 }, disableForReducedMotion: true, colors: ['#f7c948', '#ec6b5d', '#8fc4c2', '#fffaf1'] });
}

openCardButton.addEventListener('click', () => {
  scrollToSection(document.querySelector('#letter'));
  window.setTimeout(launchConfetti, 550);
});

wishButton.addEventListener('click', () => {
  const wish = wishes[Math.floor(Math.random() * wishes.length)];
  showToast(wish);
  if (!animationEnabled() || typeof wishButton.animate !== 'function') return;
  wishButton.animate([
    { transform: 'rotate(8deg) scale(1)' },
    { transform: 'rotate(-3deg) scale(1.08)' },
    { transform: 'rotate(8deg) scale(1)' }
  ], { duration: 450, easing: 'ease-out' });
});

celebrateButton.addEventListener('click', () => {
  launchConfetti();
  window.setTimeout(launchConfetti, 250);
  showToast('Chúc mừng sinh nhật, Vũ Thị Giang! Hôm nay là ngày của bạn ✦');
});

const photoDialog = document.querySelector('#photoDialog');
const photoButtons = [...document.querySelectorAll('.photo-open')];
const lightboxImage = document.querySelector('#lightboxImage');
const lightboxCaption = document.querySelector('#lightboxCaption');
const previousPhotoButton = document.querySelector('#prevPhoto');
const nextPhotoButton = document.querySelector('#nextPhoto');
const closePhotoButton = document.querySelector('#closePhotoDialog');

if (photoDialog && lightboxImage && lightboxCaption && previousPhotoButton && nextPhotoButton && closePhotoButton && photoButtons.length) {
  let currentPhotoIndex = 0;
  let photoOpener = null;
  let previousOverflow = '';

  function showPhoto(index) {
    currentPhotoIndex = (index + photoButtons.length) % photoButtons.length;
    const card = photoButtons[currentPhotoIndex].closest('.photo-card');
    const photo = card.querySelector('img');
    const title = card.querySelector('figcaption h3')?.textContent.trim() || photo.alt;
    const description = card.querySelector('figcaption p')?.textContent.trim() || '';
    lightboxImage.src = photo.currentSrc || photo.src;
    lightboxImage.alt = photo.alt;
    if (photoDialog.open && animationEnabled() && typeof lightboxImage.animate === 'function') {
      lightboxImage.animate([
        { opacity: .25, transform: 'scale(.97)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { duration: 320, easing: 'ease-out' });
    }
    lightboxCaption.textContent = `${currentPhotoIndex + 1} / ${photoButtons.length} · ${title}${description ? ` — ${description}` : ''}`;
    previousPhotoButton.disabled = photoButtons.length < 2;
    nextPhotoButton.disabled = photoButtons.length < 2;
  }

  photoButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      photoOpener = button;
      showPhoto(index);
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      photoDialog.showModal();
      closePhotoButton.focus({ preventScroll: true });
    });
  });
  previousPhotoButton.addEventListener('click', () => showPhoto(currentPhotoIndex - 1));
  nextPhotoButton.addEventListener('click', () => showPhoto(currentPhotoIndex + 1));
  closePhotoButton.addEventListener('click', () => photoDialog.close());
  photoDialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(currentPhotoIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  photoDialog.addEventListener('click', (event) => {
    if (event.target !== photoDialog) return;
    const bounds = photoDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) photoDialog.close();
  });
  photoDialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    photoOpener?.focus({ preventScroll: true });
  });
}
