import { computed } from 'vue';
import { useCalendarStore } from '../stores/calendarStore';

export const TIME_BLOCKS = [
  { label: 'Morgen',     icon: '🌅', from: 6,  to: 10 },
  { label: 'Vormittag',  icon: '🌤️', from: 10, to: 12 },
  { label: 'Mittag',     icon: '☀️',  from: 12, to: 14 },
  { label: 'Nachmittag', icon: '🌆', from: 14, to: 18 },
  { label: 'Abend',      icon: '🌇', from: 18, to: 20 },
] as const;

export function useDayTimeStats() {
  const store = useCalendarStore();

  const stats = computed(() => {
    const days = store.eventsPerDay;
    if (!days.length) return null;

    const hourCounts = new Array<number>(24).fill(0);
    for (const day of days) {
      for (const e of day.events) {
        const h = parseInt(e.time.slice(0, 2), 10);
        if (h >= 6 && h < 20) hourCounts[h]++;
      }
    }

    const total = hourCounts.slice(6, 20).reduce((s, c) => s + c, 0);
    if (total === 0) return null;

    const maxCount = Math.max(...hourCounts.slice(6, 20));

    const hours = Array.from({ length: 14 }, (_, i) => {
      const hour = 6 + i;
      const count = hourCounts[hour];
      return {
        hour,
        count,
        pct: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0,
        isPeak: count === maxCount && maxCount > 0,
      };
    });

    const blocks = TIME_BLOCKS.map((b) => {
      const count = hourCounts.slice(b.from, b.to).reduce((s, c) => s + c, 0);
      return {
        ...b,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        range: `${String(b.from).padStart(2, '0')}–${String(b.to).padStart(2, '0')} Uhr`,
        isPeak: false as boolean,
      };
    });

    const peakBlockCount = Math.max(...blocks.map((b) => b.count));
    blocks.forEach((b) => { b.isPeak = b.count === peakBlockCount && peakBlockCount > 0; });

    const peakBlock  = blocks.reduce((a, b) => (b.count > a.count ? b : a));
    const quietBlock = blocks.reduce((a, b) => (b.count < a.count ? b : a));
    const peakHour   = hourCounts.indexOf(maxCount);

    return { total, hours, blocks, peakHour, peakHourCount: maxCount, peakBlock, quietBlock };
  });

  return { stats };
}
