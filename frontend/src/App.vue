<script setup lang="ts">
import { onMounted, computed } from 'vue';
import CalendarInput from './components/CalendarInput.vue';
import EventChart from './components/EventChart.vue';
import StatsBlock from './components/StatsBlock.vue';
import DayTimeStatsBlock from './components/DayTimeStatsBlock.vue';
import RoutineCorrelationBlock from './components/RoutineCorrelationBlock.vue';
import { useCalendarStore } from './stores/calendarStore';
import { useUrlSync } from './composables/useUrlSync';
import type { TimeFilter } from './stores/calendarStore';

const store = useCalendarStore();
useUrlSync();
onMounted(() => store.fetchEvents());

const filters: { value: TimeFilter; label: string; icon: string }[] = [
  { value: 'all',   label: 'Alle',     icon: '🗓️' },
  { value: 'day',   label: 'Tagsüber', icon: '☀️' },
  { value: 'night', label: 'Nachts',   icon: '🌙' },
];

const quickRanges = [
  { label: '2W',   days: 14 },
  { label: '4W',   days: 28 },
  { label: '3M',   days: 90 },
  { label: '6M',   days: 180 },
  { label: '1J',   days: 365 },
];

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function applyQuickRange(days: number) {
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  store.setDateRange(from, today);
}

const activeQuickDays = computed(() => {
  const { from, to } = store.dateRange;
  if (!from || !to) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (to !== today) return null;
  const diffMs = new Date(today).getTime() - new Date(from).getTime();
  const days = Math.round(diffMs / 86_400_000);
  return quickRanges.find(r => r.days === days)?.days ?? null;
});
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 px-4 py-8 md:px-8">
    <!-- Header -->
    <header class="text-center mb-6">
      <h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-1">
        📊 Schub-Tagebuch
      </h1>
      <p class="text-gray-400 text-sm md:text-base">
        Tägliche Schübe im Überblick — visualisiert aus dem Kalender
      </p>
    </header>

    <main class="max-w-screen-2xl mx-auto flex flex-col gap-5">

      <!-- Controls Bar -->
      <div class="bg-gray-900 rounded-2xl border border-gray-800 px-5 py-4 flex flex-wrap items-center gap-4">
        <!-- Load / Reset -->
        <CalendarInput />

        <!-- Divider -->
        <div v-if="store.events.length" class="hidden sm:block w-px h-8 bg-gray-700"></div>

        <!-- Filter Buttons -->
        <div v-if="store.events.length" class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-gray-500 uppercase tracking-wider mr-1">Filter</span>
          <button
            v-for="f in filters"
            :key="f.value"
            @click="store.filter = f.value"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              store.filter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
            ]"
          >
            {{ f.icon }} {{ f.label }}
          </button>
        </div>

        <!-- Historical events toggle -->
        <div v-if="store.milestones.length" class="flex items-center gap-2">
          <div class="hidden sm:block w-px h-8 bg-gray-700"></div>
          <button
            @click="store.showMilestones = !store.showMilestones"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              store.showMilestones
                ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                : 'bg-gray-800 text-gray-500 hover:bg-gray-700',
            ]"
            :title="`${store.milestones.length} historische Ereignisse`"
          >
            📌 Meilensteine
          </button>
        </div>

        <!-- Quick range buttons -->
        <div v-if="store.events.length" class="flex items-center gap-2 flex-wrap">
          <div class="hidden sm:block w-px h-8 bg-gray-700"></div>
          <span class="text-xs text-gray-500 uppercase tracking-wider mr-1">Zeitraum</span>
          <button
            v-for="r in quickRanges"
            :key="r.days"
            @click="applyQuickRange(r.days)"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeQuickDays === r.days
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
            ]"
          >
            {{ r.label }}
          </button>
        </div>

        <!-- Zoom Range Indicator + Reset -->
        <div v-if="store.dateRange.from" class="flex items-center gap-2 flex-wrap">
          <div class="hidden sm:block w-px h-8 bg-gray-700"></div>
          <span class="text-xs text-gray-500 uppercase tracking-wider">Zoom</span>
          <span class="text-sm text-indigo-300 font-mono bg-gray-800 px-2 py-1 rounded">
            {{ fmtDate(store.dateRange.from) }} → {{ fmtDate(store.dateRange.to!) }}
          </span>
          <button
            @click="store.setDateRange(null, null)"
            class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            title="Zoom zurücksetzen"
          >
            ✕ Zoom zurücksetzen
          </button>
        </div>

        <!-- Stats -->
        <div v-if="store.events.length" class="ml-auto flex items-center gap-4 text-sm text-gray-400">
          <span><span class="text-indigo-400 font-semibold">{{ store.events.length }}</span> Ereignisse</span>
          <span><span class="text-indigo-400 font-semibold">{{ store.allEventsPerDay.length }}</span> Tage gesamt</span>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <p v-if="store.events.length" class="text-xs text-gray-500 mb-3 text-right">
          💡 Bereich ziehen zum Reinzoomen
        </p>
        <EventChart />
      </div>

      <!-- Stats -->
      <StatsBlock v-if="store.events.length" />

      <!-- Daytime breakdown -->
      <DayTimeStatsBlock v-if="store.events.length" />

      <!-- Routine correlation -->
      <RoutineCorrelationBlock v-if="store.events.length" />

    </main>
  </div>
</template>
