<template>
  <div class="bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
    <div class="flex items-center gap-1.5 text-gray-400 text-xs">
      <span>{{ icon }}</span>
      <span>{{ label }}</span>
    </div>
    <div
      :class="[
        'text-lg font-semibold leading-tight',
        accent === 'sky'    ? 'text-sky-300'    :
        accent === 'violet' ? 'text-violet-300' : 'text-gray-100',
      ]"
    >
      {{ value }}
    </div>
    <div v-if="sub" class="text-xs text-gray-500">{{ sub }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'sky' | 'violet';
}>();
</script>
