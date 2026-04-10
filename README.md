# Calvis — Episode Diary Visualizer

A personal web application for visualizing daily episodes (e.g. health events, sleep disruptions) from an ICS calendar. Built as a family tool to track and analyse patterns in a child's daily routine.

---

## What it does

- Fetches events from a private ICS calendar URL
- Renders a **bar chart** of episodes per day, with a stacked day/night breakdown
- Supports **drag-to-zoom** on the chart with shareable URL state
- Shows **birthday annotations** and **historical milestone annotations** (all-day events)
- Provides multiple **statistics blocks** correlating events to a daily routine

---

## Project Structure

```
calvis/
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── index.ts          # Entry point — serves API + built frontend
│   │   ├── routes/
│   │   │   └── calendar.ts   # GET /api/calendar
│   │   ├── services/
│   │   │   └── calendarService.ts  # Fetches & parses ICS calendar
│   │   └── types.ts          # Shared backend types
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                 # Vue 3 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.vue           # Root layout: controls bar + chart + stats
│   │   ├── main.ts
│   │   ├── style.css         # Tailwind base styles
│   │   ├── types/
│   │   │   └── index.ts      # CalendarEvent, EventsPerDay interfaces
│   │   ├── stores/
│   │   │   └── calendarStore.ts   # Pinia store: events, filters, date range, milestones
│   │   ├── composables/
│   │   │   ├── useUrlSync.ts          # Syncs filter/zoom state ↔ URL params
│   │   │   ├── useChartData.ts        # Chart datasets, options, annotations
│   │   │   ├── useStats.ts            # General statistics computation
│   │   │   ├── useDayTimeStats.ts     # Daytime hourly breakdown
│   │   │   └── useRoutineCorrelation.ts  # Correlation to daily routine phases
│   │   └── components/
│   │       ├── CalendarInput.vue      # Load / Reset buttons
│   │       ├── EventChart.vue         # Bar chart (vue-chartjs)
│   │       ├── StatCard.vue           # Reusable stat card
│   │       ├── StatsBlock.vue         # General stats (day/night split, streaks, …)
│   │       ├── DayTimeStatsBlock.vue  # Hourly distribution + time blocks
│   │       └── RoutineCorrelationBlock.vue  # Routine phase correlation
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json              # npm workspaces root
└── README.md
```

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Node.js, Express, TypeScript        |
| ICS       | node-ical                           |
| Frontend  | Vue 3, TypeScript, Vite             |
| State     | Pinia                               |
| Styling   | Tailwind CSS v3                     |
| Charts    | Chart.js 4, vue-chartjs             |
| Zoom      | chartjs-plugin-zoom                 |
| Annotations | chartjs-plugin-annotation         |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- An ICS calendar URL (e.g. from Apple Calendar, Google Calendar, or any CalDAV server)

### Installation

```bash
npm install
```

### Development

Run backend and frontend in separate terminals:

```bash
# Terminal 1 — backend (port 3001)
npm run dev:backend

# Terminal 2 — frontend (port 5173, proxies /api → 3001)
npm run dev:frontend
```

### Configuration

Create `backend/.env`:

```env
CALENDAR_URL=https://your-calendar-url.ics
```

### Production Build

```bash
npm run build   # builds frontend → frontend/dist, then compiles backend
npm start       # starts Express on port 3001, serves both API and frontend
```

---

## Features

### Chart
- **Stacked bar chart** (all events): night 0–6h (violet) / daytime 6–20h (sky blue) / night 20–24h (violet)
- **Filtered views**: daytime only or night only
- **Drag-to-zoom**: draw a rectangle on the chart to zoom into a date range
- **URL state**: zoom window, active filter, and milestone visibility are encoded in URL params (`?from=…&to=…&filter=…&history=…`) — shareable and browser-navigable

### Annotations
- 🎂 **Birthday lines** (gold): marks each birthday with age label
- 📌 **Milestone lines** (green): all-day calendar events shown as vertical annotations with rotated labels; togglable via the "Historisch" button

### Statistics Blocks
All stats respond to the active zoom window.

| Block | Contents |
|---|---|
| **Statistik** | Total events, day/night split, busiest day, averages, streaks, longest gap |
| **Tagesanalyse** | Hourly distribution bar chart, 5 time blocks (Morgen → Abend), peak hour |
| **Korrelation** | Event density mapped to daily routine phases (wake-up, breakfast, kindergarten, nap, etc.) |

---

## Hosting

The backend serves the built frontend as static files, so only a single process needs to be deployed.

| Option | Notes |
|---|---|
| **Railway / Render** | Easiest — connect GitHub repo, set `CALENDAR_URL` env var, deploy |
| **Hetzner VPS** | ~€3/mo, full control, use Docker or PM2 |
| **Raspberry Pi + Tailscale** | Free, fully private — recommended for sensitive health data |

### Environment Variables

| Variable | Description |
|---|---|
| `CALENDAR_URL` | Full URL to the `.ics` calendar file |
| `PORT` | HTTP port (default: `3001`) |
