const revealItems = document.querySelectorAll('.reveal');
let journeyStarted = false;
document.querySelector('#continueBtn').addEventListener('click', () => {
  journeyStarted = true;
  document.querySelector('#welcomeScreen').hidden = true;
  document.querySelector('#birthdayPage').hidden = false;
  musicToggle.hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  const heroTitle = document.querySelector('#hero-title');
  heroTitle.setAttribute('tabindex', '-1');
  heroTitle.focus({ preventScroll: true });
  startMusic();
  window.dispatchEvent(new Event('resize'));
});
const petalLayer = document.querySelector('#fallingPetals');
const petalColors = ['#f4a497', '#ec6b5d', '#f7c948', '#8fc4c2', '#fff4d5'];
const petalFragment = document.createDocumentFragment();
for (let index = 0; index < 72; index += 1) {
  const petal = document.createElement('i');
  petal.className = 'paper-petal';
  petal.style.setProperty('--petal-left', `${Math.random() * 100}%`);
  petal.style.setProperty('--petal-duration', `${10 + Math.random() * 14}s`);
  petal.style.setProperty('--petal-delay', `${-Math.random() * 24}s`);
  petal.style.setProperty('--petal-size', `${7 + Math.random() * 14}px`);
  petal.style.setProperty('--petal-drift', `${Math.random() * 220 - 110}px`);
  petal.style.setProperty('--petal-sway', `${8 + Math.random() * 20}px`);
  petal.style.setProperty('--petal-opacity', `${.4 + Math.random() * .4}`);
  petal.style.setProperty('--petal-flutter', `${2 + Math.random() * 3}s`);
  petal.style.setProperty('--petal-color', petalColors[index % petalColors.length]);
  petal.append(document.createElement('span'));
  petalFragment.append(petal);
}
petalLayer.append(petalFragment);
const toastMessage = document.querySelector('#toastMessage');
const openCardButton = document.querySelector('#openCardBtn');
const wishButton = document.querySelector('#wishBtn');
const celebrateButton = document.querySelector('#celebrateBtn');
const candleButton = document.querySelector('#candleBtn');
const candleStatus = document.querySelector('#candleStatus');
candleButton.addEventListener('click', () => {
  const blown = candleButton.classList.toggle('is-blown');
  candleButton.setAttribute('aria-label', blown ? 'Thắp lại ngọn nến' : 'Thổi nến để ước');
  candleStatus.textContent = blown
    ? 'Điều ước của bạn sẽ thành hiện thực ✦ Chạm để thắp lại nến.'
    : 'Chạm vào ngọn nến để ước ✦';
  if (blown) launchConfetti();
});

const giftButton = document.querySelector('#giftBtn');
const giftScene = document.querySelector('#giftScene');
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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
function revealTicket() {
  if (ticketRevealed) return;
  ticketRevealed = true;
  scratchPointer = null;
  scratchCanvas.hidden = true;
  giftResult.removeAttribute('aria-hidden');
  scratchStatus.textContent = `Chúc mừng! Bạn đã cào đủ 80% và nhận được: ${giftTitle.textContent}`;
  burstGiftPaper();
}
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
function normalizeRecipientName(value) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}
letterUnlockForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = letterUnlockForm.elements.recipient.value;
  const passcode = letterUnlockForm.elements.passcode.value;
  if (normalizeRecipientName(name) !== normalizeRecipientName(letterRecipient.name) || passcode !== letterRecipient.passcode) {
    letterUnlockStatus.textContent = 'Tên hoặc mật mã chưa đúng. Bạn kiểm tra lại nhé!';
    return;
  }
  letterUnlockStatus.textContent = '';
  letterUnlockForm.reset();
  letterUnlockForm.hidden = true;
  birthdayLetter.hidden = false;
  birthdayLetter.focus({ preventScroll: true });
  birthdayLetter.scrollIntoView({ behavior: 'smooth', block: 'center' });
  launchConfetti();
});
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  birthdayLetter.hidden = true;
  letterUnlockForm.hidden = false;
  letterUnlockForm.reset();
  letterUnlockStatus.textContent = '';
});
const birthdayMusic = document.querySelector('#birthdayMusic');
const musicToggle = document.querySelector('#musicToggle');
const musicLabel = document.querySelector('#musicLabel');
let musicManuallyPaused = false;
let musicStarting = false;

birthdayMusic.volume = 0.35;

function updateMusicControl() {
  const playing = !birthdayMusic.paused;
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', playing ? 'Tắt nhạc nền' : 'Bật nhạc nền');
  musicLabel.textContent = playing ? 'Tắt nhạc' : 'Bật nhạc';
}

async function startMusic() {
  if (!journeyStarted) return;
  if (musicStarting || musicManuallyPaused || !birthdayMusic.paused) return;
  musicStarting = true;
  try {
    await birthdayMusic.play();
  } catch (error) {
    // Autoplay may need a click or keyboard interaction first.
    if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
      musicLabel.textContent = 'Thử lại nhạc';
    }
  } finally {
    musicStarting = false;
  }
}

birthdayMusic.addEventListener('play', updateMusicControl);
birthdayMusic.addEventListener('pause', updateMusicControl);
birthdayMusic.addEventListener('error', () => {
  musicLabel.textContent = 'Nhạc chưa tải được';
});
musicToggle.addEventListener('click', () => {
  if (birthdayMusic.paused) {
    musicManuallyPaused = false;
    startMusic();
  } else {
    musicManuallyPaused = true;
    birthdayMusic.pause();
  }
});
function startMusicOnInteraction(event) {
  if (event.target instanceof Element && event.target.closest('#musicToggle')) return;
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

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

revealItems.forEach((item) => observer.observe(item));

function showToast(message) {
  toastMessage.textContent = message;
  toastMessage.classList.add('show');
  window.setTimeout(() => toastMessage.classList.remove('show'), 3400);
}

function launchConfetti() {
  if (typeof confetti !== 'function') return;
  confetti({ particleCount: 90, spread: 75, origin: { y: .68 }, colors: ['#f7c948', '#ec6b5d', '#8fc4c2', '#fffaf1'] });
}

openCardButton.addEventListener('click', () => {
  document.querySelector('#letter').scrollIntoView({ behavior: 'smooth' });
  window.setTimeout(launchConfetti, 550);
});

wishButton.addEventListener('click', () => {
  const wish = wishes[Math.floor(Math.random() * wishes.length)];
  showToast(wish);
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
