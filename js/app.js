import { repo } from './data/repository.js';
import { ACTIVITY_SUBTYPES, PROFICIENCY_LEVELS } from './data/schema.js';
import { exportFullDatabase, importDatabaseFromFile } from './services/import-export.js';
import { createDefaultFilterState, applyFilters } from './services/filters.js';
import { i18n } from './services/i18n.js';
import { renderTimeline } from './views/timeline.js';
import { openRecordEditor } from './views/record-editor.js';
import { openRecordDetails } from './views/record-details.js';

const urlParams = new URLSearchParams(window.location.search);
const isEditMode = urlParams.get('edit') === 'true' || urlParams.get('edit') === '1';

if (isEditMode) {
  document.body.classList.add('is-edit-mode');
}

let filters = createDefaultFilterState();
let zoom = 1;
let selectedRecordId = null;

const timelineCanvas = document.getElementById('timelineCanvas');
const drawerPanel = document.getElementById('drawerPanel');
const drawerTitle = document.getElementById('drawerTitle');
const drawerContent = document.getElementById('drawerContent');
const activeFiltersBar = document.getElementById('activeFiltersBar');

function openDrawer(title) {
  drawerTitle.textContent = title;
  drawerPanel.classList.remove('hidden');
}

function closeDrawer() {
  selectedRecordId = null;
  drawerPanel.classList.add('hidden');
  drawerContent.innerHTML = '';
  refreshView();
}

function createCheckboxItem(value, labelText, isChecked, onChange) {
  const label = document.createElement('label');
  label.className = 'filter-checkbox';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.value = value;
  input.checked = isChecked;
  input.addEventListener('change', onChange);

  const span = document.createElement('span');
  span.textContent = labelText;

  label.appendChild(input);
  label.appendChild(span);
  return label;
}

function renderActiveFiltersBar(state) {
  const chips = [];

  if (filters.query.trim()) {
    chips.push({
      label: '"' + filters.query.trim() + '"',
      cls: 'chip--search',
      onRemove: () => {
        filters.query = '';
        document.getElementById('searchInput').value = '';
      },
    });
  }

  filters.techIds.forEach(id => {
    const tech = state.dictionaries.technologies.find(t => t.id === id);
    if (tech) {
      chips.push({
        label: tech.name + (filters.techIds.length > 1 ? ' (' + filters.techMode + ')' : ''),
        cls: 'chip--tech',
        onRemove: () => {
          filters.techIds = filters.techIds.filter(x => x !== id);
        },
      });
    }
  });

  filters.levels.forEach(lvl => {
    chips.push({
      label: i18n.tLevel(lvl),
      cls: 'chip--level',
      onRemove: () => {
        filters.levels = filters.levels.filter(x => x !== lvl);
      },
    });
  });

  filters.domainIds.forEach(id => {
    const dom = state.dictionaries.domains.find(d => d.id === id);
    if (dom) {
      chips.push({
        label: dom.name,
        cls: 'chip--domain',
        onRemove: () => {
          filters.domainIds = filters.domainIds.filter(x => x !== id);
        },
      });
    }
  });

  filters.types.forEach(t => {
    chips.push({
      label: t,
      cls: 'chip--type',
      onRemove: () => {
        filters.types = filters.types.filter(x => x !== t);
      },
    });
  });

  activeFiltersBar.innerHTML = '';

  if (chips.length === 0) {
    activeFiltersBar.classList.add('hidden');
    return;
  }

  activeFiltersBar.classList.remove('hidden');

  const lbl = document.createElement('span');
  lbl.className = 'active-filters-bar__label';
  lbl.textContent = i18n.t('active_filters_lbl');
  activeFiltersBar.appendChild(lbl);

  chips.forEach(c => {
    const chipEl = document.createElement('span');
    chipEl.className = 'filter-chip ' + c.cls;
    chipEl.textContent = c.label + ' ';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '✕';
    btn.addEventListener('click', () => {
      c.onRemove();
      refreshView();
    });

    chipEl.appendChild(btn);
    activeFiltersBar.appendChild(chipEl);
  });
}

function renderSidebarFilters(state) {
  const techBox = document.getElementById('filterTechnologies');
  techBox.innerHTML = '';
  if (state.dictionaries.technologies.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'text-muted';
    empty.textContent = i18n.t('no_techs');
    techBox.appendChild(empty);
  } else {
    state.dictionaries.technologies.forEach(t => {
      const item = createCheckboxItem(t.id, t.name, filters.techIds.includes(t.id), () => {
        filters.techIds = Array.from(techBox.querySelectorAll('input:checked')).map(i => i.value);
        refreshView();
      });
      techBox.appendChild(item);
    });
  }

  const levelBox = document.getElementById('filterLevels');
  levelBox.innerHTML = '';
  PROFICIENCY_LEVELS.forEach(lvl => {
    const item = createCheckboxItem(lvl, i18n.tLevel(lvl), filters.levels.includes(lvl), () => {
      filters.levels = Array.from(levelBox.querySelectorAll('input:checked')).map(i => i.value);
      refreshView();
    });
    levelBox.appendChild(item);
  });

  const domBox = document.getElementById('filterDomains');
  domBox.innerHTML = '';
  if (state.dictionaries.domains.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'text-muted';
    empty.textContent = i18n.t('no_domains');
    domBox.appendChild(empty);
  } else {
    state.dictionaries.domains.forEach(d => {
      const item = createCheckboxItem(d.id, d.name, filters.domainIds.includes(d.id), () => {
        filters.domainIds = Array.from(domBox.querySelectorAll('input:checked')).map(i => i.value);
        refreshView();
      });
      domBox.appendChild(item);
    });
  }

  const allTypes = ['Experience', 'Project', ...ACTIVITY_SUBTYPES];
  const typeBox = document.getElementById('filterTypes');
  typeBox.innerHTML = '';
  allTypes.forEach(t => {
    const item = createCheckboxItem(t, t, filters.types.includes(t), () => {
      filters.types = Array.from(typeBox.querySelectorAll('input:checked')).map(i => i.value);
      refreshView();
    });
    typeBox.appendChild(item);
  });
}

function refreshView() {
  const state = repo.getState();
  renderSidebarFilters(state);
  renderActiveFiltersBar(state);

  if (state.records.length === 0) {
    timelineCanvas.innerHTML = '';
    const emptyWrap = document.createElement('div');
    emptyWrap.className = 'empty-state';

    const p = document.createElement('p');
    p.textContent = i18n.t('empty_db');

    const btn = document.createElement('button');
    btn.className = 'btn btn--secondary';
    btn.textContent = i18n.t('btn_load_sample');
    btn.addEventListener('click', () => loadSampleData(true));

    emptyWrap.appendChild(p);
    emptyWrap.appendChild(btn);
    timelineCanvas.appendChild(emptyWrap);
    return;
  }

  const filteredRecords = applyFilters(state, filters);
  renderTimeline(
    timelineCanvas,
    { ...state, records: filteredRecords },
    {
      zoom,
      selectedId: selectedRecordId,
      onSelectRecord: id => handleShowDetails(id),
    }
  );
}

function handleShowDetails(recordId) {
  selectedRecordId = recordId;
  refreshView();
  const state = repo.getState();
  openDrawer(i18n.t('details_title'));
  openRecordDetails(drawerContent, state, recordId, {
    onEdit: rec => handleOpenEditor(rec),
    onDelete: id => {
      repo.deleteRecord(id);
      closeDrawer();
    },
  });
}

function handleOpenEditor(record = null) {
  openDrawer(record ? i18n.t('editor_edit') : i18n.t('editor_new'));
  openRecordEditor(drawerContent, {
    record,
    onSaved: savedRec => handleShowDetails(savedRec.id),
    onCancel: () => closeDrawer(),
  });
}

async function loadSampleData(replaceMode = false) {
  const lang = i18n.getLang();
  const url = './data/sample-data-' + lang + '.json';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Файл не найден: ' + url);
    const json = await res.json();
    if (replaceMode) {
      repo.replaceDatabase(json);
    } else {
      repo.mergeDatabase(json);
    }
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// --- Привязка глобальных событий UI ---
document.getElementById('btnNewRecord').addEventListener('click', () => handleOpenEditor(null));
document.getElementById('btnCloseDrawer').addEventListener('click', closeDrawer);
document.getElementById('btnExport').addEventListener('click', exportFullDatabase);

const fileInput = document.getElementById('fileInput');
document.getElementById('btnImport').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const hasRecords = repo.getState().records.length > 0;
    let mode = 'replace';
    if (hasRecords) {
      const shouldMerge = confirm(i18n.t('import_mode_prompt'));
      mode = shouldMerge ? 'merge' : 'replace';
    }
    await importDatabaseFromFile(file, mode);
    filters = createDefaultFilterState();
    document.getElementById('searchInput').value = '';
    selectedRecordId = null;
    closeDrawer();
    refreshView();
  } catch (err) {
    alert(err.message);
  }
  fileInput.value = '';
});

document.getElementById('searchInput').addEventListener('input', e => {
  filters.query = e.target.value;
  refreshView();
});

document.getElementById('btnResetFilters').addEventListener('click', () => {
  filters = createDefaultFilterState();
  document.getElementById('searchInput').value = '';
  refreshView();
});

document.querySelectorAll('#techLogicToggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#techLogicToggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filters.techMode = btn.dataset.mode;
    refreshView();
  });
});

document.getElementById('btnZoomIn').addEventListener('click', () => {
  zoom = Math.min(4, +(zoom + 0.25).toFixed(2));
  document.getElementById('zoomLabel').textContent = Math.round(zoom * 100) + '%';
  refreshView();
});

document.getElementById('btnZoomOut').addEventListener('click', () => {
  zoom = Math.max(0.25, +(zoom - 0.25).toFixed(2));
  document.getElementById('zoomLabel').textContent = Math.round(zoom * 100) + '%';
  refreshView();
});

document.querySelectorAll('#langToggle button').forEach(btn => {
  btn.addEventListener('click', async () => {
    const targetLang = btn.dataset.lang;
    if (targetLang === i18n.getLang()) return;
    i18n.setLang(targetLang);

    if (!isEditMode || repo.getState().records.length === 0) {
      await loadSampleData(true);
    }

    filters = createDefaultFilterState();
    document.getElementById('searchInput').value = '';
    selectedRecordId = null;
    closeDrawer();
    refreshView();
  });
});

async function initApp() {
  i18n.applyStaticDOM();

  // В режиме витрины сразу загружаем свежий JSON согласно ?lang=ru или ?lang=en
  // В режиме ?edit=true загружаем JSON только если localStorage ещё пуст
  if (!isEditMode || repo.getState().records.length === 0) {
    await loadSampleData(true);
  }

  repo.subscribe(() => refreshView());
  refreshView();
}

initApp();
