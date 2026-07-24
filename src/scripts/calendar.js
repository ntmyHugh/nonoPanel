const solarHolidays = {
  '1-1': '元旦', '5-1': '劳动节', '10-1': '国庆节', '10-2': '国庆节', '10-3': '国庆节'
};

const traditionalLunarFestivals = {
  '1-1': '春节',
  '1-15': '元宵',
  '2-2': '龙抬头',
  '5-5': '端午',
  '7-7': '七夕',
  '7-15': '中元',
  '8-15': '中秋',
  '9-9': '重阳',
  '12-8': '腊八',
  '12-23': '小年'
};

const solarTermNames = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];
const solarTermInfo = [0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693, 263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758];
const solarTermCache = {};
const lunarInfoCache = {};
const lunarNumericFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'numeric', day: 'numeric' });
const lunarTextFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'long', day: 'numeric' });

let calTitleEl, weekHeaderRow, calGrid, weekPill;

const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

function pad(n) { return n < 10 ? '0' + n : n; }

function formatLunarDay(day) {
  const tens = ['初', '十', '廿', '三'];
  const nums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (day <= 0 || day > 30) return '';
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  const ten = Math.floor(day / 10);
  const unit = day % 10;
  return tens[ten] + nums[unit];
}

function getLunarInfo(dateObj) {
  const cacheKey = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  if (lunarInfoCache[cacheKey]) return lunarInfoCache[cacheKey];

  const numericRaw = lunarNumericFormatter.format(dateObj);
  const textRaw = lunarTextFormatter.format(dateObj);
  const [monthText, dayText] = numericRaw.split('-');
  const month = Number(monthText);
  const day = Number(dayText);
  const monthLabel = textRaw.replace(/\d+日$/, '');
  const info = {
    month,
    day,
    key: `${month}-${day}`,
    isLeapMonth: monthLabel.startsWith('闰'),
    monthLabel,
    dayLabel: formatLunarDay(day),
    fullText: `${monthLabel}${formatLunarDay(day)}`,
    display: day === 1 ? monthLabel : formatLunarDay(day)
  };

  lunarInfoCache[cacheKey] = info;
  return info;
}

function isLunarNewYearEve(dateObj) {
  const nextDate = new Date(dateObj);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextLunar = getLunarInfo(nextDate);
  return nextLunar.month === 1 && nextLunar.day === 1;
}

function getTraditionalFestival(dateObj, lunarInfo) {
  if (!lunarInfo || lunarInfo.isLeapMonth) return '';
  if (lunarInfo.month === 12 && isLunarNewYearEve(dateObj)) return '除夕';
  return traditionalLunarFestivals[lunarInfo.key] || '';
}

function getSolarTermsForYear(year) {
  if (solarTermCache[year]) return solarTermCache[year];

  const terms = {};
  const baseUtc = Date.UTC(1900, 0, 6, 2, 5);
  solarTermNames.forEach((name, index) => {
    const offset = 31556925974.7 * (year - 1900) + solarTermInfo[index] * 60000;
    const date = new Date(baseUtc + offset);
    terms[`${date.getUTCMonth() + 1}-${date.getUTCDate()}`] = name;
  });

  solarTermCache[year] = terms;
  return terms;
}

function getCalendarMeta(dateObj, lunarInfo) {
  const traditionalFestival = getTraditionalFestival(dateObj, lunarInfo);
  if (traditionalFestival) {
    return { text: traditionalFestival, type: 'festival' };
  }

  const solarTerms = getSolarTermsForYear(dateObj.getFullYear());
  const solarTerm = solarTerms[`${dateObj.getMonth() + 1}-${dateObj.getDate()}`];
  if (solarTerm) {
    return { text: solarTerm, type: 'term' };
  }

  return { text: '', type: '' };
}

function getStatutoryDayInfo(dateObj, holidayData) {
  const holidayInfo = parseHolidayInfo(holidayData, formatDateKey(dateObj));
  if (holidayInfo) {
    if (holidayInfo.isHoliday) {
      return { status: 'holiday', label: holidayInfo.name || holidayInfo.target || '' };
    }
    if (holidayInfo.isWorkAdjust) {
      return { status: 'work-adjust', label: holidayInfo.name || holidayInfo.target || '' };
    }
  }

  const fallbackLabel = solarHolidays[`${dateObj.getMonth() + 1}-${dateObj.getDate()}`];
  if (fallbackLabel) {
    return { status: 'holiday', label: fallbackLabel };
  }

  return null;
}

function shouldShowHolidayLabel(dateObj, holidayInfo, holidayData) {
  if (!holidayInfo || holidayInfo.status !== 'holiday' || !holidayInfo.label) return false;

  const prevDate = new Date(dateObj);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevHolidayInfo = getStatutoryDayInfo(prevDate, holidayData);

  return !prevHolidayInfo || prevHolidayInfo.status !== 'holiday' || prevHolidayInfo.label !== holidayInfo.label;
}

function buildWeekHeader() {
  if (!weekHeaderRow) return;
  weekHeaderRow.innerHTML = '';
  weekNames.forEach(w => {
    const div = document.createElement('div');
    div.className = 'week-header';
    div.textContent = w;
    weekHeaderRow.appendChild(div);
  });
}

function initCalendarElements() {
  calTitleEl = document.getElementById('cal-title');
  weekHeaderRow = document.getElementById('week-header-row');
  calGrid = document.getElementById('calendar-grid');
  weekPill = document.getElementById('week-pill');

  if (!calTitleEl || !weekHeaderRow || !calGrid || !weekPill) {
    console.error('❌ 日历DOM元素未找到');
    return false;
  }

  buildWeekHeader();
  return true;
}

let viewYear = (new Date()).getFullYear();
let viewMonth = (new Date()).getMonth();

function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}

function formatDateKey(dateObj) {
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
}

async function renderCalendar() {
  try {
    calGrid.innerHTML = '';
    const today = new Date();
    const Y = viewYear; const M = viewMonth;
    calTitleEl.textContent = `${Y}年${M + 1}月`;
    weekPill.textContent = '第' + getISOWeek(today) + '周';

    const holidayData = await getHolidayData(Y);
    console.log('📅 渲染日历，使用节假日数据:', Y, Object.keys(holidayData).length + '条');

    const firstDay = new Date(Y, M, 1).getDay();
    const daysInMonth = new Date(Y, M + 1, 0).getDate();
    const prevMonthDays = new Date(Y, M, 0).getDate();
    const totalCells = 42;
    const cells = [];
    for (let i = firstDay; i > 0; i--) cells.push({ y: Y, m: M - 1, d: prevMonthDays - i + 1, dim: true });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ y: Y, m: M, d, dim: false });
    let nextDay = 1;
    while (cells.length < totalCells) cells.push({ y: Y, m: M + 1, d: nextDay++, dim: true });

    cells.forEach((c, idx) => {
      const dateObj = normalizeDate(c.y, c.m, c.d);
      const lunarInfo = getLunarInfo(dateObj);
      const metaInfo = getCalendarMeta(dateObj, lunarInfo);
      const statutoryDayInfo = getStatutoryDayInfo(dateObj, holidayData);
      const cell = document.createElement('div');
      cell.className = 'cal-cell cal-shape-' + ((idx % 4) + 1);
      if (c.dim) cell.classList.add('dim');
      if (isWeekend(dateObj)) cell.classList.add('weekend');
      if (isSameDate(dateObj, today)) cell.classList.add('today');

      if (statutoryDayInfo) {
        if (statutoryDayInfo.status === 'holiday') {
          cell.classList.add('holiday');
        } else if (statutoryDayInfo.status === 'work-adjust') {
          cell.classList.add('work-adjust');
        }
      }

      const numDiv = document.createElement('div');
      numDiv.className = 'date-num';
      numDiv.textContent = c.d;
      cell.appendChild(numDiv);

      const holidayLabel = shouldShowHolidayLabel(dateObj, statutoryDayInfo, holidayData) ? statutoryDayInfo.label : '';
      let metaText = metaInfo.text;
      let metaType = metaInfo.type;

      if (holidayLabel) {
        metaText = holidayLabel;
        metaType = 'solar';
      }

      const showLunar = !metaText;

      if (showLunar) {
        const lunarDiv = document.createElement('div');
        lunarDiv.className = 'lunar';
        lunarDiv.textContent = lunarInfo.display;
        cell.appendChild(lunarDiv);
      } else {
        cell.classList.add('has-meta');
      }

      const metaDiv = document.createElement('div');
      metaDiv.className = 'meta-note' + (metaType ? ` ${metaType}` : '');
      metaDiv.textContent = metaText;
      cell.appendChild(metaDiv);

      if (!metaText) {
        cell.classList.add('simple');
      }

      if (statutoryDayInfo) {
        const badge = document.createElement('div');
        badge.className = 'badge' + (statutoryDayInfo.status === 'work-adjust' ? ' work' : ' rest');
        badge.textContent = statutoryDayInfo.status === 'work-adjust' ? '班' : '休';
        cell.appendChild(badge);
      }

      calGrid.appendChild(cell);
    });

    scheduleAdjustCalendarHeight();
  } catch (error) {
    console.error('❌ 日历渲染失败:', error);
    if (calTitleEl) {
      const Y = viewYear; const M = viewMonth;
      calTitleEl.textContent = `${Y}年${M + 1}月`;
    }
  }
}

function normalizeDate(y, m, d) { return new Date(y, m, d); }
function isSameDate(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isWeekend(date) { const w = date.getDay(); return w === 0 || w === 6; }

function initCalendar() {
  if (!initCalendarElements()) {
    console.error('❌ 日历元素初始化失败');
    return;
  }

  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', async () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } await renderCalendar(); });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } await renderCalendar(); });
  }

  if (calTitleEl) {
    calTitleEl.addEventListener('dblclick', async () => {
      const n = new Date();
      viewYear = n.getFullYear();
      viewMonth = n.getMonth();
      await renderCalendar();
    });
    calTitleEl.style.cursor = 'pointer';
    calTitleEl.title = '双击回到今天';
  }

  renderCalendar().catch(err => console.error('日历初始化失败:', err));
}

function scheduleCalendarRefresh() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  console.log(`⏰ 日历将在 ${msUntilMidnight / 1000 / 60} 分钟后自动刷新`);

  setTimeout(async () => {
    console.log('🔄 午夜自动刷新日历');
    const today = new Date();
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
    await renderCalendar();

    scheduleCalendarRefresh();
  }, msUntilMidnight);
}

document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    const now = new Date();
    if (viewYear !== now.getFullYear() || viewMonth !== now.getMonth()) {
      console.log('🔄 页面激活，检测到日期变化，刷新日历');
      viewYear = now.getFullYear();
      viewMonth = now.getMonth();
      await renderCalendar();
    }
  }
});

function adjustCalendarHeight() {
  const card = document.querySelector('.calendar-card');
  const grid = document.getElementById('calendar-grid');
  if (!card || !grid) return;

  const cells = [...grid.children];
  let rows = 6;
  if (cells.length === 42) {
    const lastRow = cells.slice(-7);
    if (lastRow.every(c => c.classList.contains('dim'))) rows = 5;
  }

  const cardRect = card.getBoundingClientRect();
  const gridRect = grid.getBoundingClientRect();
  const availableForGrid = cardRect.bottom - gridRect.top - 12;
  const gap = parseFloat(getComputedStyle(grid).gap) || 8;

  let cell = Math.floor((availableForGrid - (rows - 1) * gap) / rows);

  const MAX = rows === 5 ? 66 : 52;
  const MIN = 44;
  if (cell > MAX) cell = MAX;
  if (cell < MIN) cell = MIN;

  card.style.setProperty('--cal-cell-h', cell + 'px');
  grid.style.minHeight = '';
}

function scheduleAdjustCalendarHeight() {
  requestAnimationFrame(() => requestAnimationFrame(adjustCalendarHeight));
}