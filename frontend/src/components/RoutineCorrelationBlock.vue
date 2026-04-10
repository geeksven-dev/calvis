<template>
  <div v-if="stats" class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
      Korrelation zur Tagesroutine 🏡
    </h2>
    <p class="text-xs text-gray-600 mb-5">
      Wie verteilen sich die Ereignisse auf den typischen Tagesablauf?
    </p>

    <!-- Hourly density bars (6–20 Uhr) -->
    <div class="mb-1">
      <div class="flex items-end gap-px" style="height: 48px">
        <div
          v-for="slot in stats.hourSlots"
          :key="slot.hour"
          class="flex-1 flex flex-col justify-end"
          :title="`${String(slot.hour).padStart(2,'0')}:00 – ${slot.count} Ereignisse`"
        >
          <div
            :style="{ height: slot.pct + '%' }"
            :class="[
              'w-full rounded-sm transition-all min-h-0',
              slot.pct > 0 ? slot.color : 'bg-gray-800',
            ]"
          ></div>
        </div>
      </div>
    </div>

    <!-- Phase timeline bar -->
    <div class="flex h-6 rounded-lg overflow-hidden mb-1">
      <div
        v-for="phase in ROUTINE"
        :key="phase.label"
        :style="{ width: phase.widthPct + '%' }"
        :class="[phase.colors.bg, 'flex items-center justify-center overflow-hidden']"
        :title="`${phase.label} (${fmtH(phase.from)}–${fmtH(phase.to)})`"
      >
        <span class="text-[10px] select-none" v-if="phase.widthPct > 8">{{ phase.icon }}</span>
      </div>
    </div>

    <!-- Hour labels -->
    <div class="flex mb-5">
      <div
        v-for="slot in stats.hourSlots"
        :key="slot.hour"
        class="flex-1 text-center"
      >
        <span class="text-[9px] text-gray-600 leading-none">{{ slot.hour % 2 === 0 ? String(slot.hour).padStart(2,'0') : '' }}</span>
      </div>
    </div>

    <!-- Phase cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5">
      <div
        v-for="phase in stats.phases"
        :key="phase.label"
        :class="[
          'rounded-xl p-3 border flex flex-col gap-1',
          phase.colors.border,
          phase.isPeak ? phase.colors.bg : 'bg-gray-800/60 border-transparent',
        ]"
      >
        <div class="flex items-center gap-1.5">
          <span class="text-base">{{ phase.icon }}</span>
          <span :class="['text-[11px] font-medium leading-tight', phase.colors.text]">{{ phase.label }}</span>
        </div>
        <div class="text-[10px] text-gray-500">{{ fmtH(phase.from) }}–{{ fmtH(phase.to) }}</div>
        <div :class="['text-xl font-bold leading-none mt-1', phase.isPeak ? phase.colors.text : 'text-gray-100']">
          {{ phase.count }}
        </div>
        <div class="text-[10px] text-gray-500">{{ phase.pct }}% aller Ereignisse</div>
        <div class="h-1 rounded-full bg-gray-700 mt-1">
          <div
            :class="['h-1 rounded-full transition-all', phase.colors.bar]"
            :style="{ width: phase.pct + '%' }"
          ></div>
        </div>
      </div>

      <!-- Night phase (separate, full width on small) -->
      <div
        :class="[
          'rounded-xl p-3 border flex flex-col gap-1 col-span-2 sm:col-span-3 lg:col-span-5',
          stats.nightPhase.isPeak ? 'bg-violet-900/30 border-violet-600/40' : 'bg-gray-800/60 border-transparent',
        ]"
      >
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <span class="text-base">{{ stats.nightPhase.icon }}</span>
            <div>
              <div class="text-[11px] font-medium text-violet-300">{{ stats.nightPhase.label }}</div>
              <div class="text-[10px] text-gray-500">20:00–06:00 Uhr · Schlafenszeit</div>
            </div>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-bold text-violet-300">{{ stats.nightPhase.count }}</span>
            <span class="text-xs text-gray-500">Ereignisse ({{ stats.nightPhase.pct }}%)</span>
          </div>
          <div class="w-full h-1 rounded-full bg-gray-700">
            <div class="h-1 rounded-full bg-violet-500 transition-all" :style="{ width: stats.nightPhase.pct + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="bg-gray-800 rounded-xl p-4">
        <div class="text-xs text-gray-400 mb-1">🏆 Aktivste Tagesphase</div>
        <div :class="['text-base font-semibold', stats.peakPhase.colors.text]">
          {{ stats.peakPhase.icon }} {{ stats.peakPhase.label }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          {{ fmtH(stats.peakPhase.from) }}–{{ fmtH(stats.peakPhase.to) }} · {{ stats.peakPhase.count }} Ereignisse
        </div>
      </div>

      <div class="bg-gray-800 rounded-xl p-4">
        <div class="text-xs text-gray-400 mb-1">😴 Während Mittagsschlaf (12–14h)</div>
        <div :class="['text-base font-semibold', stats.napPhase.count > 0 ? 'text-amber-300' : 'text-emerald-300']">
          {{ stats.napPhase.count }} Ereignisse
        </div>
        <div class="text-xs text-gray-500 mt-1">
          {{ stats.napPhase.count === 0 ? 'Durchgeschlafen 🎉' : `${stats.napPhase.pct}% aller Tagesereignisse` }}
        </div>
      </div>

      <div class="bg-gray-800 rounded-xl p-4">
        <div class="text-xs text-gray-400 mb-1">🌙 Schlafenszeit-Quote</div>
        <div :class="['text-base font-semibold', stats.nightPhase.pct > 20 ? 'text-amber-300' : 'text-emerald-300']">
          {{ stats.nightPhase.pct }}% nachts
        </div>
        <div class="text-xs text-gray-500 mt-1">
          {{ stats.nightPhase.count }} von {{ stats.total }} Ereignissen zwischen 20–6 Uhr
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoutineCorrelation } from '../composables/useRoutineCorrelation';

const { stats, ROUTINE, fmtH } = useRoutineCorrelation();
</script>
