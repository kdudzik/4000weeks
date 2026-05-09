# 4,000 Weeks

A personal life visualization tool based on the concept that the average human life is roughly 4,000 weeks. Map your entire life on a grid — one square per week — and color-code it with the events and periods that mattered.

## Try it

**[4kw.vercel.app](https://4kw.vercel.app)** — no install needed, runs in your browser.

## What it does

**Grid**
- Renders your life as a grid of ~4,000 weekly cells from birth to age 80
- Two views: **life** (rows = years of age) and **calendar** (rows = calendar years, columns = months)
- Past weeks are filled; future weeks are dim; today is solid black with an outline
- Hover any week for a tooltip showing the date range and which events fall in it
- **Click a week** to add a single-week event; **drag across weeks** to add a date-range event — the modal opens pre-filled

**Events & categories**
- Add life events with a label, category, date range (single week, range, or ongoing), and optional color override
- 11 built-in categories with semantic colors (Relationship, Job, School, Travel, Health, Birth, Death, and more) — all renameable, recolorable, deletable; add your own
- Hover an event in the sidebar to highlight its weeks on the grid
- Click a category to filter the grid and rainbow-color its events by chronological order

**Overlap rendering** — choose how weeks with multiple events are shown:
- **1** — shortest event wins
- **2** — two shortest events as a diagonal split
- **all** — all events as pie slices
- **blend** — all event colors averaged into one

**Color mode** (when not filtered):
- **category** — each event takes its category color
- **event** — every event gets its own unique color (golden angle spacing)

**Export**
- **Export PNG** — downloads the grid as a high-resolution image with axis labels
- **Export JSON** — full backup of all events and categories
- **Import JSON** — restore from a backup

## Data & privacy

Everything stays in your browser's localStorage — no account, no server, no data leaving your machine. Export anytime to keep a backup.

## Self-hosting

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173, enter your name and birthday, and start mapping.

## Tech

React 19 · Vite 8 · Tailwind CSS v4 · date-fns · JetBrains Mono
