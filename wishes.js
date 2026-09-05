const wishForm = document.querySelector('#wishForm');
const wishStatus = document.querySelector('#wishStatus');
const wishTrack = document.querySelector('#wishTrack');
const wishBoard = document.querySelector('#wishBoard');
const wishEmpty = document.querySelector('#wishEmpty');
const pauseWishesBtn = document.querySelector('#pauseWishesBtn');
let currentWishes = [];

function sizeWishTrack() {
  const distance = wishTrack.scrollWidth + wishBoard.clientWidth;
  wishTrack.style.setProperty('--wish-start', `${wishBoard.clientWidth}px`);
  wishTrack.style.setProperty('--wish-duration', `${Math.max(12, distance / 65)}s`);
}

function renderWishes(items) {
  wishTrack.replaceChildren();
  wishEmpty.hidden = items.length > 0;
  wishEmpty.textContent = 'Chưa có điều ước nào. Hãy gửi điều ước đầu tiên nhé!';
  for (const item of items) {
    const card = document.createElement('li');
    card.className = 'wish-entry';
    const title = document.createElement('strong');
    title.textContent = `${item.name}: `;
    const message = document.createElement('span');
    message.textContent = item.message.replace(/\s+/g, ' ');
    card.append(title, message);
    wishTrack.append(card);
  }
  sizeWishTrack();
  // Restart from the right when a new wish is added.
  wishTrack.style.animationName = 'none';
  void wishTrack.offsetWidth;
  wishTrack.style.animationName = '';
}

wishForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = wishForm.elements.name.value.trim();
  const message = wishForm.elements.message.value.trim();
  if (!name || !message || name.length > 80 || message.length > 500) {
    wishStatus.textContent = 'Bạn hãy điền họ tên (tối đa 80 ký tự) và điều ước (tối đa 500 ký tự) nhé.';
    return;
  }
  currentWishes.unshift({ name, message, createdAt: new Date().toISOString() });
  renderWishes(currentWishes);
  wishForm.reset();
  wishStatus.textContent = 'Điều ước đã xuất hiện trên bảng tin!';
});

pauseWishesBtn.addEventListener('click', () => {
  const paused = wishBoard.classList.toggle('is-paused');
  pauseWishesBtn.setAttribute('aria-pressed', String(paused));
  pauseWishesBtn.textContent = paused ? 'Tiếp tục chuyển động' : 'Tạm dừng chuyển động';
});
window.addEventListener('resize', sizeWishTrack);
document.fonts.ready.then(sizeWishTrack);
renderWishes(currentWishes);
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  currentWishes = [];
  renderWishes(currentWishes);
  wishForm.reset();
  wishStatus.textContent = '';
});
