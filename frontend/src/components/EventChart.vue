<template>
  <div class="relative h-[500px] md:h-[600px] w-full">
    <Bar
      v-if="chartData"
      :key="store.filter === 'all' ? 'stacked' : 'single'"
      :data="chartData"
      :options="chartOptions"
      class="[&_canvas]:cursor-crosshair"
    />
    <p v-else class="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
      Noch keine Daten geladen.
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Bar } from 'vue-chartjs';
import { useChartData } from '../composables/useChartData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, zoomPlugin, annotationPlugin);

const { store, chartData, chartOptions } = useChartData();
</script>

<style scoped>
</style>
