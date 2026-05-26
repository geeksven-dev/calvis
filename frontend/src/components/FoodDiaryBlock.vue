<template>
  <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
    <h2 class="text-lg font-semibold text-gray-100 mb-4">🥗 Ernährungstagebuch</h2>

    <div v-if="loading" class="text-gray-500 text-sm">Lade Dokument…</div>

    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>

    <div v-else-if="html" class="overflow-x-auto -mx-5 px-5">
      <div
        class="prose prose-invert prose-sm max-w-none
               prose-headings:text-gray-100
               prose-p:text-gray-300
               prose-li:text-gray-300
               prose-strong:text-gray-100
               prose-hr:border-gray-700
               food-diary-content"
        v-html="html"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { marked } from 'marked';

const loading = ref(true);
const error = ref<string | null>(null);
const html = ref<string | null>(null);

onMounted(async () => {
  try {
    const res = await fetch('/api/food-diary');
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

<style scoped>
/* Tabelle scrollbar machen statt Layout zu zerschießen */
:deep(.food-diary-content table) {
  font-size: 0.72rem;
  min-width: 600px;
}

:deep(.food-diary-content th),
:deep(.food-diary-content td) {
  padding: 4px 6px;
  vertical-align: top;
  min-width: 80px;
}

:deep(.food-diary-content th:first-child),
:deep(.food-diary-content td:first-child) {
  min-width: 90px;
  font-weight: 600;
  position: sticky;
  left: 0;
  background-color: #111827; /* gray-900 */
  z-index: 1;
  box-shadow: 2px 0 6px -1px rgba(0, 0, 0, 0.6);
}

/* prose-invert setzt auf tr:nth-child auch Hintergründe – überschreiben */
:deep(.food-diary-content tr > td:first-child),
:deep(.food-diary-content tr > th:first-child) {
  background-color: #111827 !important;
}
</style>
