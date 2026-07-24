const settingsPage = document.querySelector('.settings-page');

function showSettings() {
  settingsPage.style.display = 'flex';
}

function hideSettings() {
  settingsPage.style.display = 'none';
}

async function initCitySearch(type) {
  const cityInput = document.getElementById(`${type}-city`);
  const districtInput = document.getElementById(`${type}-district`);
  const searchBtn = document.getElementById(`search-${type}-city`);

  if (!cityInput || !districtInput || !searchBtn) return;

  searchBtn.addEventListener('click', async () => {
    try {
      const cityName = cityInput.value.trim();
      const districtName = districtInput.value.trim();

      let location = '';
      let adm = null;

      if (districtName && cityName) {
        location = districtName;
        adm = cityName;
      } else if (cityName) {
        location = cityName;
      } else if (districtName) {
        location = districtName;
      }

      if (!location) {
        alert('请至少输入城市或地区');
        return;
      }

      var result = await window.tauriApi.weather.searchCity(location, adm);
      saveCity(type === 'main' ? 'main' : 'secondary', result);
      await updateWeather();
      alert('设置成功！');
    } catch (err) {
      console.error('City search error:', err);
      alert(err.message || String(err));
    }
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && settingsPage.style.display === 'flex') {
    hideSettings();
  }
});

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('selectedTheme') || 'dark';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);

    const themeRadio = document.querySelector(`input[name="theme"][value="${this.currentTheme}"]`);
    if (themeRadio) {
      themeRadio.checked = true;
    }

    document.querySelectorAll('input[name="theme"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.switchTheme(e.target.value);
        }
      });
    });
  }

  switchTheme(theme) {
    this.currentTheme = theme;
    this.applyTheme(theme);
    localStorage.setItem('selectedTheme', theme);
  }

  applyTheme(theme) {
    document.body.classList.remove('colorful-theme');
    if (theme === 'colorful') {
      document.body.classList.add('colorful-theme');
    }
  }
}
