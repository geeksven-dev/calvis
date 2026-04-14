<template>
  <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex flex-col gap-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-100">🎥 Aufnahmen</h2>
      <span class="text-xs text-gray-500">{{ videos.length }} Videos</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12 text-gray-500 text-sm">
      Lädt Videos…
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-red-400 text-sm py-4 text-center">{{ error }}</div>

    <template v-else-if="videos.length">

      <!-- Video Player -->
      <div class="flex flex-col gap-2">
        <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            :key="current!.videoId"
            :src="`https://www.youtube.com/embed/${current!.videoId}`"
            class="absolute inset-0 w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          />
        </div>
        <p class="text-sm font-medium text-gray-200 text-center">{{ current!.title }}</p>
      </div>

      <!-- Thumbnail Grid -->
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        <button
          v-for="(v, i) in videos"
          :key="v.videoId"
          @click="index = i"
          :class="[
            'flex flex-col rounded-xl overflow-hidden border-2 transition-colors',
            i === index ? 'border-indigo-500' : 'border-transparent hover:border-gray-600',
          ]"
        >
          <img :src="v.thumbnail" :alt="v.title" class="w-full aspect-video object-cover" />
          <span class="text-xs text-gray-400 px-1 py-1 text-center leading-tight bg-gray-800">
            {{ v.title }}
          </span>
        </button>
      </div>

    </template>

    <div v-else class="text-gray-500 text-sm text-center py-4">Keine Videos gefunden.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';

interface Video {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
}

const auth    = useAuthStore();
const videos  = ref<Video[]>([]);
const index   = ref(0);
const loading = ref(true);
const error   = ref<string | null>(null);

const current = computed(() => videos.value[index.value]);

onMounted(async () => {
  try {
    const res = await fetch('/api/videos', { headers: auth.authHeader() });
    if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
    const data = await res.json();
    videos.value = data.videos;
    index.value = 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Fehler beim Laden';
  } finally {
    loading.value = false;
  }
});
</script>
