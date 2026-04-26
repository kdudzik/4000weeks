# 4,000 Weeks

A personal life visualization tool based on the concept that the average human life is roughly 4,000 weeks. Map your entire life on a grid — one square per week — and color-code it with the events and periods that mattered.

## What it does

- Renders your life as a grid of ~4,000 weekly cells from birth to age 80
- Past weeks are lit; future weeks are dark; today has a golden outline
- Add life events and date ranges: relationships, jobs, education, travel, moves, births, deaths, and more
- Events color the corresponding weeks on the grid; overlapping events blend their colors
- Hover any week for a tooltip showing the date range and which events fall in it
- Hover an event in the sidebar to highlight its weeks on the grid
- 11 built-in categories (Kindergarten, School, University, Job, Relationship, Travel, Home/Move, Birth, Death, Health, Other) — all renameable, recolorable, deletable; add your own

## Setup

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173, enter your birthday, and start mapping.

## Data

Everything is stored in your browser's localStorage — no account, no server, no data leaving your machine. To back up or migrate: open DevTools → Application → Local Storage and export the `4kw_*` keys.

## Tech

React 19 · Vite 8 · Tailwind CSS v4 · date-fns
