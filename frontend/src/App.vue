<script setup lang="ts">
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

const filters: { value: TimeFilter; label: string; icon: string }[] = [
  { value: 'all',   label: 'Alle',     icon: '🗓️' },
  { value: 'day',   label: 'Tagsüber', icon: '☀️' },
  { value: 'night', label: 'Nachts',   icon: '🌙' },
];
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
            📌 Historisch
          </button>
        </div>

        <!-- Zoom Range Indicator + Reset -->
        <div v-if="store.dateRange.from" class="flex items-center gap-2 flex-wrap">
          <div class="hidden sm:block w-px h-8 bg-gray-700"></div>
          <span class="text-xs text-gray-500 uppercase tracking-wider">Zoom</span>
          <span class="text-sm text-indigo-300 font-mono bg-gray-800 px-2 py-1 rounded">
            {{ store.dateRange.from }} → {{ store.dateRange.to }}
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
