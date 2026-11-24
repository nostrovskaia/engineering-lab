export const SAMPLE_SEED_DATA = {
  schemaVersion: '1.0.0',
  meta: {
    createdAt: '2026-11-23T10:00:00.000Z',
    updatedAt: '2026-11-23T10:00:00.000Z',
  },
  dictionaries: {
    technologies: [
      { id: 'tech-ts', name: 'TypeScript' },
      { id: 'tech-kafka', name: 'Kafka' },
      { id: 'tech-sql', name: 'SQL' },
    ],
    domains: [
      { id: 'dom-qa', name: 'Quality Assurance' },
      { id: 'dom-auto', name: 'Test Automation' },
      { id: 'dom-arch', name: 'Software Architecture' },
    ],
  },
  records: [
    {
      id: 'rec-exp-1',
      type: 'Experience',
      createdAt: '2026-11-23T10:00:00.000Z',
      updatedAt: '2026-11-23T10:00:00.000Z',
      title: 'Senior QA Automation Engineer — FinTech Corp',
      company: 'FinTech Corp',
      role: 'Senior QA Automation Engineer',
      description: 'Построение архитектуры E2E и интеграционного тестирования платежного шлюза.',
      startDate: '2024-03-01',
      endDate: null,
      isCurrent: true,
      responsibilities: 'Разработка тестового фреймворка, тестирование асинхронных очередей.',
      achievements: 'Сократил время регресса с 6 часов до 25 минут.',
      domainIds: ['dom-qa', 'dom-auto'],
      links: [],
      notes: '',
    },
  ],
  recordTechnologies: [
    {
      id: 'link-1',
      record_id: 'rec-exp-1',
      technology_id: 'tech-ts',
      proficiency_level: 'Professional',
      relevance: 'Primary',
      evidence_type: 'Professional Work',
      notes: 'Основной язык фреймворка автотестов',
    },
  ],
};
