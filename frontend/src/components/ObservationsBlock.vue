<template>
  <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
    <h2 class="text-lg font-semibold text-gray-100 mb-4">🔍 Aktuelle Beobachtungen</h2>

    <div v-if="loading" class="text-gray-500 text-sm">Lade Dokument…</div>

    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <div
      v-else-if="html"
      class="prose prose-invert prose-sm max-w-none
             prose-headings:text-gray-100
             prose-p:text-gray-300
             prose-li:text-gray-300
             prose-strong:text-gray-100
             prose-hr:border-gray-700"
      v-html="html"
    />

    <!-- Meilensteine -->
    <template v-if="store.milestones.length">
      <hr class="border-gray-700 my-5" />
      <h3 class="text-base font-semibold text-gray-100 mb-3">📌 Meilensteine</h3>
      <ul class="space-y-1.5">
        <li
          v-for="ms in store.milestones"
          :key="ms.date"
          class="flex gap-3 text-sm"
        >
          <span class="text-gray-500 font-mono shrink-0">{{ fmtDate(ms.date) }}</span>
          <span class="text-gray-300">{{ ms.titles.join(' · ') }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { marked } from 'marked';
import { useCalendarStore } from '../stores/calendarStore';

const store = useCalendarStore();

const loading = ref(true);
const error = ref<string | null>(null);
const html = ref<string | null>(null);

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

onMounted(async () => {
  try {
    const res = await fetch('/api/observations');
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    html.value = await marked.parse(data.content as string);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unbekannter Fehler';
  } finally {
    loading.value = false;
  }
});
</script>
