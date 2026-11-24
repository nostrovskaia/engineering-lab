const DICTIONARY = {
  ru: {
    btn_import: 'Импорт JSON',
    btn_export: 'Экспорт JSON',
    btn_new: '+ Добавить запись',
    search_placeholder: 'Поиск по записям, технологиям, заметкам...',
    filters_title: 'Фильтры',
    btn_reset: 'Сбросить',
    filter_tech: 'Навыки и технологии',
    filter_levels: 'Уровень освоения',
    filter_domains: 'Предметные области',
    filter_types: 'Тип активности',
    active_filters_lbl: 'Выбрано:',
    no_techs: 'Нет технологий',
    no_domains: 'Нет областей',
    empty_db: 'База Engineering Lab пока пуста',
    btn_load_sample: 'Загрузить демо-данные (RU)',
    empty_filter: 'Нет записей, соответствующих фильтрам',
    today: 'Сегодня',
    sec_exp: 'Career Experience',
    sec_sub: 'Projects & Activities',
    details_title: 'Детали записи',
    editor_new: 'Новая запись',
    editor_edit: 'Редактирование записи',
    btn_edit: 'Редактировать',
    btn_delete: 'Удалить',
    btn_save: 'Сохранить',
    btn_cancel: 'Отмена',
    confirm_delete: 'Удалить запись',
    import_mode_prompt:
      'В базе уже есть записи.\n\nНажмите «ОК», чтобы ДОБАВИТЬ записи из файла к текущим.\nНажмите «Отмена», чтобы ОТКРЫТЬ файл как новую базу (заменив текущие данные).',
    lbl_type: 'Тип записи',
    lbl_title: 'Название / Заголовок *',
    lbl_start: 'Дата начала *',
    lbl_end: 'Дата окончания',
    lbl_desc: 'Описание',
    lbl_domains: 'Предметные области (через запятую)',
    lbl_techs: 'Технологии и уровень освоения',
    btn_add_tech: '+ Технология',
    lbl_links: 'Ссылки и материалы (Название | URL)',
    lbl_notes: 'Личные заметки',
    lbl_company: 'Компания',
    lbl_role: 'Должность / Роль',
    lbl_current: 'Текущее место работы',
    lbl_resp: 'Основные обязанности',
    lbl_achiev: 'Достижения и результаты',
    lbl_act_type: 'Подтип активности',
    lbl_format: 'Формат',
    lbl_org: 'Организатор / Площадка',
    lbl_topics: 'Основные темы',
    lbl_takeaways: 'Личные выводы (Takeaways)',
    lbl_proj_type: 'Тип проекта',
    lbl_status: 'Статус',
    lbl_goals: 'Цели проекта',
    lbl_tasks: 'Задачи',
    lbl_results: 'Результаты проекта',
    lbl_materials: 'Материалы и ссылки',
    lbl_stack: 'Стек и уровень применения',
    lbl_role_short: 'Роль',
    lbl_evidence_short: 'Подтверждение',
    no_tech_linked: 'Технологии не привязаны',
    not_specified: 'Не указаны',
    present_time: 'По настоящее время',
    // Перевод уровней освоения
    lvl_Exposed: 'Знакомство',
    lvl_Studied: 'Изучено в теории',
    lvl_Practiced: 'Практика',
    lvl_Applied: 'Применено в проекте',
    lvl_Professional: 'Профессионально',
  },
  en: {
    btn_import: 'Import JSON',
    btn_export: 'Export JSON',
    btn_new: '+ Add Record',
    search_placeholder: 'Search records, technologies, notes...',
    filters_title: 'Filters',
    btn_reset: 'Reset',
    filter_tech: 'Skills & Technologies',
    filter_levels: 'Proficiency Level',
    filter_domains: 'Domains',
    filter_types: 'Activity Type',
    active_filters_lbl: 'Active:',
    no_techs: 'No technologies',
    no_domains: 'No domains',
    empty_db: 'Engineering Lab database is empty',
    btn_load_sample: 'Load Demo Data (EN)',
    empty_filter: 'No records match current filters',
    today: 'Today',
    sec_exp: 'Career Experience',
    sec_sub: 'Projects & Activities',
    details_title: 'Record Details',
    editor_new: 'New Record',
    editor_edit: 'Edit Record',
    btn_edit: 'Edit',
    btn_delete: 'Delete',
    btn_save: 'Save',
    btn_cancel: 'Cancel',
    confirm_delete: 'Delete record',
    import_mode_prompt:
      'Database already contains records.\n\nClick "OK" to MERGE records into current database.\nClick "Cancel" to REPLACE current database with this file.',
    lbl_type: 'Record Type',
    lbl_title: 'Title *',
    lbl_start: 'Start Date *',
    lbl_end: 'End Date',
    lbl_desc: 'Description',
    lbl_domains: 'Domains (comma-separated)',
    lbl_techs: 'Technologies & Proficiency',
    btn_add_tech: '+ Technology',
    lbl_links: 'Links & Materials (Label | URL)',
    lbl_notes: 'Personal Notes',
    lbl_company: 'Company',
    lbl_role: 'Role / Position',
    lbl_current: 'Current workplace',
    lbl_resp: 'Responsibilities',
    lbl_achiev: 'Achievements & Results',
    lbl_act_type: 'Activity Subtype',
    lbl_format: 'Format',
    lbl_org: 'Organizer / Venue',
    lbl_topics: 'Key Topics',
    lbl_takeaways: 'Personal Takeaways',
    lbl_proj_type: 'Project Type',
    lbl_status: 'Status',
    lbl_goals: 'Project Goals',
    lbl_tasks: 'Tasks',
    lbl_results: 'Project Results',
    lbl_materials: 'Materials & Links',
    lbl_stack: 'Tech Stack & Proficiency',
    lbl_role_short: 'Role',
    lbl_evidence_short: 'Evidence',
    no_tech_linked: 'No technologies linked',
    not_specified: 'Not specified',
    present_time: 'Present',
    lvl_Exposed: 'Exposed',
    lvl_Studied: 'Studied',
    lvl_Practiced: 'Practiced',
    lvl_Applied: 'Applied',
    lvl_Professional: 'Professional',
  },
};

class I18nService {
  constructor() {
    this.lang = this._detectInitialLang();
  }

  _detectInitialLang() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang')?.toLowerCase();
    return urlLang === 'en' || urlLang === 'ru' ? urlLang : 'ru';
  }

  getLang() {
    return this.lang;
  }

  setLang(newLang) {
    if (newLang !== 'ru' && newLang !== 'en') return;
    this.lang = newLang;

    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLang);
    window.history.replaceState({}, '', url.toString());

    document.documentElement.lang = newLang;
    this.applyStaticDOM();
  }

  t(key) {
    return DICTIONARY[this.lang]?.[key] || DICTIONARY.ru[key] || key;
  }

  tLevel(levelKey) {
    return this.t('lvl_' + levelKey);
  }

  applyStaticDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('#langToggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.lang);
    });
  }
}

export const i18n = new I18nService();
