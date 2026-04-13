import { computed } from 'vue';
import { useCalendarStore } from '../stores/calendarStore';

export function useStats() {
  const store = useCalendarStore();

  const stats = computed(() => {
    const days = store.eventsPerDay;
    if (!days.length) return null;

    const total = days.reduce((s, d) => s + d.count, 0);
    if (total === 0) return null;

    const totalDays = days.length;
    const daysWithEvents = days.filter((d) => d.count > 0).length;

    let dayCount = 0, nightCount = 0, earlyNight = 0, lateNight = 0;
    const hourBuckets = new Array<number>(24).fill(0);

    for (const day of days) {
      for (const e of day.events) {
        const h = parseInt(e.time.slice(0, 2), 10);
        hourBuckets[h]++;
        if (h >= 7 && h < 20) dayCount++;
        else {
          nightCount++;
          if (h < 7) earlyNight++;
          else lateNight++;
        }
      }
    }

    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
    const nightPct2 = (n: number) => nightCount > 0 ? Math.round((n / nightCount) * 100) : 0;

    const busiestDay = [...days].sort((a, b) => b.count - a.count)[0];
    const avgPerActiveDay = daysWithEvents > 0 ? (total / daysWithEvents).toFixed(1) : '–';
    const avgPerAllDays   = totalDays > 0       ? (total / totalDays).toFixed(1)       : '–';

    const maxHourCount = Math.max(...hourBuckets);
    const busiestHour  = maxHourCount > 0 ? hourBuckets.indexOf(maxHourCount) : null;

    let longestGap = 0, currentGap = 0;
    let longestStreak = 0, currentStreak = 0;
    for (const d of days) {
      if (d.count === 0) { currentGap++;    longestGap    = Math.max(longestGap,    currentGap);    currentStreak = 0; }
      else               { currentStreak++; longestStreak = Math.max(longestStreak, currentStreak); currentGap    = 0; }
    }

    return {
      total, totalDays, daysWithEvents,
      dayCount, nightCount,
      dayPct: pct(dayCount), nightPct: pct(nightCount),
      earlyNight, lateNight,
      earlyNightPct: nightPct2(earlyNight), lateNightPct: nightPct2(lateNight),
      busiestDay: busiestDay.count > 0 ? busiestDay : null,
      avgPerActiveDay, avgPerAllDays,
      busiestHour, busiestHourCount: maxHourCount > 0 ? maxHourCount : null,
      longestGap, longestStreak,
    };
  });

  return { store, stats };
}
