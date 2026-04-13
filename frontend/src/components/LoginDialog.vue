<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div class="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">

        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-100">🔒 Anmelden</h2>
          <button @click="$emit('close')" class="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none">✕</button>
        </div>

        <form @submit.prevent="submit" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500 uppercase tracking-wider">Benutzername</label>
            <input
              v-model="username"
              type="text"
              autocomplete="username"
              class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500 uppercase tracking-wider">Passwort</label>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
          >
            {{ loading ? 'Anmelden…' : 'Anmelden' }}
          </button>
        </form>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const auth = useAuthStore();
const username = ref('');
const password = ref('');
const loading  = ref(false);
const error    = ref<string | null>(null);

watch(() => props.open, (val) => {
  if (val) { username.value = ''; password.value = ''; error.value = null; }
});

async function submit() {
  if (!username.value || !password.value) return;
  loading.value = true;
  error.value = null;
  try {
    await auth.login(username.value, password.value);
    emit('close');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Fehler beim Anmelden';
  } finally {
    loading.value = false;
  }
}
</script>
