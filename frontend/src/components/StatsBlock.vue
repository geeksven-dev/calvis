<template>
  <div v-if="stats" class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
      Statistik
      <span v-if="store.dateRange.from" class="ml-2 font-mono text-indigo-400 normal-case tracking-normal text-xs">
        {{ store.dateRange.from }} → {{ store.dateRange.to }}
      </span>
      <span v-else class="ml-2 text-gray-600 normal-case tracking-normal text-xs">
        gesamter Zeitraum
      </span>
    </h2>

    <!-- Primary Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
      <StatCard icon="🗓️" label="Ereignisse gesamt" :value="stats.total" />
      <StatCard icon="📅" :label="`Tage (${stats.daysWithEvents} aktiv)`" :value="stats.totalDays" />
      <StatCard icon="☀️" label="Tagsüber" :value="`${stats.dayCount} (${stats.dayPct}%)`" accent="sky" />
      <StatCard icon="🌙" label="Nachts" :value="`${stats.nightCount} (${stats.nightPct}%)`" accent="violet" />
    </div>

    <!-- Secondary Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
      <StatCard icon="📈" label="Aktivster Tag" :value="stats.busiestDay?.date ?? '–'" :sub="stats.busiestDay ? `${stats.busiestDay.count} Ereignisse` : ''" />
      <StatCard icon="⌀"  label="Ø Ereignisse/Tag" :value="stats.avgPerActiveDay" sub="(aktive Tage)" />
      <StatCard icon="⌀"  label="Ø Ereignisse/Tag" :value="stats.avgPerAllDays" sub="(alle Tage)" />
      <StatCard icon="🕐" label="Häufigste Stunde" :value="stats.busiestHour !== null ? `${String(stats.busiestHour).padStart(2,'0')}:00 Uhr` : '–'" :sub="stats.busiestHourCount ? `${stats.busiestHourCount}×` : ''" />
    </div>

    <!-- Night Breakdown -->
    <div v-if="stats.nightCount > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard icon="🌇" label="Frühe Nacht (20–24)" :value="`${stats.lateNight} (${stats.lateNightPct}%)`" accent="violet" />
      <StatCard icon="🌑" label="Späte Nacht (0–6)" :value="`${stats.earlyNight} (${stats.earlyNightPct}%)`" accent="violet" />
      <StatCard icon="📆" label="Leerste Strecke" :value="`${stats.longestGap} Tage`" sub="ohne Ereignis" />
      <StatCard icon="🔥" label="Längste Serie" :value="`${stats.longestStreak} Tage`" sub="mit Ereignissen" />
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-2 gap-3">
      <StatCard icon="📆" label="Leerste Strecke" :value="`${stats.longestGap} Tage`" sub="ohne Ereignis" />
      <StatCard icon="🔥" label="Längste Serie" :value="`${stats.longestStreak} Tage`" sub="mit Ereignissen" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStats } from '../composables/useStats';
import StatCard from './StatCard.vue';

const { store, stats } = useStats();
</script>
