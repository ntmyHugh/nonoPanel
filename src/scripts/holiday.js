const HOLIDAY_CACHE_VERSION = 2;
let holidayCache = JSON.parse(localStorage.getItem('holiday_cache') || '{}');

function holidayFetch(year) {
  // Use Rust proxy when available
  if (typeof window.__TAURI__ !== 'undefined') {
    return window.__TAURI__.core.invoke('holiday_get_year', { year: year });
  }
  // Fallback: direct API call
  var url = new URL('https://timor.tech/api/holiday/year/' + year + '/');
  url.searchParams.set('t', Date.now().toString());
  return fetch(url.toString(), { method: 'GET', mode: 'cors' })
    .then(function(resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    })
    .then(function(rawData) {
      if (rawData.code !== 0 || !rawData.holiday) throw new Error('format error');
      var data = {};
      Object.entries(rawData.holiday).forEach(function(entry) {
        var date = entry[0];
        var info = entry[1];
        data[date] = {
          isOffDay: info.holiday === true && !/补班/.test(info.name || ''),
          name: info.name || '',
          date: info.date || (year + '-' + date),
          target: info.target || ''
        };
      });
      return data;
    });
}

async function getHolidayData(year) {
  const cacheKey = `holidays_${year}`;

  const cached = holidayCache[cacheKey];
  if (cached && cached.version === HOLIDAY_CACHE_VERSION && (Date.now() - cached.timestamp) < 24 * 60 * 60 * 1000 * 7) {
    console.log('🎊 使用缓存的节假日数据:', year);
    return cached.data;
  }

  try {
    console.log('🌐 获取节假日数据:', year);
    const data = await holidayFetch(year);

    console.log('✅ 节假日数据获取成功:', Object.keys(data).length, '条记录');

    holidayCache[cacheKey] = {
      data,
      version: HOLIDAY_CACHE_VERSION,
      timestamp: Date.now()
    };
    localStorage.setItem('holiday_cache', JSON.stringify(holidayCache));

    return data;
  } catch (error) {
    console.warn('⚠️ 节假日 API 失败:', error.message);
    return {};
  }
}

function parseHolidayInfo(holidayData, dateStr) {
  const shortKey = dateStr.slice(5);
  const holiday = holidayData[dateStr] || holidayData[shortKey];
  if (!holiday) return null;

  // From Rust proxy: isOffDay is already corrected (补班 = false)
  const isWorkAdjust = holiday.isOffDay === false;

  return {
    isHoliday: holiday.isOffDay === true,
    isWorkAdjust,
    name: holiday.name,
    date: holiday.date,
    target: holiday.target
  };
}
