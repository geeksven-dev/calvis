<template>
  <div class="flex flex-col gap-3">
    <button
      @click="store.fetchEvents()"
      :disabled="store.loading"
      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {{ store.loading ? 'Lädt…' : 'Kalender laden' }}
    </button>
    <button
      v-if="store.events.length"
      @click="store.reset()"
      class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
    >
      Zurücksetzen
    </button>
    <p v-if="store.error" class="text-red-400 text-sm">{{ store.error }}</p>
  </div>
</template>

<script setup lang="ts">
import { useCalendarStore } from '../stores/calendarStore';

const store = useCalendarStore();
</script>
