# 4,000 Weeks

A personal life visualization tool based on the concept that the average human life is roughly 4,000 weeks. Map your entire life on a grid — one square per week — and color-code it with the events and periods that mattered.

## What it does

- Renders your life as a grid of ~4,000 weekly cells from birth to age 80
- Two views: **life** (rows = years of age) and **calendar** (rows = calendar years, columns = months)
- Past weeks are lit; future weeks are dim; today has an accent outline
- Add life events and date ranges: relationships, jobs, education, travel, moves, births, deaths, and more
- Events color the corresponding weeks on the grid; overlapping events blend their colors
- Hover any week for a tooltip showing the date range and which events fall in it
- Hover an event in the sidebar to highlight its weeks on the grid; click a category to filter and rainbow-color its events
- **Click a week** to quickly add a single-week event; **drag across weeks** to add a date-range event — the modal opens pre-filled with the selected dates (and pre-selected category when filtering)
- 10 built-in categories (Home, School, University, Job, Relationship, Travel, Health, Birth, Death, Other) — all renameable, recolorable, deletable; add your own
- Export to JSON and import back — all categories (including defaults) are included

## Setup

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173, enter your name and birthday, and start mapping.

## Data

Everything is stored in your browser's localStorage — no account, no server, no data leaving your machine. Use the Export button in the sidebar to download a full JSON backup. Import restores all events and categories.

## Tech

React 19 · Vite 8 · Tailwind CSS v4 · date-fns · JetBrains Mono
