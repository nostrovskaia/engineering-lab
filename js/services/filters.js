export function createDefaultFilterState() {
  return {
    query: '',
    techIds: [],        // массив выбранных ID технологий
    techMode: 'ANY',    // 'ANY' (OR) | 'ALL' (AND)
    levels: [],         // массив выбранных уровней: ['Applied', 'Professional']
    domainIds: [],      // массив выбранных ID доменов
    types: [],          // 'Experience', 'Project', или подтипы Activity ('Conference', 'Course' и т.д.)
  };
}

export function applyFilters(state, filters) {
  const query = filters.query.trim().toLowerCase();

  return state.records.filter(rec => {
    // 1. Полнотекстовый поиск
    if (query) {
      const searchableText = [
        rec.title,
        rec.description,
        rec.company,
        rec.role,
        rec.responsibilities,
        rec.achievements,
        rec.takeaways,
        rec.results,
        rec.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) return false;
    }

    // 2. Фильтр по типу записи / подтипу активности (OR внутри группы)
    if (filters.types.length > 0) {
      const effectiveType = rec.type === 'Activity' ? rec.activityType : rec.type;
      if (!filters.types.includes(effectiveType)) return false;
    }

    // 3. Фильтр по предметным областям (OR внутри группы)
    if (filters.domainIds.length > 0) {
      const recDomains = rec.domainIds || [];
      const hasDomain = filters.domainIds.some(dId => recDomains.includes(dId));
      if (!hasDomain) return false;
    }

    // Связи текущей записи с технологиями
    const recLinks = state.recordTechnologies.filter(l => l.record_id === rec.id);

    // 4. Фильтр по технологиям + учет уровня освоения (если выбран)
    if (filters.techIds.length > 0) {
      const matchingLinks = recLinks.filter(link => {
        const techMatch = filters.techIds.includes(link.technology_id);
        const levelMatch =
          filters.levels.length === 0 || filters.levels.includes(link.proficiency_level);
        return techMatch && levelMatch;
      });

      if (filters.techMode === 'ALL') {
        // Все выбранные технологии должны присутствовать в записи (с нужным уровнем)
        const matchedTechIds = new Set(matchingLinks.map(l => l.technology_id));
        const allPresent = filters.techIds.every(id => matchedTechIds.has(id));
        if (!allPresent) return false;
      } else {
        // Хотя бы одна выбранная технология (ANY)
        if (matchingLinks.length === 0) return false;
      }
    } else if (filters.levels.length > 0) {
      // Если технологии не выбраны, но выбран уровень — ищем любую технологию этого уровня в записи
      const hasLevel = recLinks.some(l => filters.levels.includes(l.proficiency_level));
      if (!hasLevel) return false;
    }

    return true;
  });
}
