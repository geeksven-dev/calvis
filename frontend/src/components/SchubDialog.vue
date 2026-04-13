<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <!-- Dialog -->
      <div class="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">

        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-100">⚡ Schub erfassen</h2>
          <button @click="$emit('close')" class="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none">✕</button>
        </div>

        <!-- Zeitpunkt -->
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 uppercase tracking-wider">Zeitpunkt</label>
          <input
            v-model="datetime"
            type="datetime-local"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <!-- Vordefinierte Optionen -->
        <div class="flex flex-col gap-2">
          <label class="text-xs text-gray-500 uppercase tracking-wider">Ort / Situation</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in options"
              :key="opt"
              @click="selectOption(opt)"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                selected === opt && !customActive
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700',
              ]"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <!-- Eigener Titel -->
        <div class="flex flex-col gap-2">
          <label class="text-xs text-gray-500 uppercase tracking-wider">Oder eigener Titel</label>
          <div class="flex gap-2 items-center">
            <input
              v-model="customTitle"
              @focus="customActive = true; selected = ''"
              type="text"
              placeholder="z. B. beim Mittagessen"
              class="flex-1 bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none transition-colors"
              :class="customActive ? 'border-indigo-500' : 'border-gray-700'"
            />
          </div>
        </div>

        <!-- Vorschau -->
        <div v-if="resolvedTitle" class="bg-gray-800/60 rounded-lg px-3 py-2 text-sm text-gray-400">
          Eintrag: <span class="text-gray-100 font-medium">{{ resolvedTitle }}</span>
        </div>

        <!-- Fehler -->
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button
            @click="$emit('close')"
            class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            @click="submit"
            :disabled="!resolvedTitle || loading"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              resolvedTitle && !loading
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed',
            ]"
          >
            {{ loading ? 'Wird gespeichert…' : 'Speichern' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const auth = useAuthStore();

const options = [
  'im Schlaf',
  'beim Spielen',
  'in Kita',
  'im Wohnzimmer',
  'im Auto',
  'auf Sofa',
  'beim Frühstück',
  'beim Mittagessen',
  'im Bad',
  'beim Einschlafen',
];

const selected    = ref('');
const customActive = ref(false);
const customTitle = ref('');
const datetime    = ref('');
const loading     = ref(false);
const error       = ref<string | null>(null);

// Aktuellen Zeitpunkt beim Öffnen vorausfüllen
watch(() => props.open, (val) => {
  if (val) {
    const now = new Date();
    now.setSeconds(0, 0);
    datetime.value = now.toISOString().slice(0, 16);
    selected.value = '';
    customActive.value = false;
    customTitle.value = '';
    error.value = null;
  }
});

function selectOption(opt: string) {
  selected.value = opt;
  customActive.value = false;
  customTitle.value = '';
}

const resolvedTitle = computed(() => {
  if (customActive.value && customTitle.value.trim())
    return `Schub ${customTitle.value.trim()}`;
  if (!customActive.value && selected.value)
    return `Schub ${selected.value}`;
  return '';
});

async function submit() {
  if (!resolvedTitle.value) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
      body: JSON.stringify({
        title: resolvedTitle.value,
        datetime: datetime.value ? new Date(datetime.value).toISOString() : undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? `HTTP ${res.status}`);
    }
    emit('saved');
    emit('close');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unbekannter Fehler';
  } finally {
    loading.value = false;
  }
}
</script>
