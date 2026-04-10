import { watch, onMounted, onUnmounted } from 'vue';
import { useCalendarStore, type TimeFilter } from '../stores/calendarStore';

export function useUrlSync() {
  const store = useCalendarStore();
  let skipNextWrite = false;

  function buildUrl(): string {
    const params = new URLSearchParams();
    if (store.dateRange.from && store.dateRange.to) {
      params.set('from', store.dateRange.from);
      params.set('to', store.dateRange.to);
    }
    if (store.filter !== 'all') params.set('filter', store.filter);
    if (!store.showMilestones) params.set('history', '0');
    const qs = params.toString();
    return window.location.pathname + (qs ? '?' + qs : '');
  }

  function readFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const to = params.get('to');
    const filter = params.get('filter');
    const history = params.get('history');

    skipNextWrite = true;
    store.setDateRange(from ?? null, to ?? null);
    const validFilter: TimeFilter = ['all', 'day', 'night'].includes(filter ?? '')
      ? (filter as TimeFilter)
      : 'all';
    store.filter = validFilter;
    store.showMilestones = history !== '0';
  }

  function writeToUrl() {
    const newUrl = buildUrl();
    const currentUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentUrl) history.pushState({}, '', newUrl);
  }

  onMounted(() => {
    readFromUrl();
    window.addEventListener('popstate', readFromUrl);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', readFromUrl);
  });

  watch(
    () => [store.dateRange.from, store.dateRange.to, store.filter, store.showMilestones] as const,
    () => {
      if (skipNextWrite) {
        skipNextWrite = false;
        return;
      }
      writeToUrl();
    },
  );
}
