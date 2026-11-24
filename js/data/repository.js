import { createEmptyDatabase, createRecord, validateDatabase } from './schema.js';

const STORAGE_KEY = 'engineering_lab_db_v1';

class Repository {
  constructor() {
    this.db = this._loadFromStorage() || createEmptyDatabase();
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify() {
    this.db.meta.updatedAt = new Date().toISOString();
    this._saveToStorage();
    this.listeners.forEach(fn => fn(this.getState()));
  }

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return validateDatabase(parsed).isValid ? parsed : null;
    } catch {
      return null;
    }
  }

  _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.warn('Не удалось сохранить в localStorage:', e);
    }
  }

  getState() {
    return structuredClone(this.db);
  }

  replaceDatabase(newDb) {
    const check = validateDatabase(newDb);
    if (!check.isValid) {
      throw new Error(check.errors.join('\n'));
    }
    this.db = structuredClone(newDb);
    this._notify();
  }

  mergeDatabase(incomingDb) {
    const check = validateDatabase(incomingDb);
    if (!check.isValid) {
      throw new Error(check.errors.join('\n'));
    }

    // 1. Объединяем справочники (избегаем дубликатов по ID и по названию)
    const techIdMap = new Map();
    incomingDb.dictionaries.technologies.forEach(incTech => {
      let existing = this.db.dictionaries.technologies.find(
        t => t.id === incTech.id || t.name.toLowerCase() === incTech.name.toLowerCase()
      );
      if (!existing) {
        existing = { ...incTech };
        this.db.dictionaries.technologies.push(existing);
      }
      techIdMap.set(incTech.id, existing.id);
    });

    const domIdMap = new Map();
    incomingDb.dictionaries.domains.forEach(incDom => {
      let existing = this.db.dictionaries.domains.find(
        d => d.id === incDom.id || d.name.toLowerCase() === incDom.name.toLowerCase()
      );
      if (!existing) {
        existing = { ...incDom };
        this.db.dictionaries.domains.push(existing);
      }
      domIdMap.set(incDom.id, existing.id);
    });

    // 2. Объединяем записи (если ID совпадает — обновляем, если новый — добавляем)
    const importedRecordIds = new Set();
    incomingDb.records.forEach(incRec => {
      importedRecordIds.add(incRec.id);
      const mappedRec = {
        ...incRec,
        domainIds: (incRec.domainIds || []).map(id => domIdMap.get(id) || id),
      };
      const idx = this.db.records.findIndex(r => r.id === incRec.id);
      if (idx !== -1) {
        this.db.records[idx] = mappedRec;
      } else {
        this.db.records.push(mappedRec);
      }
    });

    // 3. Обновляем связи с технологиями для импортированных записей
    this.db.recordTechnologies = this.db.recordTechnologies.filter(
      l => !importedRecordIds.has(l.record_id)
    );
    incomingDb.recordTechnologies.forEach(incLink => {
      this.db.recordTechnologies.push({
        ...incLink,
        technology_id: techIdMap.get(incLink.technology_id) || incLink.technology_id,
      });
    });

    this._notify();
  }


  // --- Справочники ---
  ensureTechnology(name) {
    const clean = name.trim();
    let tech = this.db.dictionaries.technologies.find(
      t => t.name.toLowerCase() === clean.toLowerCase()
    );
    if (!tech) {
      tech = { id: `tech-${crypto.randomUUID().slice(0, 8)}`, name: clean };
      this.db.dictionaries.technologies.push(tech);
    }
    return tech;
  }

  ensureDomain(name) {
    const clean = name.trim();
    let dom = this.db.dictionaries.domains.find(
      d => d.name.toLowerCase() === clean.toLowerCase()
    );
    if (!dom) {
      dom = { id: `dom-${crypto.randomUUID().slice(0, 8)}`, name: clean };
      this.db.dictionaries.domains.push(dom);
    }
    return dom;
  }

  // --- Записи и связи ---
  saveRecord(type, payload, techLinks = []) {
    const isEdit = Boolean(payload.id);
    const record = createRecord(type, payload);

    if (isEdit) {
      const idx = this.db.records.findIndex(r => r.id === record.id);
      if (idx !== -1) {
        record.createdAt = this.db.records[idx].createdAt;
        this.db.records[idx] = record;
      }
      // Удаляем старые связи записи перед записью актуальных
      this.db.recordTechnologies = this.db.recordTechnologies.filter(
        l => l.record_id !== record.id
      );
    } else {
      this.db.records.push(record);
    }

    // Сохраняем новые связи с технологиями
    techLinks.forEach(link => {
      this.db.recordTechnologies.push({
        id: link.id || `link-${crypto.randomUUID().slice(0, 8)}`,
        record_id: record.id,
        technology_id: link.technology_id,
        proficiency_level: link.proficiency_level,
        relevance: link.relevance,
        evidence_type: link.evidence_type,
        notes: link.notes || '',
      });
    });

    this._notify();
    return record;
  }

  deleteRecord(recordId) {
    this.db.records = this.db.records.filter(r => r.id !== recordId);
    this.db.recordTechnologies = this.db.recordTechnologies.filter(
      l => l.record_id !== recordId
    );
    this._notify();
  }
}

export const repo = new Repository();
