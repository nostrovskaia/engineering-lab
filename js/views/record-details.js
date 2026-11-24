import { exportSingleRecord } from '../services/import-export.js';
import { i18n } from '../services/i18n.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openRecordDetails(container, state, recordId, { onEdit, onDelete }) {
  const rec = state.records.find(r => r.id === recordId);
  if (!rec) return;

  const links = state.recordTechnologies.filter(l => l.record_id === recordId);
  const domains = (rec.domainIds || [])
    .map(id => state.dictionaries.domains.find(d => d.id === id)?.name)
    .filter(Boolean);

  const renderBlock = (labelKey, text) =>
    text
      ? '<div class="details-block"><h4>' +
        escapeHtml(i18n.t(labelKey)) +
        '</h4><p>' +
        escapeHtml(text) +
        '</p></div>'
      : '';

  const techBadgesHtml = links.length
    ? links
        .map(link => {
          const tech = state.dictionaries.technologies.find(t => t.id === link.technology_id);
          return (
            '<div class="detail-tech-item">' +
            '<div class="detail-tech-item__top">' +
            '<strong>' +
            escapeHtml(tech ? tech.name : 'Unknown') +
            '</strong>' +
            '<span class="badge badge--level">' +
            escapeHtml(i18n.tLevel(link.proficiency_level)) +
            '</span>' +
            '</div>' +
            '<div class="detail-tech-item__meta">' +
            escapeHtml(i18n.t('lbl_role_short')) +
            ': ' +
            escapeHtml(link.relevance) +
            ' • ' +
            escapeHtml(i18n.t('lbl_evidence_short')) +
            ': ' +
            escapeHtml(link.evidence_type) +
            '</div>' +
            (link.notes ? '<p class="detail-tech-item__note">' + escapeHtml(link.notes) + '</p>' : '') +
            '</div>'
          );
        })
        .join('')
    : '<p class="text-muted">' + escapeHtml(i18n.t('no_tech_linked')) + '</p>';

  const materialsHtml =
    Array.isArray(rec.links) && rec.links.length > 0
      ? '<div class="details-block"><h4>' +
        escapeHtml(i18n.t('lbl_materials')) +
        '</h4><div class="tags-row">' +
        rec.links
          .map(
            l =>
              '<a href="' +
              escapeHtml(l.url) +
              '" target="_blank" rel="noopener" class="btn-link">↗ ' +
              escapeHtml(l.label || l.url) +
              '</a>'
          )
          .join(' • ') +
        '</div></div>'
      : '';

  const typeBadge =
    rec.type +
    (rec.activityType ? ' / ' + rec.activityType : '') +
    (rec.status ? ' • ' + rec.status : '');

  const endDateStr = rec.endDate || (rec.isCurrent ? i18n.t('present_time') : rec.startDate);
  const subHeader = [rec.role, rec.company].filter(Boolean).join(' @ ');
  const orgHeader = [rec.organizer, rec.format].filter(Boolean).join(' • ');

  container.innerHTML =
    '<div class="details-view">' +
    '<div class="details-meta">' +
    '<span class="badge badge--type">' +
    escapeHtml(typeBadge) +
    '</span>' +
    '<span class="mono-text">' +
    escapeHtml(rec.startDate + ' — ' + endDateStr) +
    '</span>' +
    '</div>' +
    '<h2 class="details-title">' +
    escapeHtml(rec.title) +
    '</h2>' +
    (subHeader ? '<p class="details-subtitle">' + escapeHtml(subHeader) + '</p>' : '') +
    (orgHeader ? '<p class="details-subtitle">' + escapeHtml(orgHeader) + '</p>' : '') +
    renderBlock('lbl_desc', rec.description) +
    renderBlock('lbl_resp', rec.responsibilities) +
    renderBlock('lbl_achiev', rec.achievements) +
    renderBlock('lbl_topics', rec.topics) +
    renderBlock('lbl_takeaways', rec.takeaways) +
    renderBlock('lbl_goals', rec.goals) +
    renderBlock('lbl_tasks', rec.tasks) +
    renderBlock('lbl_results', rec.results) +
    renderBlock('lbl_notes', rec.notes) +
    materialsHtml +
    '<div class="details-block"><h4>' +
    escapeHtml(i18n.t('filter_domains')) +
    '</h4><div class="tags-row">' +
    (domains.length
      ? domains.map(d => '<span class="tag">' + escapeHtml(d) + '</span>').join('')
      : '<span class="text-muted">' + escapeHtml(i18n.t('not_specified')) + '</span>') +
    '</div></div>' +
    '<div class="details-block"><h4>' +
    escapeHtml(i18n.t('lbl_stack')) +
    '</h4><div class="detail-tech-list">' +
    techBadgesHtml +
    '</div></div>' +
    '<div class="details-actions edit-only">' +
    '<button id="btnDetailEdit" class="btn btn--primary">' +
    escapeHtml(i18n.t('btn_edit')) +
    '</button>' +
    '<button id="btnDetailExport" class="btn btn--ghost">' +
    escapeHtml(i18n.t('btn_export')) +
    '</button>' +
    '<button id="btnDetailDelete" class="btn btn--ghost" style="color: #f87171;">' +
    escapeHtml(i18n.t('btn_delete')) +
    '</button>' +
    '</div>' +
    '</div>';

  container.querySelector('#btnDetailEdit').addEventListener('click', () => onEdit(rec));
  container.querySelector('#btnDetailExport').addEventListener('click', () => exportSingleRecord(rec.id));
  container.querySelector('#btnDetailDelete').addEventListener('click', () => {
    if (confirm(i18n.t('confirm_delete') + ' "' + rec.title + '"?')) {
      onDelete(rec.id);
    }
  });
}
