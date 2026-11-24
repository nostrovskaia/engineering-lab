import {
  RECORD_TYPES,
  ACTIVITY_SUBTYPES,
  PROFICIENCY_LEVELS,
  TECH_RELEVANCE,
  EVIDENCE_TYPES,
} from '../data/schema.js';
import { repo } from '../data/repository.js';
import { i18n } from '../services/i18n.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openRecordEditor(container, { record = null, onSaved, onCancel }) {
  const state = repo.getState();
  const isEdit = Boolean(record);
  let currentType = record?.type || RECORD_TYPES.EXPERIENCE;

  let techRows = isEdit
    ? state.recordTechnologies
        .filter(l => l.record_id === record.id)
        .map(l => {
          const t = state.dictionaries.technologies.find(tech => tech.id === l.technology_id);
          return { ...l, techName: t ? t.name : '' };
        })
    : [];

  function render() {
    const existingDomains = isEdit
      ? (record.domainIds || [])
          .map(id => state.dictionaries.domains.find(d => d.id === id)?.name)
          .filter(Boolean)
          .join(', ')
      : '';

    const existingLinks =
      isEdit && Array.isArray(record.links)
        ? record.links.map(l => (l.label ? l.label + ' | ' + l.url : l.url)).join('\n')
        : '';

    const typeOptions = Object.values(RECORD_TYPES)
      .map(t => '<option value="' + t + '" ' + (t === currentType ? 'selected' : '') + '>' + t + '</option>')
      .join('');

    container.innerHTML =
      '<form id="recordForm" class="editor-form">' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_type')) + '</label>' +
      '<select id="fieldType" class="input" ' + (isEdit ? 'disabled' : '') + '>' +
      typeOptions +
      '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_title')) + '</label>' +
      '<input type="text" id="fieldTitle" class="input" required value="' + escapeHtml(record?.title || '') + '" />' +
      '</div>' +
      '<div class="form-row">' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_start')) + '</label>' +
      '<input type="date" id="fieldStart" class="input" required value="' + escapeHtml(record?.startDate || '') + '" />' +
      '</div>' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_end')) + '</label>' +
      '<input type="date" id="fieldEnd" class="input" value="' + escapeHtml(record?.endDate || '') + '" />' +
      '</div>' +
      '</div>' +
      renderTypeSpecificFields(currentType, record) +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_desc')) + '</label>' +
      '<textarea id="fieldDesc" class="input" rows="2">' + escapeHtml(record?.description || '') + '</textarea>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_domains')) + '</label>' +
      '<input type="text" id="fieldDomains" class="input" value="' + escapeHtml(existingDomains) + '" placeholder="Quality Assurance, Test Automation" />' +
      '</div>' +
      '<div class="form-group">' +
      '<div class="form-header-row">' +
      '<label>' + escapeHtml(i18n.t('lbl_techs')) + '</label>' +
      '<button type="button" id="btnAddTechRow" class="btn btn--ghost btn--sm">' + escapeHtml(i18n.t('btn_add_tech')) + '</button>' +
      '</div>' +
      '<div id="techRowsContainer" class="tech-rows"></div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_links')) + '</label>' +
      '<textarea id="fieldLinks" class="input" rows="2" placeholder="GitHub | https://github.com...">' + escapeHtml(existingLinks) + '</textarea>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_notes')) + '</label>' +
      '<textarea id="fieldNotes" class="input" rows="2">' + escapeHtml(record?.notes || '') + '</textarea>' +
      '</div>' +
      '<div class="form-actions">' +
      '<button type="button" id="btnCancelForm" class="btn btn--ghost">' + escapeHtml(i18n.t('btn_cancel')) + '</button>' +
      '<button type="submit" class="btn btn--primary">' + escapeHtml(i18n.t('btn_save')) + '</button>' +
      '</div>' +
      '</form>';

    renderTechRows();
    bindEvents();
  }

  function renderTypeSpecificFields(type, rec) {
    if (type === RECORD_TYPES.EXPERIENCE) {
      return (
        '<div class="form-row">' +
        '<div class="form-group">' +
        '<label>' + escapeHtml(i18n.t('lbl_company')) + '</label>' +
        '<input type="text" id="fieldCompany" class="input" value="' + escapeHtml(rec?.company || '') + '" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + escapeHtml(i18n.t('lbl_role')) + '</label>' +
        '<input type="text" id="fieldRole" class="input" value="' + escapeHtml(rec?.role || '') + '" />' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="filter-checkbox">' +
        '<input type="checkbox" id="fieldIsCurrent" ' + (rec?.isCurrent ? 'checked' : '') + ' />' +
        '<span>' + escapeHtml(i18n.t('lbl_current')) + '</span>' +
        '</label>' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + escapeHtml(i18n.t('lbl_resp')) + '</label>' +
        '<textarea id="fieldResponsibilities" class="input" rows="2">' + escapeHtml(rec?.responsibilities || '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + escapeHtml(i18n.t('lbl_achiev')) + '</label>' +
        '<textarea id="fieldAchievements" class="input" rows="2">' + escapeHtml(rec?.achievements || '') + '</textarea>' +
        '</div>'
      );
    }

    if (type === RECORD_TYPES.ACTIVITY) {
      const subOptions = ACTIVITY_SUBTYPES.map(
        st => '<option value="' + st + '" ' + (rec?.activityType === st ? 'selected' : '') + '>' + st + '</option>'
      ).join('');

      return (
        '<div class="form-row">' +
        '<div class="form-group">' +
        '<label>' + escapeHtml(i18n.t('lbl_act_type')) + '</label>' +
        '<select id="fieldActivityType" class="input">' + subOptions + '</select>' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + escapeHtml(i18n.t('lbl_format')) + '</label>' +
        '<input type="text" id="fieldFormat" class="input" value="' + escapeHtml(rec?.format || '') + '" placeholder="Online / Offline" />' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + escapeHtml(i18n.t('lbl_org')) + '</label>' +
        '<input type="text" id="fieldOrganizer" class="input" value="' + escapeHtml(rec?.organizer || '') + '" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + escapeHtml(i18n.t('lbl_topics')) + '</label>' +
        '<input type="text" id="fieldTopics" class="input" value="' + escapeHtml(rec?.topics || '') + '" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + escapeHtml(i18n.t('lbl_takeaways')) + '</label>' +
        '<textarea id="fieldTakeaways" class="input" rows="2">' + escapeHtml(rec?.takeaways || '') + '</textarea>' +
        '</div>'
      );
    }

    const projTypes = ['Personal', 'Educational', 'Commercial']
      .map(pt => '<option value="' + pt + '" ' + (rec?.projectType === pt ? 'selected' : '') + '>' + pt + '</option>')
      .join('');

    const statuses = ['In Progress', 'Completed', 'Planned', 'Archived']
      .map(st => '<option value="' + st + '" ' + (rec?.status === st ? 'selected' : '') + '>' + st + '</option>')
      .join('');

    return (
      '<div class="form-row">' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_proj_type')) + '</label>' +
      '<select id="fieldProjectType" class="input">' + projTypes + '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_status')) + '</label>' +
      '<select id="fieldStatus" class="input">' + statuses + '</select>' +
      '</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_goals')) + '</label>' +
      '<textarea id="fieldGoals" class="input" rows="2">' + escapeHtml(rec?.goals || '') + '</textarea>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_tasks')) + '</label>' +
      '<textarea id="fieldTasks" class="input" rows="2">' + escapeHtml(rec?.tasks || '') + '</textarea>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>' + escapeHtml(i18n.t('lbl_results')) + '</label>' +
      '<textarea id="fieldResults" class="input" rows="2">' + escapeHtml(rec?.results || '') + '</textarea>' +
      '</div>'
    );
  }

  function renderTechRows() {
    const box = container.querySelector('#techRowsContainer');
    const techDatalist = state.dictionaries.technologies
      .map(t => '<option value="' + escapeHtml(t.name) + '">')
      .join('');

    const rowsHtml = techRows
      .map((row, idx) => {
        const levelOpts = PROFICIENCY_LEVELS.map(
          l =>
            '<option value="' +
            l +
            '" ' +
            (row.proficiency_level === l ? 'selected' : '') +
            '>' +
            escapeHtml(i18n.tLevel(l)) +
            '</option>'
        ).join('');

        const relOpts = TECH_RELEVANCE.map(
          r => '<option value="' + r + '" ' + (row.relevance === r ? 'selected' : '') + '>' + r + '</option>'
        ).join('');

        const evOpts = EVIDENCE_TYPES.map(
          ev => '<option value="' + ev + '" ' + (row.evidence_type === ev ? 'selected' : '') + '>' + ev + '</option>'
        ).join('');

        return (
          '<div class="tech-link-card" data-idx="' + idx + '">' +
          '<div class="tech-link-card__top">' +
          '<input type="text" list="techSuggestionsList" class="input js-tech-name" value="' + escapeHtml(row.techName || '') + '" placeholder="Technology..." />' +
          '<button type="button" class="btn btn--ghost btn--sm js-remove-tech" title="Remove">✕</button>' +
          '</div>' +
          '<div class="form-row">' +
          '<select class="input js-tech-level">' + levelOpts + '</select>' +
          '<select class="input js-tech-rel">' + relOpts + '</select>' +
          '<select class="input js-tech-ev">' + evOpts + '</select>' +
          '</div>' +
          '<input type="text" class="input js-tech-notes" value="' + escapeHtml(row.notes || '') + '" placeholder="Notes..." />' +
          '</div>'
        );
      })
      .join('');

    box.innerHTML = '<datalist id="techSuggestionsList">' + techDatalist + '</datalist>' + rowsHtml;

    box.querySelectorAll('.js-remove-tech').forEach(btn => {
      btn.addEventListener('click', e => {
        syncTechRowsFromDOM();
        const idx = Number(e.target.closest('.tech-link-card').dataset.idx);
        techRows.splice(idx, 1);
        renderTechRows();
      });
    });
  }

  function syncTechRowsFromDOM() {
    const cards = container.querySelectorAll('.tech-link-card');
    techRows = Array.from(cards).map((card, i) => ({
      ...techRows[i],
      techName: card.querySelector('.js-tech-name').value.trim(),
      proficiency_level: card.querySelector('.js-tech-level').value,
      relevance: card.querySelector('.js-tech-rel').value,
      evidence_type: card.querySelector('.js-tech-ev').value,
      notes: card.querySelector('.js-tech-notes').value.trim(),
    }));
  }

  function bindEvents() {
    container.querySelector('#fieldType')?.addEventListener('change', e => {
      syncTechRowsFromDOM();
      currentType = e.target.value;
      render();
    });

    container.querySelector('#btnAddTechRow').addEventListener('click', () => {
      syncTechRowsFromDOM();
      techRows.push({
        techName: '',
        proficiency_level: 'Applied',
        relevance: 'Primary',
        evidence_type: 'Professional Work',
        notes: '',
      });
      renderTechRows();
    });

    container.querySelector('#btnCancelForm').addEventListener('click', onCancel);

    container.querySelector('#recordForm').addEventListener('submit', e => {
      e.preventDefault();
      syncTechRowsFromDOM();

      const domainNames = container
        .querySelector('#fieldDomains')
        .value.split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const domainIds = domainNames.map(name => repo.ensureDomain(name).id);

      const links = container
        .querySelector('#fieldLinks')
        .value.split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          const parts = line.split('|').map(p => p.trim());
          return parts.length > 1 ? { label: parts[0], url: parts[1] } : { label: '', url: parts[0] };
        });

      const preparedLinks = techRows
        .filter(r => r.techName)
        .map(r => {
          const techObj = repo.ensureTechnology(r.techName);
          return {
            id: r.id,
            technology_id: techObj.id,
            proficiency_level: r.proficiency_level,
            relevance: r.relevance,
            evidence_type: r.evidence_type,
            notes: r.notes,
          };
        });

      const payload = {
        id: record?.id,
        title: container.querySelector('#fieldTitle').value.trim(),
        startDate: container.querySelector('#fieldStart').value,
        endDate: container.querySelector('#fieldEnd').value || null,
        description: container.querySelector('#fieldDesc').value.trim(),
        domainIds,
        links,
        notes: container.querySelector('#fieldNotes').value.trim(),
        company: container.querySelector('#fieldCompany')?.value.trim(),
        role: container.querySelector('#fieldRole')?.value.trim(),
        isCurrent: container.querySelector('#fieldIsCurrent')?.checked,
        responsibilities: container.querySelector('#fieldResponsibilities')?.value.trim(),
        achievements: container.querySelector('#fieldAchievements')?.value.trim(),
        activityType: container.querySelector('#fieldActivityType')?.value,
        format: container.querySelector('#fieldFormat')?.value.trim(),
        organizer: container.querySelector('#fieldOrganizer')?.value.trim(),
        topics: container.querySelector('#fieldTopics')?.value.trim(),
        takeaways: container.querySelector('#fieldTakeaways')?.value.trim(),
        projectType: container.querySelector('#fieldProjectType')?.value,
        status: container.querySelector('#fieldStatus')?.value,
        goals: container.querySelector('#fieldGoals')?.value.trim(),
        tasks: container.querySelector('#fieldTasks')?.value.trim(),
        results: container.querySelector('#fieldResults')?.value.trim(),
      };

      const saved = repo.saveRecord(currentType, payload, preparedLinks);
      onSaved(saved);
    });
  }

  render();
}
