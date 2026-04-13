<template>
  <div v-if="stats" class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
      Tagesanalyse ☀️
      <span class="ml-2 text-gray-600 normal-case tracking-normal text-xs font-normal">
        {{ stats.total }} Ereignisse zwischen 7–20 Uhr
      </span>
    </h2>

    <!-- Hourly distribution bar chart -->
    <div class="mb-5">
      <p class="text-xs text-gray-500 mb-2">Verteilung nach Stunde</p>
      <div class="flex items-end gap-[3px] h-20">
        <div
          v-for="h in stats.hours"
          :key="h.hour"
          class="flex-1 flex flex-col items-center gap-1 group"
        >
          <div class="w-full relative flex items-end" style="height: 56px">
            <div
              :style="{ height: h.pct + '%' }"
              :class="[
                'w-full rounded-t transition-all',
                h.isPeak
                  ? 'bg-sky-400'
                  : 'bg-sky-600/50 group-hover:bg-sky-500/70',
              ]"
              :title="`${String(h.hour).padStart(2,'0')}:00 – ${String(h.hour+1).padStart(2,'0')}:00 · ${h.count} Ereignisse`"
            ></div>
          </div>
          <span :class="['text-[10px] leading-none', h.isPeak ? 'text-sky-300 font-semibold' : 'text-gray-600']">
            {{ String(h.hour).padStart(2, '0') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Time block cards -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
      <div
        v-for="block in stats.blocks"
        :key="block.label"
        :class="[
          'rounded-xl p-3 flex flex-col gap-1 border transition-colors',
          block.isPeak
            ? 'bg-sky-900/40 border-sky-600/50'
            : 'bg-gray-800 border-transparent',
        ]"
      >
        <div class="text-base">{{ block.icon }}</div>
        <div class="text-xs text-gray-400 leading-tight">{{ block.label }}</div>
        <div class="text-xs text-gray-500">{{ block.range }}</div>
        <div :class="['text-lg font-semibold', block.isPeak ? 'text-sky-300' : 'text-gray-100']">
          {{ block.count }}
        </div>
        <div class="text-xs text-gray-500">{{ block.pct }}%</div>
        <!-- Mini progress bar -->
        <div class="h-1 rounded-full bg-gray-700 mt-1">
          <div
            class="h-1 rounded-full bg-sky-500 transition-all"
            :style="{ width: block.pct + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Peak summary -->
    <div class="flex flex-wrap gap-3">
      <div class="bg-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
        <span class="text-xl">🏆</span>
        <div>
          <div class="text-xs text-gray-400">Aktivste Stunde</div>
          <div class="text-sm font-semibold text-sky-300">
            {{ String(stats.peakHour).padStart(2,'0') }}:00–{{ String(stats.peakHour + 1).padStart(2,'0') }}:00 Uhr
          </div>
        </div>
        <div class="ml-2 text-xs text-gray-500">{{ stats.peakHourCount }}×</div>
      </div>
      <div class="bg-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
        <span class="text-xl">📊</span>
        <div>
          <div class="text-xs text-gray-400">Aktivster Zeitblock</div>
          <div class="text-sm font-semibold text-sky-300">{{ stats.peakBlock.icon }} {{ stats.peakBlock.label }}</div>
        </div>
        <div class="ml-2 text-xs text-gray-500">{{ stats.peakBlock.count }} Ereignisse</div>
      </div>
      <div class="bg-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
        <span class="text-xl">💤</span>
        <div>
          <div class="text-xs text-gray-400">Ruhigster Zeitblock</div>
          <div class="text-sm font-semibold text-gray-300">{{ stats.quietBlock.icon }} {{ stats.quietBlock.label }}</div>
        </div>
        <div class="ml-2 text-xs text-gray-500">{{ stats.quietBlock.count }} Ereignisse</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDayTimeStats } from '../composables/useDayTimeStats';

const { stats } = useDayTimeStats();
</script>
