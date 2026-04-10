import { computed } from 'vue';
import { useCalendarStore } from '../stores/calendarStore';

// Colors must be complete Tailwind class strings (no dynamic construction)
export const COLOR_MAP = {
  sky:     { bg: 'bg-sky-800/50',     border: 'border-sky-600/50',     text: 'text-sky-300',     bar: 'bg-sky-500',     density: 'bg-sky-500'     },
  amber:   { bg: 'bg-amber-800/50',   border: 'border-amber-600/50',   text: 'text-amber-300',   bar: 'bg-amber-500',   density: 'bg-amber-500'   },
  emerald: { bg: 'bg-emerald-800/50', border: 'border-emerald-600/50', text: 'text-emerald-300', bar: 'bg-emerald-500', density: 'bg-emerald-500' },
  orange:  { bg: 'bg-orange-800/50',  border: 'border-orange-600/50',  text: 'text-orange-300',  bar: 'bg-orange-500',  density: 'bg-orange-500'  },
  indigo:  { bg: 'bg-indigo-800/50',  border: 'border-indigo-600/50',  text: 'text-indigo-300',  bar: 'bg-indigo-500',  density: 'bg-indigo-500'  },
  teal:    { bg: 'bg-teal-800/50',    border: 'border-teal-600/50',    text: 'text-teal-300',    bar: 'bg-teal-500',    density: 'bg-teal-500'    },
  purple:  { bg: 'bg-purple-800/50',  border: 'border-purple-600/50',  text: 'text-purple-300',  bar: 'bg-purple-500',  density: 'bg-purple-500'  },
  violet:  { bg: 'bg-violet-800/50',  border: 'border-violet-600/50',  text: 'text-violet-300',  bar: 'bg-violet-500',  density: 'bg-violet-500'  },
} as const;

export type ColorKey = keyof typeof COLOR_MAP;

export interface RoutinePhase {
  label: string; icon: string; from: number; to: number;
  colorKey: ColorKey; widthPct: number;
  colors: (typeof COLOR_MAP)[ColorKey];
}

const RAW_ROUTINE: { label: string; icon: string; from: number; to: number; colorKey: ColorKey }[] = [
  { label: 'Aufwachen',        icon: '🌤️', from: 6.0,  to: 8.0,  colorKey: 'sky'     },
  { label: 'Frühstück',        icon: '🥐',  from: 8.0,  to: 8.5,  colorKey: 'amber'   },
  { label: 'Kiga-Start',       icon: '🚗',  from: 8.5,  to: 11.0, colorKey: 'emerald' },
  { label: 'Mittagessen',      icon: '🍽️', from: 11.0, to: 12.0, colorKey: 'orange'  },
  { label: 'Mittagsschlaf',    icon: '😴',  from: 12.0, to: 14.0, colorKey: 'indigo'  },
  { label: 'Vesper & Spielen', icon: '🧸',  from: 14.0, to: 16.5, colorKey: 'emerald' },
  { label: 'Heimkommen',       icon: '🏠',  from: 16.5, to: 18.0, colorKey: 'teal'    },
  { label: 'Abendessen',       icon: '🍽️', from: 18.0, to: 18.5, colorKey: 'orange'  },
  { label: 'Abendroutine',     icon: '📚',  from: 18.5, to: 20.0, colorKey: 'purple'  },
];

export const ROUTINE: RoutinePhase[] = RAW_ROUTINE.map((p) => ({
  ...p,
  colors: COLOR_MAP[p.colorKey],
  widthPct: ((p.to - p.from) / 14) * 100,
}));

export function fmtH(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function phaseForHour(hour: number): RoutinePhase | undefined {
  return ROUTINE.find((p) => hour >= p.from && hour < p.to);
}

export function useRoutineCorrelation() {
  const store = useCalendarStore();

  const stats = computed(() => {
    const days = store.eventsPerDay;
    if (!days.length) return null;

    const hourCounts = new Array<number>(24).fill(0);
    let total = 0;

    for (const day of days) {
      for (const e of day.events) {
        const h = parseInt(e.time.slice(0, 2), 10);
        hourCounts[h]++;
        total++;
      }
    }
    if (total === 0) return null;

    const maxDayCount = Math.max(...hourCounts.slice(6, 20), 1);
    const hourSlots = Array.from({ length: 14 }, (_, i) => {
      const hour = 6 + i;
      const count = hourCounts[hour];
      const phase = phaseForHour(hour);
      return {
        hour,
        count,
        pct: Math.round((count / maxDayCount) * 100),
        color: phase ? phase.colors.density : 'bg-gray-600',
      };
    });

    const phaseCounts = ROUTINE.map((phase) => {
      let count = 0;
      for (let h = Math.floor(phase.from); h < Math.ceil(phase.to); h++) {
        if (h >= phase.from && h < phase.to) count += hourCounts[h];
      }
      return count;
    });

    const dayTotal   = phaseCounts.reduce((s, c) => s + c, 0);
    const nightCount = hourCounts.slice(0, 6).reduce((s, c) => s + c, 0) +
                       hourCounts.slice(20, 24).reduce((s, c) => s + c, 0);
    const peakCount  = Math.max(...phaseCounts);

    const phases = ROUTINE.map((phase, i) => ({
      ...phase,
      count: phaseCounts[i],
      pct: dayTotal > 0 ? Math.round((phaseCounts[i] / total) * 100) : 0,
      isPeak: phaseCounts[i] === peakCount && peakCount > 0,
    }));

    const peakPhase  = phases.reduce((a, b) => (b.count > a.count ? b : a));
    const napPhase   = phases.find((p) => p.label === 'Mittagsschlaf')!;
    const nightPhase = {
      label: 'Nachtschlaf', icon: '🌙',
      count: nightCount,
      pct: total > 0 ? Math.round((nightCount / total) * 100) : 0,
      isPeak: nightCount > peakCount,
    };

    return { hourSlots, phases, peakPhase, napPhase, nightPhase, total };
  });

  return { stats, ROUTINE, fmtH };
}
