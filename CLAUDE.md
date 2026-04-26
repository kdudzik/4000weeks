# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server at localhost:5173
pnpm build        # production build
pnpm preview      # preview production build
pnpm lint         # run ESLint
```

Always use **pnpm**, not npm or yarn.

## Architecture

Single-page React app (Vite, Tailwind v4, date-fns). No backend — all persistence is localStorage. No routing.

**Data flow:**
- `src/hooks/useLifeData.js` — single source of truth. Wraps all localStorage reads/writes. Exposes events, categories, birthday, name, and their mutators. Pre-populates 11 default categories on first run.
- `src/App.jsx` — top-level state: holds `highlightEventId` (which event is hovered in the sidebar). Renders `SetupScreen` if no birthday stored, otherwise the grid+panel layout.

**Key data structures (localStorage keys):**
- `4kw_birthday` — ISO date string `"YYYY-MM-DD"`
- `4kw_name` — string
- `4kw_categories` — array of `{ id, label, color, icon }`
- `4kw_events` — array of `{ id, label, categoryId, color|null, startDate, endDate|null, note|null }`

**Week grid rendering (`src/components/WeekGrid.jsx`):**
- 80 rows × 52 cols = 4160 cells, rendered as an SVG `<rect>` per cell (not DOM elements)
- `src/utils/dateUtils.js` provides `enrichEvents()` which pre-computes `_startWeek`/`_endWeek` indices on each event before rendering; `getEventsForWeek()` checks overlap against those indices
- Multiple events on the same week are color-blended via `blendColors()` (RGB average)
- `highlightEventId` prop dims all non-matching colored cells when set

**CSS approach:**
- Tailwind v4 (via `@tailwindcss/vite` plugin, no `tailwind.config.js` needed)
- Design tokens live as CSS custom properties in `src/index.css` (`--bg-primary`, `--accent`, `--text-secondary`, etc.)
- Component styles are inline style objects — no CSS modules or Tailwind utility classes in JSX
- Google Fonts loaded via `@import` in `index.css`: Playfair Display (headings) + JetBrains Mono (body/mono)

**Modals:**
- `AddEventModal` — create/edit events. Receives `editEvent` prop; if set, pre-fills and calls `onUpdateEvent` instead of `onAddEvent`.
- `CategoryModal` — create/edit categories. Handles delete with confirmation.
- Both use `.modal-overlay` / `.modal` CSS classes from `index.css`.
