# Engineering Lab — Career Timeline & Competency System

**Engineering Lab** is a local-first web application designed to structure, store, and visualize professional experience, technical/non-technical skills, projects, and continuous learning activities over time.

Built with **zero external dependencies** using pure HTML5, CSS3, and modular Vanilla JavaScript (ES6+), featuring a strict separation between the portable **Data Core** and the **Presentation Layer**.

🔗 **Live Demo:** `https://<username>.github.io/<repo-name>/` *(EN)* | `https://<username>.github.io/<repo-name>/?lang=ru` *(RU)*

---

## ✨ Key Features (MVP 1.0)

* **Interactive Career Timeline**:
  * Dual-track layout separating **Career Experience** from **Projects & Activities** (Courses, Conferences, Webinars, Self-study, Experiments).
  * Smart lane packing for overlapping intervals and point-in-time markers for short events.
  * Smooth drag-to-scroll navigation, dynamic zooming (`25% – 400%`) with month-level grid reveal, and a live "Today" marker.
* **Multi-Dimensional Filtering & Search**:
  * Full-text search across titles, descriptions, responsibilities, achievements, and notes.
  * Filter by **Skills & Technologies** with `ANY` (OR) / `ALL` (AND) toggle logic.
  * Context-aware **Proficiency Level** filtering (`Exposed` → `Studied` → `Practiced` → `Applied` → `Professional`) evaluated per specific skill link.
  * Active filter chips bar for instant single-click filter removal.
* **Bilingual Support (`RU` / `EN`)**:
  * Instant UI and dataset switching via header toggle or URL query parameters (`?lang=en` / `?lang=ru`).
* **Showcase & Edit Modes**:
  * Opens in clean read-only showcase mode by default.
  * Append `?edit=true` to the URL to unlock JSON import/export, record creation, inline editing, and deletion.
* **Standalone Data Editor (`editor.html`)**:
  * Dedicated offline form generator with live JSON schema preview (`v1.0.0`) for creating and editing individual records.

---

## 🏗 Architecture

> **Why Vanilla JS for MVP 1.0?** Starting without frameworks allowed rapid validation of the data schema and timeline engine with zero build overhead. Because the `Data Core` and JSON format are strictly decoupled from the DOM, Phase 2 & 3 will seamlessly migrate the UI layer to **React + TypeScript** without altering existing career datasets.

The system follows a 3-layer modular architecture so that accumulated career data remains completely independent of UI frameworks:

```text
├── index.html                  # Main Career Timeline application
├── editor.html                 # Standalone offline JSON record editor
├── css/                        # Modern Technical / Neon Engineering theme
│   ├── base.css                # CSS variables, circuit-board SVG background
│   ├── layout.css              # App shell, topbar, sidebar, slide-over drawer
│   ├── components.css          # Filters, active chips, forms, record details
│   └── timeline.css            # Timeline grid, tracks, lane items, selection states
├── js/
│   ├── app.js                  # Application controller & URL state routing
│   ├── data/
│   │   ├── schema.js           # Data model definitions, UUIDs & JSON validation
│   │   └── repository.js       # State management, localStorage & Merge/Replace engine
│   ├── services/
│   │   ├── filters.js          # Multi-criteria filtering & proficiency matching
│   │   ├── i18n.js             # Localization engine (RU / EN)
│   │   └── import-export.js    # Full & single-record JSON serialization
│   └── views/
│       ├── timeline.js         # Lane-packing layout engine & timeline renderer
│       ├── record-details.js   # Slide-over record inspection view
│       └── record-editor.js    # In-app record editor view
└── data/
    ├── sample-data-en.json     # English dataset
    └── sample-data-ru.json     # Russian dataset
```

---

## 🚀 Running Locally

Because the application uses native ES6 modules (`type="module"`) and `fetch()` to load JSON datasets, it must be served over HTTP rather than opened directly via `file://`.

```bash
# Using Python 3
python3 -m http.server 8080

# Or using Node.js (npx)
npx serve .
```
Then open `http://localhost:8080/` in your browser (or `http://localhost:8080/?edit=true` for edit mode).

---

## 🗺 Roadmap

* [x] **Phase 1 (MVP 1.0 — Vanilla JS):** Visualization-agnostic JSON Data Core, schema validation, and interactive Career Timeline with zero external dependencies.
* [ ] **Phase 2 (Migration to React + TypeScript):** **Competency Map** — Migrating the presentation layer to React while reusing the existing JSON Data Core; aggregated skill matrix with evidence tracking and proficiency progression over time.
* [ ] **Phase 3 (React + Graph Engine):** **Knowledge Graph** — Interactive relationship graph linking experiences, projects, domains, and skills.

