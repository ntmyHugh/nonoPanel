(function() {
  let lastSec = -1;

  function tickClock() {
    const n = new Date();
    const h = n.getHours().toString().padStart(2, '0');
    const m = n.getMinutes().toString().padStart(2, '0');
    const s = n.getSeconds();
    const sPad = s.toString().padStart(2, '0');

    const hmEl = document.getElementById('time-hm');
    if (hmEl) hmEl.textContent = h + ':' + m;

    const sEl = document.getElementById('time-s');
    if (sEl && s !== lastSec) {
      sEl.textContent = sPad;
      sEl.classList.remove('pulse');
      void sEl.offsetWidth;
      sEl.classList.add('pulse');
      lastSec = s;
    }

    const dateEl = document.getElementById('clock-date');
    if (dateEl) {
      dateEl.textContent = n.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const weekEl = document.getElementById('clock-week');
    if (weekEl) {
      const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      weekEl.textContent = weeks[n.getDay()];
    }
  }

  setInterval(tickClock, 1000);
  tickClock();
})();