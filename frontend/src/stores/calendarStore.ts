import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CalendarEvent, EventsPerDay } from '../types';

export type TimeFilter = 'all' | 'day' | 'night';
export interface DateRange { from: string | null; to: string | null }
export interface Milestone { date: string; titles: string[] }

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref<CalendarEvent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filter = ref<TimeFilter>('all');
  const dateRange = ref<DateRange>({ from: null, to: null });
  const showMilestones = ref(true);

  function matchesFilter(time: string, f: TimeFilter): boolean {
    if (f === 'all') return true;
    const hour = parseInt(time.slice(0, 2), 10);
    return f === 'day' ? hour >= 6 && hour < 20 : hour >= 20 || hour < 6;
  }

  /** Timed events only (all-day events excluded from bar chart) */
  const timedEvents = computed(() => events.value.filter((e) => !e.allDay));

  /** All-day events grouped by date (milestones / historical events) */
  const milestones = computed<Milestone[]>(() => {
    const map = new Map<string, string[]>();
    for (const e of events.value.filter((e) => e.allDay)) {
      const list = map.get(e.date) ?? [];
      list.push(e.title);
      map.set(e.date, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, titles]) => ({ date, titles }));
  });

  /** All days gap-filled between first and last timed event — never date-range filtered */
  const allEventsPerDay = computed<EventsPerDay[]>(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of timedEvents.value) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    if (map.size === 0) return [];

    const sortedDates = Array.from(map.keys()).sort();
    const start = new Date(sortedDates[0]);
    const todayUtc = new Date(new Date().toISOString().slice(0, 10));
    const lastEvent = new Date(sortedDates[sortedDates.length - 1]);
    const end = lastEvent > todayUtc ? lastEvent : todayUtc;

    const result: EventsPerDay[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const dayEvents = map.get(dateStr) ?? [];
      result.push({ date: dateStr, count: dayEvents.length, events: dayEvents });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  });

  /** Y-axis ceiling: always based on unfiltered overall data */
  const maxEventsPerDay = computed(() =>
    allEventsPerDay.value.reduce((max, d) => Math.max(max, d.count), 0),
  );

  /** Days trimmed to the current zoom date-range */
  const eventsPerDay = computed<EventsPerDay[]>(() => {
    const { from, to } = dateRange.value;
    if (!from || !to) return allEventsPerDay.value;
    return allEventsPerDay.value.filter((d) => d.date >= from && d.date <= to);
  });

  /** Days further filtered by time-of-day (day / night / all) */
  const filteredEventsPerDay = computed<EventsPerDay[]>(() =>
    eventsPerDay.value.map((day) => {
      const filtered = day.events.filter((e) => matchesFilter(e.time, filter.value));
      return { date: day.date, count: filtered.length, events: filtered };
    }),
  );

  function setDateRange(from: string | null, to: string | null) {
    dateRange.value = { from, to };
  }

  async function fetchEvents() {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/calendar');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      const data = await response.json();
      events.value = data.events as CalendarEvent[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unbekannter Fehler';
      events.value = [];
    } finally {
      loading.value = false;
    }
  }

  function resetFilters() {
    filter.value = 'all';
    dateRange.value = { from: null, to: null };
    showMilestones.value = true;
  }

  function reset() {
    events.value = [];
    error.value = null;
    resetFilters();
  }

  return {
    events, loading, error,
    filter, dateRange, showMilestones,
    milestones, timedEvents,
    allEventsPerDay, eventsPerDay, filteredEventsPerDay, maxEventsPerDay,
    setDateRange, fetchEvents, reset, resetFilters,
  };
});
