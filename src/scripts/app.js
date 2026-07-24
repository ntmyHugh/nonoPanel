(function() {
  // Show fixed buttons on mouse move
  const fixedButtons = document.querySelectorAll('.fixed-btn');
  let hideTimer = null;

  function showButtons() {
    fixedButtons.forEach(btn => btn.classList.add('show'));
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      fixedButtons.forEach(btn => btn.classList.remove('show'));
    }, 3000);
  }

  document.addEventListener('mousemove', showButtons);
  document.addEventListener('mouseleave', () => {
    fixedButtons.forEach(btn => btn.classList.remove('show'));
    clearTimeout(hideTimer);
  });

  // Fullscreen
  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn) {
    fsBtn.addEventListener('click', toggleFullscreen);
  }

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen && el.requestFullscreen();
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  }

  document.addEventListener('fullscreenchange', () => {
    const isFS = !!document.fullscreenElement;
    if (fsBtn) {
      const icon = fsBtn.querySelector('.mdi');
      if (icon) icon.className = isFS ? 'mdi mdi-fullscreen-exit' : 'mdi mdi-fullscreen';
    }
  });

  // Keyboard ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.fullscreenElement) {
      document.exitFullscreen();
    }
  });

  // Initialize modules (DOMContentLoaded safe)
  function init() {
    initCalendar();
    updateWeather();

    if (window.DashboardPet) {
      window.dashboardPet = new DashboardPet();
      window.dashboardPet.init();
    }

    // Settings
    const settingsBtn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('close-settings');
    if (settingsBtn) settingsBtn.addEventListener('click', showSettings);
    if (closeBtn) closeBtn.addEventListener('click', hideSettings);

    initCitySearch('main');
    initCitySearch('secondary');

    // Theme
    window.themeManager = new ThemeManager();

    // Pomodoro
    window.pomodoroTimer = new EnhancedPomodoroTimer();

    // Initial page
    switchToPage(0);

    // Forecast view toggle (small labels)
    const viewHourly = document.getElementById('view-hourly');
    const viewDaily  = document.getElementById('view-daily');
    if (viewHourly) viewHourly.addEventListener('click', () => activateForecastTab('hourly'));
    if (viewDaily)  viewDaily.addEventListener('click',  () => activateForecastTab('daily'));

    activateForecastTab('hourly');

    // Calendar auto-refresh
    scheduleCalendarRefresh();

    // Window resize
    window.addEventListener('resize', scheduleAdjustCalendarHeight);
    window.addEventListener('load', scheduleAdjustCalendarHeight);

    // Prevent double-click text select
    document.addEventListener('mousedown', e => { if (e.detail > 1) e.preventDefault(); });

    // Weather interval refresh
    setInterval(() => {
      if (Date.now() - lastUpdate > CACHE_NOW) updateWeather({ skipGeo: true });
    }, 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();