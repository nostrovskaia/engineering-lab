import { repo } from '../data/repository.js';
import { SCHEMA_VERSION } from '../data/schema.js';

export function exportFullDatabase() {
  const data = repo.getState();
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadJSON(data, 'engineering-lab-backup-' + dateStr + '.json');
}

export function exportSingleRecord(recordId) {
  const state = repo.getState();
  const record = state.records.find(r => r.id === recordId);
  if (!record) return;

  const links = state.recordTechnologies.filter(l => l.record_id === recordId);
  const usedTechIds = new Set(links.map(l => l.technology_id));
  const usedDomIds = new Set(record.domainIds || []);

  const exportPayload = {
    schemaVersion: SCHEMA_VERSION,
    meta: { exportedAt: new Date().toISOString(), singleRecordExport: true },
    dictionaries: {
      technologies: state.dictionaries.technologies.filter(t => usedTechIds.has(t.id)),
      domains: state.dictionaries.domains.filter(d => usedDomIds.has(d.id)),
    },
    records: [record],
    recordTechnologies: links,
  };

  const slug = record.title.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').slice(0, 30);
  downloadJSON(exportPayload, 'record-' + slug + '.json');
}

export function importDatabaseFromFile(file, mode = 'merge') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (mode === 'replace') {
          repo.replaceDatabase(parsed);
        } else {
          repo.mergeDatabase(parsed);
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error('Ошибка импорта:\n' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.readAsText(file);
  });
}

function downloadJSON(dataObj, filename) {
  const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}