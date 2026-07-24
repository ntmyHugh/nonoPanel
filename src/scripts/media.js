(function() {
  'use strict';

  var lyrics = [];
  var currentLyricIdx = -1;
  var lastPosition = 0;
  var lastPositionTime = 0;
  var isPlaying = false;
  var animFrame = null;

  // ── Layout monitor ──
  var prevSnapshot = null;
  function checkLayout() {
    var clockCard = document.getElementById('clock-card');
    var timeDisplay = document.querySelector('.time-display');
    var s = {
      time: performance.now(),
      window: { w: window.innerWidth, h: window.innerHeight },
      cardY: clockCard ? clockCard.getBoundingClientRect().y : null,
      cardH: clockCard ? clockCard.offsetHeight : null,
      timeY: timeDisplay ? timeDisplay.getBoundingClientRect().y : null
    };
    if (prevSnapshot) {
      var changes = [];
      if (Math.abs(s.cardY - prevSnapshot.cardY) > 1) changes.push('card.y ' + prevSnapshot.cardY.toFixed(0) + ' -> ' + s.cardY.toFixed(0));
      if (Math.abs(s.cardH - prevSnapshot.cardH) > 1) changes.push('card.h ' + prevSnapshot.cardH.toFixed(0) + ' -> ' + s.cardH.toFixed(0));
      if (Math.abs(s.timeY - prevSnapshot.timeY) > 1) changes.push('time.y ' + prevSnapshot.timeY.toFixed(0) + ' -> ' + s.timeY.toFixed(0));
      if (changes.length > 0) {
        console.warn('LAYOUT CHANGE:', changes.join(' | '), JSON.stringify(s));
      }
    }
    prevSnapshot = s;
  }
  setInterval(checkLayout, 500);

  function init() {
    var listen = window.__TAURI__ && window.__TAURI__.event && window.__TAURI__.event.listen;
    if (!listen) return;

    var widget = document.getElementById('media-widget');

    listen('media:state', function(event) {
      var state = event.payload;
      var hasMusic = !!(state && state.title);

      console.log('media:state', hasMusic ? (state.title + ' - ' + state.artist) : 'STOPPED');
      // Toggle clock centering: move up when music plays
      var clockInner = document.querySelector('.clock-inner');
      if (hasMusic) {
        if (clockInner) clockInner.style.justifyContent = 'flex-start';
        if (widget) widget.style.visibility = 'visible';
      } else {
        if (clockInner) clockInner.style.justifyContent = 'center';
        if (widget) widget.style.visibility = 'hidden';
        checkLayout();
        return;
      }

      document.getElementById('media-title').textContent = state.title || '';
      document.getElementById('media-artist').textContent = state.artist || '';

      // Album art
      var coverImg = document.getElementById('media-cover-img');
      if (coverImg && state.thumbnailBase64) {
        coverImg.src = 'data:image/jpeg;base64,' + state.thumbnailBase64;
        coverImg.style.display = 'block';
      }

      lastPosition = state.positionSecs || 0;
      lastPositionTime = performance.now();
      isPlaying = state.status === 'playing';

      var playIcon = document.querySelector('#media-play .mdi');
      if (playIcon) playIcon.className = 'mdi ' + (isPlaying ? 'mdi-pause' : 'mdi-play');

      var prev = document.getElementById('media-prev');
      var play = document.getElementById('media-play');
      var next = document.getElementById('media-next');
      if (prev) { prev.disabled = !state.canPrev; prev.style.opacity = state.canPrev ? '1' : '0.3'; }
      if (play) { play.disabled = !(state.canPlay || state.canPause); play.style.opacity = (state.canPlay || state.canPause) ? '1' : '0.3'; }
      if (next) { next.disabled = !state.canNext; next.style.opacity = state.canNext ? '1' : '0.3'; }
    });

    listen('media:lyrics', function(event) {
      lyrics = event.payload || [];
      currentLyricIdx = -1;
    });

    document.getElementById('media-prev').addEventListener('click', function() {
      if (window.tauriApi) window.tauriApi.media.command('previous');
    });
    document.getElementById('media-play').addEventListener('click', function() {
      if (window.tauriApi) window.tauriApi.media.command('toggle');
    });
    document.getElementById('media-next').addEventListener('click', function() {
      if (window.tauriApi) window.tauriApi.media.command('next');
    });
  }

  function syncLyrics() {
    if (lyrics.length === 0) { animFrame = requestAnimationFrame(syncLyrics); return; }
    // Interpolate position for smooth per-frame updates
    var pos = lastPosition;
    if (isPlaying && lastPositionTime > 0) {
      pos += (performance.now() - lastPositionTime) / 1000;
    }
    var posMs = pos * 1000;
    var newIdx = -1;
    for (var i = lyrics.length - 1; i >= 0; i--) {
      if (posMs >= lyrics[i].timeMs) { newIdx = i; break; }
    }
    if (newIdx !== currentLyricIdx) {
      currentLyricIdx = newIdx;
      if (newIdx >= 0) {
        var l1 = document.getElementById('lyric-line1');
        var l2 = document.getElementById('lyric-line2');
        if (l1) l1.textContent = (lyrics[newIdx] && lyrics[newIdx].text) || '';
        if (l2) l2.textContent = (lyrics[newIdx + 1] && lyrics[newIdx + 1].text) || '';
      }
    }

    // Per-frame color fill on current line
    var l1 = document.getElementById('lyric-line1');
    if (l1 && currentLyricIdx >= 0 && currentLyricIdx < lyrics.length) {
      var lineStart = lyrics[currentLyricIdx].timeMs;
      var lineEnd = (currentLyricIdx + 1 < lyrics.length) ? lyrics[currentLyricIdx + 1].timeMs : lineStart + 3000;
      var progress = Math.max(0, Math.min(1, (posMs - lineStart) / Math.max(1, lineEnd - lineStart)));
      var pct = Math.round(progress * 100);
      // Gradient: filled color → transition → dim color
      l1.style.background = 'linear-gradient(to right, var(--text-primary) 0%, var(--text-primary) ' + pct + '%, var(--text-tertiary) ' + pct + '%)';
      l1.style.webkitBackgroundClip = 'text';
      l1.style.backgroundClip = 'text';
      l1.style.webkitTextFillColor = 'transparent';
    }
    animFrame = requestAnimationFrame(syncLyrics);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { init(); syncLyrics(); });
  } else {
    init();
    syncLyrics();
  }
})();
