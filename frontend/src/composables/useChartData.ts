import { computed, nextTick } from 'vue';
import {
  type TooltipItem,
  type Chart,
} from 'chart.js';
import { type AnnotationOptions } from 'chartjs-plugin-annotation';
import { useCalendarStore } from '../stores/calendarStore';

const NIGHT_COLOR  = 'rgba(139, 92, 246, 0.85)';
const NIGHT_BORDER = 'rgba(139, 92, 246, 1)';
const DAY_COLOR    = 'rgba(56, 189, 248, 0.85)';
const DAY_BORDER   = 'rgba(56, 189, 248, 1)';
const BIRTHDATE    = { year: 2020, month: 8, day: 13 };

function hourOf(time: string) {
  return parseInt(time.slice(0, 2), 10);
}

function milestoneAnnotations(
  store: ReturnType<typeof useCalendarStore>,
  labels: string[],
): Record<string, AnnotationOptions> {
  if (!store.showMilestones) return {};
  const labelSet = new Set(labels);
  const annotations: Record<string, AnnotationOptions> = {};

  for (const ms of store.milestones) {
    if (!labelSet.has(ms.date)) continue;
    const text = ms.titles.map((t) => (t.length > 22 ? t.slice(0, 20) + '…' : t)).join(' · ');
    annotations[`ms_${ms.date}`] = {
      type: 'line',
      xMin: ms.date,
      xMax: ms.date,
      borderColor: 'rgba(134, 239, 172, 0.40)',
      borderWidth: 1,
      borderDash: [3, 4],
      label: {
        display: true,
        content: `📌 ${text}`,
        position: 'end',
        rotation: 90,
        backgroundColor: 'rgba(15, 25, 18, 0.82)',
        color: 'rgba(134, 239, 172, 0.95)',
        font: { size: 10 },
        borderRadius: 3,
        padding: { x: 4, y: 3 },
      },
    };
  }
  return annotations;
}

function birthdayAnnotations(
  store: ReturnType<typeof useCalendarStore>,
  labels: string[],
): Record<string, AnnotationOptions> {
  if (!store.showMilestones) return {};
  const labelSet = new Set(labels);
  const annotations: Record<string, AnnotationOptions> = {};
  const maxYear = new Date().getFullYear() + 1;

  for (let year = BIRTHDATE.year + 1; year <= maxYear; year++) {
    const age = year - BIRTHDATE.year;
    const dateStr = `${year}-${String(BIRTHDATE.month).padStart(2, '0')}-${String(BIRTHDATE.day).padStart(2, '0')}`;
    if (!labelSet.has(dateStr)) continue;
    annotations[`bday_${age}`] = {
      type: 'line',
      xMin: dateStr,
      xMax: dateStr,
      borderColor: 'rgba(251, 191, 36, 0.75)',
      borderWidth: 2,
      borderDash: [5, 4],
      label: {
        display: true,
        content: `🎂 ${age} Jahr${age === 1 ? '' : 'e'}`,
        position: 'end',
        rotation: 90,
        backgroundColor: 'rgba(30, 27, 20, 0.88)',
        color: 'rgba(251, 191, 36, 1)',
        font: { size: 11, weight: 'bold' as const },
        borderRadius: 4,
        padding: { x: 6, y: 3 },
      },
    };
  }
  return annotations;
}

export function useChartData() {
  const store = useCalendarStore();

  const chartData = computed(() => {
    if (!store.eventsPerDay.length) return null;

    if (store.filter === 'all') {
      const days = store.eventsPerDay;
      return {
        labels: days.map((d) => d.date),
        datasets: [
          {
            label: 'Nacht (0–6 Uhr)',
            data: days.map((d) => d.events.filter((e) => hourOf(e.time) < 6).length),
            backgroundColor: NIGHT_COLOR,
            borderColor: NIGHT_BORDER,
            borderWidth: 1,
            borderRadius: 0,
            stack: 'events',
          },
          {
            label: 'Tagsüber (6–20 Uhr)',
            data: days.map((d) =>
              d.events.filter((e) => hourOf(e.time) >= 6 && hourOf(e.time) < 20).length,
            ),
            backgroundColor: DAY_COLOR,
            borderColor: DAY_BORDER,
            borderWidth: 1,
            borderRadius: 0,
            stack: 'events',
          },
          {
            label: 'Nacht (20–24 Uhr)',
            data: days.map((d) => d.events.filter((e) => hourOf(e.time) >= 20).length),
            backgroundColor: NIGHT_COLOR,
            borderColor: NIGHT_BORDER,
            borderWidth: 1,
            borderRadius: 4,
            stack: 'events',
          },
        ],
      };
    }

    const days = store.filteredEventsPerDay;
    const isNight = store.filter === 'night';
    return {
      labels: days.map((d) => d.date),
      datasets: [
        {
          label: isNight ? 'Nächtliche Ereignisse' : 'Tagesereignisse',
          data: days.map((d) => d.count),
          backgroundColor: isNight ? NIGHT_COLOR : DAY_COLOR,
          borderColor: isNight ? NIGHT_BORDER : DAY_BORDER,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  });

  const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Kalender-Ereignisse', font: { size: 18 } },
      tooltip: {
        callbacks: {
          afterBody: (items: TooltipItem<'bar'>[]) => {
            const index = items[0]?.dataIndex;
            if (index === undefined) return [];
            const source = store.filter === 'all' ? store.eventsPerDay : store.filteredEventsPerDay;
            return source[index]?.events.map((e) => `  ${e.time}  ${e.title}`) ?? [];
          },
        },
      },
      zoom: {
        zoom: {
          drag: {
            enabled: true,
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderColor: 'rgba(99, 102, 241, 0.8)',
            borderWidth: 1,
          },
          mode: 'x' as const,
          onZoom({ chart }: { chart: Chart }) {
            const xScale = chart.scales['x'];
            const labels = chart.data.labels as string[];
            const fromIdx = Math.max(0, Math.round(xScale.min));
            const toIdx = Math.min(labels.length - 1, Math.round(xScale.max));
            const from = labels[fromIdx];
            const to = labels[toIdx];
            if (from && to && from !== to) store.setDateRange(from, to);
            nextTick(() => chart.resetZoom());
          },
        },
      },
      annotation: {
        annotations: {
          ...birthdayAnnotations(store, store.eventsPerDay.map((d) => d.date)),
          ...milestoneAnnotations(store, store.eventsPerDay.map((d) => d.date)),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: store.filter === 'all',
        max: store.maxEventsPerDay > 0 ? store.maxEventsPerDay : undefined,
        ticks: { stepSize: 1 },
        title: { display: true, text: 'Anzahl Ereignisse' },
      },
      x: {
        stacked: store.filter === 'all',
        title: { display: true, text: 'Datum' },
      },
    },
  }));

  return { store, chartData, chartOptions };
}
