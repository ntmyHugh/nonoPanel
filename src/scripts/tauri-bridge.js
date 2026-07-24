(function() {
  'use strict';

  var available = typeof window.__TAURI__ !== 'undefined';
  var invoke = available ? window.__TAURI__.core.invoke : function() {};
  var listen = available ? window.__TAURI__.event.listen : function() {};

  window.tauriBridge = {
    available: available,

    // ---- SMTC (System Media Transport Controls) ----
    updateSmtc: function(state) {
      if (!available) return;
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

      invoke('smtc_update', {
        payload: {
          status: status,
          title: title,
          subtitle: subtitle,
          timeLeftSecs: state.timeLeft,
          totalTimeSecs: state.totalTime
        }
      }).catch(function() {});
    },

    clearSmtc: function() {
      if (!available) return;
      invoke('smtc_clear', {}).catch(function() {});
    },

    // ---- Notifications ----
    notify: function(title, body) {
      if (!available) return;
      invoke('send_notification', { title: title, body: body }).catch(function() {});
    },

    // ---- SMTC command listener (media keys from Windows) ----
    onSmtcCommand: function(callback) {
      if (!available) return;
      listen('smtc:play',  function() { callback('play'); });
      listen('smtc:pause', function() { callback('pause'); });
      listen('smtc:stop',  function() { callback('stop'); });
    }
  };
})();
