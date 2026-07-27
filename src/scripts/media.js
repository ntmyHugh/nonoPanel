(function() {
  'use strict';

  function init() {
    var listen = window.__TAURI__ && window.__TAURI__.event && window.__TAURI__.event.listen;
    if (!listen) return;

    var widget = document.getElementById('media-widget');

    listen('media:state', function(event) {
      var state = event.payload;
      var hasMusic = !!(state && state.title);

      // Toggle clock centering: move up when music plays
      var clockInner = document.querySelector('.clock-inner');
      if (hasMusic) {
        if (clockInner) clockInner.style.justifyContent = 'flex-start';
        if (widget) widget.style.visibility = 'visible';
      } else {
        if (clockInner) clockInner.style.justifyContent = 'center';
        if (widget) widget.style.visibility = 'hidden';
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

      var isPlaying = state.status === 'playing';
      var playIcon = document.querySelector('#media-play .mdi');
      if (playIcon) playIcon.className = 'mdi ' + (isPlaying ? 'mdi-pause' : 'mdi-play');

      var prev = document.getElementById('media-prev');
      var play = document.getElementById('media-play');
      var next = document.getElementById('media-next');
      if (prev) { prev.disabled = !state.canPrev; prev.style.opacity = state.canPrev ? '1' : '0.3'; }
      if (play) { play.disabled = !(state.canPlay || state.canPause); play.style.opacity = (state.canPlay || state.canPause) ? '1' : '0.3'; }
      if (next) { next.disabled = !state.canNext; next.style.opacity = state.canNext ? '1' : '0.3'; }
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
