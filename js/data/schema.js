export const SCHEMA_VERSION = '1.0.0';

export const RECORD_TYPES = {
  EXPERIENCE: 'Experience',
  ACTIVITY: 'Activity',
  PROJECT: 'Project',
};

export const ACTIVITY_SUBTYPES = [
  'Conference',
  'Webinar',
  'Course',
  'Self-study',
  'Experiment',
];

export const PROFICIENCY_LEVELS = [
  'Exposed',      // Знакомство, наблюдение
  'Studied',      // Теоретическое изучение
  'Practiced',    // Самостоятельная практика
  'Applied',      // Применение в собственном/учебном проекте
  'Professional', // Применение в профессиональной работе
];

export const TECH_RELEVANCE = [
  'Primary',
  'Secondary',
  'Background',
];

export const EVIDENCE_TYPES = [
  'Professional Work',
  'Personal Project',
  'Experiment',
  'Course',
  'Conference/Webinar',
  'Self-study',
];

/**
 * Создает пустой корневой объект хранилища
 */
export function createEmptyDatabase() {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: {
      createdAt: now,
      updatedAt: now,
    },
    dictionaries: {
      technologies: [], // { id, name, category? }
      domains: [],      // { id, name }
    },
    records: [],        // Массив Experience | Activity | Project
    recordTechnologies: [], // Связи M:N { id, record_id, technology_id, proficiency_level, relevance, evidence_type, notes }
  };
}

/**
 * Фабрика создания базовой записи
 */
export function createRecord(type, payload = {}) {
  const now = new Date().toISOString();
  const base = {
    id: payload.id || crypto.randomUUID(),
    type,
    createdAt: payload.createdAt || now,
    updatedAt: now,
    title: payload.title || '',
    description: payload.description || '',
    startDate: payload.startDate || '', // ISO 8601 (YYYY-MM-DD)
    endDate: payload.endDate || null,   // ISO 8601 или null
    domainIds: Array.isArray(payload.domainIds) ? payload.domainIds : [],
    links: Array.isArray(payload.links) ? payload.links : [], // [{ label, url }]
    notes: payload.notes || '',
  };

  if (type === RECORD_TYPES.EXPERIENCE) {
    return {
      ...base,
      company: payload.company || '',
      role: payload.role || '',
      isCurrent: Boolean(payload.isCurrent),
      responsibilities: payload.responsibilities || '',
      achievements: payload.achievements || '',
    };
  }

  if (type === RECORD_TYPES.ACTIVITY) {
    return {
      ...base,
      activityType: payload.activityType || ACTIVITY_SUBTYPES[0],
      organizer: payload.organizer || '',
      format: payload.format || '', // Online, Offline, Hybrid
      topics: payload.topics || '',
      takeaways: payload.takeaways || '',
    };
  }

  if (type === RECORD_TYPES.PROJECT) {
    return {
      ...base,
      projectType: payload.projectType || 'Personal', // Personal, Educational, Commercial
      status: payload.status || 'Completed',          // Planned, In Progress, Completed, Archived
      goals: payload.goals || '',
      tasks: payload.tasks || '',
      results: payload.results || '',
    };
  }

  throw new Error(`Неизвестный тип записи: ${type}`);
}

/**
 * Валидация всей базы данных (используется при импорте JSON)
 * Возвращает { isValid: boolean, errors: string[] }
 */
export function validateDatabase(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Файл не является корректным JSON-объектом.'] };
  }

  if (!data.schemaVersion) {
    errors.push('Отсутствует поле schemaVersion.');
  }

  if (!data.dictionaries || !Array.isArray(data.dictionaries.technologies) || !Array.isArray(data.dictionaries.domains)) {
    errors.push('Повреждена структура справочников (dictionaries).');
  }

  if (!Array.isArray(data.records)) {
    errors.push('Поле records должно быть массивом.');
  }

  if (!Array.isArray(data.recordTechnologies)) {
    errors.push('Поле recordTechnologies должно быть массивом.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const techIds = new Set(data.dictionaries.technologies.map(t => t.id));
  const domainIds = new Set(data.dictionaries.domains.map(d => d.id));
  const recordIds = new Set();

  // Проверка записей
  data.records.forEach((rec, idx) => {
    if (!rec.id) errors.push(`Запись #${idx + 1}: отсутствует ID.`);
    if (recordIds.has(rec.id)) errors.push(`Дублирующийся ID записи: ${rec.id}`);
    recordIds.add(rec.id);

    if (!Object.values(RECORD_TYPES).includes(rec.type)) {
      errors.push(`Запись "${rec.title || rec.id}": недопустимый тип "${rec.type}".`);
    }

    if (!rec.startDate || !isValidISODate(rec.startDate)) {
      errors.push(`Запись "${rec.title || rec.id}": некорректная дата начала (${rec.startDate}).`);
    }

    if (rec.endDate && !isValidISODate(rec.endDate)) {
      errors.push(`Запись "${rec.title || rec.id}": некорректная дата окончания (${rec.endDate}).`);
    }

    if (Array.isArray(rec.domainIds)) {
      rec.domainIds.forEach(dId => {
        if (!domainIds.has(dId)) {
          errors.push(`Запись "${rec.title}": ссылка на несуществующий Domain ID (${dId}).`);
        }
      });
    }
  });

  // Проверка связей с технологиями
  data.recordTechnologies.forEach((link, idx) => {
    if (!recordIds.has(link.record_id)) {
      errors.push(`Связь #${idx + 1}: ссылается на несуществующую запись (${link.record_id}).`);
    }
    if (!techIds.has(link.technology_id)) {
      errors.push(`Связь #${idx + 1}: ссылается на несуществующую технологию (${link.technology_id}).`);
    }
    if (!PROFICIENCY_LEVELS.includes(link.proficiency_level)) {
      errors.push(`Связь #${idx + 1}: некорректный уровень освоения (${link.proficiency_level}).`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidISODate(dateStr) {
  return /^\d{4}-\d{2}(-\d{2})?$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}
