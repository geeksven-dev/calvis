<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import CalendarInput from './components/CalendarInput.vue';
import EventChart from './components/EventChart.vue';
import StatsBlock from './components/StatsBlock.vue';
import DayTimeStatsBlock from './components/DayTimeStatsBlock.vue';
import RoutineCorrelationBlock from './components/RoutineCorrelationBlock.vue';
import SchubDialog from './components/SchubDialog.vue';
import LoginDialog from './components/LoginDialog.vue';
import SymptomatikBlock from './components/SymptomatikBlock.vue';
import { useAuthStore } from './stores/authStore';
import { useCalendarStore } from './stores/calendarStore';
import { useUrlSync } from './composables/useUrlSync';
import type { TimeFilter } from './stores/calendarStore';

const store = useCalendarStore();
const auth  = useAuthStore();
useUrlSync();
onMounted(() => store.fetchEvents());

const dialogOpen = ref(false);
const loginOpen  = ref(false);

function onSchubSaved() {
  store.fetchEvents();
}

const navLinks = [
  { id: 'symptomatik', icon: '🧠', label: 'Symptomatik' },
  { id: 'chart',       icon: '📈', label: 'Verlauf' },
  { id: 'stats',       icon: '📊', label: 'Statistiken' },
  { id: 'tagesanalyse',icon: '☀️',  label: 'Tagesanalyse' },
  { id: 'routine',     icon: '🔄', label: 'Routinen' },
];

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

    <!-- Nav -->
    <nav class="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800 mb-6 -mx-4 md:-mx-8 px-4 md:px-8">
      <div class="max-w-screen-2xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
        <a
          v-for="link in navLinks"
          :key="link.id"
          :href="`#${link.id}`"
          class="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
        >
          {{ link.icon }} {{ link.label }}
        </a>
        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Auth + Schub erfassen (Desktop) -->
        <template v-if="auth.isLoggedIn">
          <button
            @click="dialogOpen = true"
            class="hidden md:flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            ⚡ Schub erfassen
          </button>
          <button
            @click="auth.logout()"
            class="flex-shrink-0 flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="Abmelden"
          >
            🔓 Abmelden
          </button>
        </template>
        <button
          v-else
          @click="loginOpen = true"
          class="hidden md:flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          🔒 Anmelden
        </button>
      </div>
    </nav>

    <main class="max-w-screen-2xl mx-auto flex flex-col gap-5 pb-24 md:pb-0">

      <!-- Controls Bar -->
      <div class="bg-gray-900 rounded-2xl border border-gray-800 px-4 py-4 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:gap-4 md:px-5">

        <!-- Row 1 (mobile): Load / Reset -->
        <div class="w-full md:w-auto">
          <CalendarInput />
        </div>

        <!-- Separator (mobile only) -->
        <div v-if="store.events.length" class="md:hidden w-full h-px bg-gray-800"></div>

        <template v-if="store.events.length">

          <!-- Divider (desktop only) -->
          <div class="hidden md:block w-px h-8 bg-gray-700"></div>

          <!-- Row 2 (mobile): Filter + Meilensteine in einer Zeile -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-gray-500 uppercase tracking-wider">Filter</span>
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

            <!-- Meilensteine direkt daneben -->
            <template v-if="store.milestones.length">
              <div class="hidden md:block w-px h-6 bg-gray-700"></div>
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
            </template>
          </div>

          <!-- Divider (desktop only) -->
          <div class="hidden md:block w-px h-8 bg-gray-700"></div>

          <!-- Row 3 (mobile): Zeitraum -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-gray-500 uppercase tracking-wider">Zeitraum</span>
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

          <!-- Row 4 (mobile): Zoom — nur wenn aktiv -->
          <div v-if="store.dateRange.from" class="flex items-center gap-2">
            <span class="text-xs text-gray-500 uppercase tracking-wider">Zoom</span>
            <button
              @click="store.setDateRange(null, null)"
              class="flex items-center gap-1.5 text-sm text-indigo-300 font-mono bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
            >
              {{ fmtDate(store.dateRange.from) }} → {{ fmtDate(store.dateRange.to!) }}
              <span class="text-gray-500 hover:text-gray-300 text-xs ml-1">✕</span>
            </button>
          </div>

          <!-- Row 5 (mobile): Stats -->
          <div class="flex items-center gap-4 text-sm text-gray-400 md:ml-auto">
            <span><span class="text-indigo-400 font-semibold">{{ store.events.length }}</span> Ereignisse</span>
            <span><span class="text-indigo-400 font-semibold">{{ store.allEventsPerDay.length }}</span> Tage gesamt</span>
          </div>

        </template>
      </div>

      <!-- Chart -->
      <div id="chart" class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <p v-if="store.events.length" class="text-xs text-gray-500 mb-3 text-right">
          💡 Bereich ziehen zum Reinzoomen
        </p>
        <EventChart />
      </div>

      <!-- Stats -->
      <StatsBlock id="stats" v-if="store.events.length" />

      <!-- Daytime breakdown -->
      <DayTimeStatsBlock id="tagesanalyse" v-if="store.events.length" />

      <!-- Routine correlation -->
      <RoutineCorrelationBlock id="routine" v-if="store.events.length" />

      <!-- Symptomatik -->
      <SymptomatikBlock id="symptomatik" />

    </main>
  </div>

  <!-- Dialoge -->
  <SchubDialog :open="dialogOpen" @close="dialogOpen = false" @saved="onSchubSaved" />
  <LoginDialog :open="loginOpen"  @close="loginOpen = false" />

  <!-- Mobiler Footer-Button (nur auf kleinen Screens) -->
  <div class="md:hidden fixed bottom-0 inset-x-0 z-40 p-4 bg-gray-950/90 backdrop-blur border-t border-gray-800">
    <button
      v-if="auth.isLoggedIn"
      @click="dialogOpen = true"
      class="w-full py-3 rounded-xl text-base font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-colors shadow-lg"
    >
      ⚡ Schub erfassen
    </button>
    <button
      v-else
      @click="loginOpen = true"
      class="w-full py-3 rounded-xl text-base font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors shadow-lg"
    >
      🔒 Anmelden
    </button>
  </div>
</template>
