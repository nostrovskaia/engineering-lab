import { i18n } from '../services/i18n.js';

const MONTHS_BY_LANG = {
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

let isDragInitialized = false;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateText(str, maxLen = 38) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1).trim() + '…' : str;
}

export function computeTimelineLayout(records, pixelsPerDay = 1.6) {
  if (!records.length) return null;

  const now = new Date();
  const items = records.map(rec => {
    const start = new Date(rec.startDate);
    const end = rec.endDate ? new Date(rec.endDate) : rec.isCurrent ? now : start;
    const durationDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    const isPoint = durationDays <= 3 && rec.type !== 'Experience';

    return {
      record: rec,
      startMs: start.getTime(),
      endMs: Math.max(start.getTime(), end.getTime()),
      isPoint,
    };
  });

  items.sort((a, b) => a.startMs - b.startMs);

  const msPerDay = 1000 * 60 * 60 * 24;
  const padMs = 60 * msPerDay;
  const minMs = Math.min(...items.map(i => i.startMs)) - padMs;
  const maxMs = Math.max(...items.map(i => i.endMs), now.getTime()) + padMs;
  const totalWidth = ((maxMs - minMs) / msPerDay) * pixelsPerDay;

  const expLanes = [];
  let subLaneCounter = 0;

  const assignExpLane = item => {
    const bufferMs = 10 * msPerDay;
    for (let i = 0; i < expLanes.length; i++) {
      if (expLanes[i] + bufferMs <= item.startMs) {
        expLanes[i] = item.endMs;
        return i;
      }
    }
    expLanes.push(item.endMs);
    return expLanes.length - 1;
  };

  const positioned = items.map(item => {
    const isExp = item.record.type === 'Experience';
    const laneIndex = isExp ? assignExpLane(item) : subLaneCounter++;
    const leftPx = ((item.startMs - minMs) / msPerDay) * pixelsPerDay;
    const widthPx = item.isPoint
      ? 14
      : Math.max(28, ((item.endMs - item.startMs) / msPerDay) * pixelsPerDay);

    return { ...item, isExp, laneIndex, leftPx, widthPx };
  });

  return {
    minMs,
    maxMs,
    nowMs: now.getTime(),
    totalWidth,
    pixelsPerDay,
    expLaneCount: Math.max(1, expLanes.length),
    subLaneCount: Math.max(1, subLaneCounter),
    items: positioned,
  };
}

export function renderTimeline(container, state, { zoom = 1, selectedId = null, onSelectRecord }) {
  initDragToScroll(container);

  const pixelsPerDay = 1.6 * zoom;
  const layout = computeTimelineLayout(state.records, pixelsPerDay);

  if (!layout) {
    container.innerHTML =
      '<div class="empty-state"><p>' + escapeHtml(i18n.t('empty_filter')) + '</p></div>';
    return;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const laneHeight = 42;
  const headerOffset = 68;
  const expSectionHeight = layout.expLaneCount * laneHeight + 24;
  const contentHeight = headerOffset + expSectionHeight + layout.subLaneCount * laneHeight + 80;
  const totalHeight = Math.max(container.clientHeight || 0, contentHeight);

  const months = MONTHS_BY_LANG[i18n.getLang()] || MONTHS_BY_LANG.ru;
  const startYear = new Date(layout.minMs).getFullYear();
  const endYear = new Date(layout.maxMs).getFullYear();
  let gridHtml = '';

    for (let y = startYear; y <= endYear; y++) {
    const yearMs = new Date(y + '-01-01').getTime();
    if (yearMs >= layout.minMs && yearMs <= layout.maxMs) {
      const x = ((yearMs - layout.minMs) / msPerDay) * pixelsPerDay;
      gridHtml +=
        '<div class="tl-year-marker" style="left: ' +
        x +
        'px; height: ' +
        totalHeight +
        'px;"><span>' +
        y +
        '</span></div>';
    }

    if (zoom >= 1.5) {
      for (let m = 1; m < 12; m++) {
        const monthMs = new Date(y, m, 1).getTime();
        if (monthMs >= layout.minMs && monthMs <= layout.maxMs) {
          const mx = ((monthMs - layout.minMs) / msPerDay) * pixelsPerDay;
          gridHtml +=
            '<div class="tl-year-marker tl-month-marker" style="left: ' +
            mx +
            'px; height: ' +
            totalHeight +
            'px;"><span>' +
            months[m] +
            '</span></div>';
        }
      }
    }
  }


  const todayX = ((layout.nowMs - layout.minMs) / msPerDay) * pixelsPerDay;
  const todayLabel = escapeHtml(i18n.t('today'));
  const todayMarkerHtml =
    '<div style="position: absolute; left: ' +
    todayX +
    'px; top: 0; bottom: 0; border-left: 1.5px solid #ec4899; box-shadow: 0 0 10px rgba(236, 72, 153, 0.6); z-index: 4; pointer-events: none;">' +
    '<span style="position: sticky; top: 40px; background: linear-gradient(135deg, #ec4899, #db2777); color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; margin-left: 5px; box-shadow: 0 0 12px rgba(236, 72, 153, 0.55); font-family: var(--font-mono);">' +
    todayLabel +
    '</span>' +
    '</div>';

  const itemsHtml = layout.items
    .map(item => {
      const topPx = item.isExp
        ? headerOffset + item.laneIndex * laneHeight
        : headerOffset + expSectionHeight + 36 + item.laneIndex * laneHeight;

      const typeClass = item.record.type.toLowerCase();
      const pointClass = item.isPoint ? 'tl-item--point' : '';
      const selectedClass = item.record.id === selectedId ? 'tl-item--selected' : '';
      const shortTitle = escapeHtml(truncateText(item.record.title, 38));
      const fullTooltip = escapeHtml(item.record.title + ' (' + item.record.startDate + ')');

      return (
        '<div class="tl-item tl-item--' +
        typeClass +
        ' ' +
        pointClass +
        ' ' +
        selectedClass +
        '" data-id="' +
        item.record.id +
        '" style="left: ' +
        item.leftPx +
        'px; top: ' +
        topPx +
        'px; width: ' +
        item.widthPx +
        'px;" title="' +
        fullTooltip +
        '">' +
        '<span class="tl-item__label">' +
        shortTitle +
        '</span>' +
        '</div>'
      );
    })
    .join('');

  container.innerHTML =
    '<div class="tl-track" style="width: ' +
    layout.totalWidth +
    'px; height: ' +
    totalHeight +
    'px;">' +
    '<div class="tl-axis">' +
    gridHtml +
    '</div>' +
    todayMarkerHtml +
    '<div class="tl-divider tl-divider--exp" style="top: 40px;"><span>' +
    escapeHtml(i18n.t('sec_exp')) +
    '</span></div>' +
    '<div class="tl-divider tl-divider--sub" style="top: ' +
    (headerOffset + expSectionHeight + 4) +
    'px;"><span>' +
    escapeHtml(i18n.t('sec_sub')) +
    '</span></div>' +
    itemsHtml +
    '</div>';

  container.querySelectorAll('.tl-item').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      onSelectRecord(el.dataset.id);
    });
  });
}

function initDragToScroll(container) {
  if (isDragInitialized) return;
  isDragInitialized = true;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  container.addEventListener('mousedown', e => {
    if (e.target.closest('.tl-item')) return;
    isDown = true;
    container.style.cursor = 'grabbing';
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    container.style.cursor = 'grab';
  });

  container.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.4;
    container.scrollLeft = scrollLeft - walk;
  });
}
