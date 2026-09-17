(() => {
  'use strict';

  const audio = document.querySelector('#birthdayMusic');
  const player = document.querySelector('#musicPlayer');
  if (!audio || !player) return;

  const status = document.querySelector('#musicPlayerStatus');
  const seek = document.querySelector('#musicSeek');
  const currentTime = document.querySelector('#musicCurrentTime');
  const duration = document.querySelector('#musicDuration');
  const volume = document.querySelector('#musicVolume');
  const mute = document.querySelector('#musicMute');
  const expand = document.querySelector('#musicExpand');
  const details = document.querySelector('#musicDetails');
  const repeat = document.querySelector('#musicRepeat');
  const restart = document.querySelector('#musicRestart');
  if (![status, seek, currentTime, duration, volume, mute, expand, details, repeat, restart].every(Boolean)) return;

  let previewingSeek = false;
  let lastAudibleVolume = audio.volume > 0 ? audio.volume : 0.35;
  let volumeSupported = true;

  function trackDuration() {
    return Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
  }

  function formatTime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
  }

  function setPlaybackState(state) {
    player.classList.toggle('is-playing', state === 'playing' && !audio.paused);
    const messages = {
      playing: 'Đang phát',
      loading: 'Đang tải…',
      paused: 'Đã tạm dừng',
      ended: 'Đã phát xong',
      error: 'Chưa tải được nhạc. Hãy thử phát lại.'
    };
    // The live region announces state transitions, never each elapsed second.
    const message = messages[state];
    if (status.textContent !== message) status.textContent = message;
  }

  function syncPlaybackState() {
    if (audio.error) setPlaybackState('error');
    else if (audio.ended) setPlaybackState('ended');
    else if (audio.paused) setPlaybackState('paused');
    else setPlaybackState(audio.readyState >= 3 && !audio.seeking ? 'playing' : 'loading');
  }

  function renderSeek(seconds) {
    const total = trackDuration();
    const position = Math.min(total, Math.max(0, Number.isFinite(seconds) ? seconds : 0));
    const progress = total ? position / total : 0;
    seek.value = String(Math.round(progress * 1000));
    seek.style.setProperty('--seek-progress', `${progress * 100}%`);
    currentTime.textContent = formatTime(position);
    seek.setAttribute('aria-valuetext', total
      ? `${formatTime(position)} trên ${formatTime(total)}`
      : 'Chưa có thời lượng bài hát');
  }

  function syncTimeline() {
    const total = trackDuration();
    seek.disabled = !total;
    restart.disabled = !total;
    duration.textContent = total ? formatTime(total) : '--:--';
    if (!previewingSeek || !total) renderSeek(audio.currentTime);
  }

  function finishSeekPreview() {
    previewingSeek = false;
    syncTimeline();
  }

  seek.addEventListener('pointerdown', () => {
    if (!seek.disabled) previewingSeek = true;
  });
  seek.addEventListener('input', () => {
    if (!trackDuration()) return;
    previewingSeek = true;
    renderSeek(Number(seek.value) / 1000 * trackDuration());
  });
  seek.addEventListener('change', () => {
    const total = trackDuration();
    if (total) {
      try {
        audio.currentTime = Math.min(total, Math.max(0, Number(seek.value) / 1000 * total));
      } catch {
        // Metadata can disappear if the browser unloads the media mid-gesture.
      }
    }
    finishSeekPreview();
  });
  seek.addEventListener('pointerup', () => {
    // Native change fires at release; also clear a tap with no value change.
    window.setTimeout(finishSeekPreview, 0);
  });
  seek.addEventListener('pointercancel', finishSeekPreview);
  seek.addEventListener('blur', finishSeekPreview);

  function syncVolume() {
    const level = Math.round(audio.volume * 100);
    const muted = audio.muted || level === 0;
    if (audio.volume > 0) lastAudibleVolume = audio.volume;
    volume.value = String(level);
    volume.style.setProperty('--volume-progress', `${level}%`);
    volume.setAttribute('aria-valuetext', `${level}%${muted ? ', đã tắt tiếng' : ''}`);
    mute.setAttribute('aria-pressed', String(muted));
    mute.setAttribute('aria-label', muted ? 'Bật âm thanh' : 'Tắt âm thanh');
    mute.title = muted ? 'Bật âm thanh' : 'Tắt âm thanh';
    player.classList.toggle('is-muted', muted);
  }

  function setVolume(level) {
    const nextVolume = Math.min(1, Math.max(0, level));
    try {
      audio.volume = nextVolume;
      volumeSupported = Math.abs(audio.volume - nextVolume) < 0.01;
    } catch {
      volumeSupported = false;
    }
    if (!volumeSupported) {
      // Some mobile browsers only allow the device's physical volume controls.
      volume.disabled = true;
      volume.title = 'Điều chỉnh âm lượng bằng nút âm lượng trên thiết bị';
      volume.setAttribute('aria-label', volume.title);
    }
  }

  volume.addEventListener('input', () => {
    setVolume(Number(volume.value) / 100);
    if (volumeSupported && audio.volume > 0) audio.muted = false;
    syncVolume();
  });
  mute.addEventListener('click', () => {
    if (audio.muted || audio.volume === 0) {
      if (audio.volume === 0) setVolume(lastAudibleVolume);
      audio.muted = false;
    } else {
      audio.muted = true;
    }
    syncVolume();
  });

  function setExpanded(expanded) {
    details.hidden = !expanded;
    player.classList.toggle('is-collapsed', !expanded);
    expand.setAttribute('aria-expanded', String(expanded));
    const label = expanded ? 'Thu gọn trình phát nhạc' : 'Mở rộng trình phát nhạc';
    expand.setAttribute('aria-label', label);
    expand.title = label;
  }
  // Choose a compact mobile default once; respect the visitor's later choice.
  setExpanded(!window.matchMedia('(max-width: 600px)').matches);
  expand.addEventListener('click', () => setExpanded(details.hidden));

  function syncRepeat() {
    repeat.setAttribute('aria-pressed', String(audio.loop));
    repeat.title = audio.loop ? 'Tắt lặp lại bài hát' : 'Bật lặp lại bài hát';
  }
  repeat.addEventListener('click', () => {
    audio.loop = !audio.loop;
    syncRepeat();
  });
  restart.addEventListener('click', () => {
    if (!trackDuration()) return;
    try {
      audio.currentTime = 0;
    } catch {
      return;
    }
    finishSeekPreview();
  });

  audio.addEventListener('playing', () => setPlaybackState('playing'));
  audio.addEventListener('play', () => setPlaybackState('loading'));
  audio.addEventListener('waiting', () => {
    if (!audio.paused) setPlaybackState('loading');
  });
  audio.addEventListener('seeking', () => {
    if (!audio.paused) setPlaybackState('loading');
  });
  for (const event of ['pause', 'ended', 'error', 'seeked']) {
    audio.addEventListener(event, syncPlaybackState);
  }
  audio.addEventListener('loadstart', () => {
    if (!audio.paused) setPlaybackState('loading');
  });
  audio.addEventListener('emptied', () => {
    finishSeekPreview();
    syncPlaybackState();
  });
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate']) {
    audio.addEventListener(event, syncTimeline);
  }
  audio.addEventListener('volumechange', syncVolume);

  syncPlaybackState();
  syncTimeline();
  syncVolume();
  syncRepeat();
})();
