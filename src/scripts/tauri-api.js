(function() {
  'use strict';

  var available = typeof window.__TAURI__ !== 'undefined';
  var invoke = available ? window.__TAURI__.core.invoke : function() {};
  var listen = available ? window.__TAURI__.event.listen : function() {};

  window.tauriApi = {
    available: available,

    // ── Weather ──
    weather: {
      searchCity: function(city, adm) {
        return invoke('weather_search_city', { city: city, adm: adm || null });
      },
      getCurrent: function(locationId) {
        return invoke('weather_get_current', { locationId: locationId });
      },
      getHourly: function(locationId) {
        return invoke('weather_get_hourly', { locationId: locationId });
      },
      getDaily: function(locationId) {
        return invoke('weather_get_daily', { locationId: locationId });
      },
    },

    // ── Holiday ──
    holiday: {
      getYear: function(year) {
        return invoke('holiday_get_year', { year: year });
      },
    },

    // ── Assets ──
    assets: {
      scanPetDir: function() {
        return invoke('assets_scan_pet_dir');
      },
    },

    // ── SMTC ──
    smtc: {
      update: function(payload) {
        invoke('smtc_update', { payload: payload }).catch(function() {});
      },
      clear: function() {
        invoke('smtc_clear', {}).catch(function() {});
      },
      onCommand: function(callback) {
        if (!available) return;
        listen('smtc:play',  function() { callback('play'); });
        listen('smtc:pause', function() { callback('pause'); });
        listen('smtc:stop',  function() { callback('stop'); });
      },
    },

    // ── Notification ──
    notify: function(title, body) {
      if (!available) return;
      invoke('send_notification', { title: title, body: body }).catch(function() {});
    },

    // ── Config ──
    config: {
      getAll: function() {
        return invoke('config_get_all');
      },
      setWeatherCities: function(mainCity, secondaryCity) {
        return invoke('config_set_weather_cities', {
          mainCity: mainCity || null,
          secondaryCity: secondaryCity || null,
        });
      },
      setTheme: function(theme) {
        return invoke('config_set_theme', { theme: theme });
      },
    },

    // ── Media ──
    media: {
      command: function(action) {
        return invoke('media_command', { action: action });
      },
      getState: function() {
        return invoke('media_get_state');
      },
    },

    // ── Store ──
    store: {
      get: function(key) {
        return invoke('get_store_value', { key: key });
      },
      set: function(key, value) {
        return invoke('set_store_value', { key: key, value: String(value) });
      },
      getJson: function(key) {
        return invoke('store_get_json', { key: key });
      },
      setJson: function(key, value) {
        return invoke('store_set_json', { key: key, value: value });
      },
      getAll: function() {
        return invoke('store_get_all');
      },
      setBatch: function(entries) {
        return invoke('store_set_batch', { entries: entries });
      },
    },
  };

  // Preserve backward compatibility
  window.tauriBridge = {
    available: available,
    updateSmtc: function(state) {
      var modeLabels = { work: '工作中', short: '短休息', long: '长休息' };
      var label = modeLabels[state.mode] || state.mode;
      var status = 'stopped';
      var title = '番茄钟 - 就绪';

      if (state.isRunning) {
        status = 'playing';
        title = '番茄钟 - ' + label;
      } else if (state.isPaused) {
        status = 'paused';
        title = '番茄钟 - 已暂停';
      }

      var mins = Math.floor(state.timeLeft / 60);
      var secs = state.timeLeft % 60;
      var subtitle = '剩余 ' + mins + ':' + String(secs).padStart(2, '0')
        + ' | ' + state.completedPomodoros + '番茄';

      window.tauriApi.smtc.update({
        status: status,
        title: title,
        subtitle: subtitle,
        timeLeftSecs: state.timeLeft,
        totalTimeSecs: state.totalTime
      });
    },
    clearSmtc: function() {
      window.tauriApi.smtc.clear();
    },
    notify: function(title, body) {
      window.tauriApi.notify(title, body);
    },
    onSmtcCommand: function(callback) {
      window.tauriApi.smtc.onCommand(callback);
    },
  };
})();
