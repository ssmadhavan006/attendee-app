import { fetchSchedule, groupByDay, type IndicoSession } from './indico.js';
import { EVENT_CONFIG } from '../config.js';

const SCHEDULE_STORAGE_KEY = 'uci:schedule';
const BOOKMARKS_STORAGE_KEY = 'uci:bookmarks';

function hydrateSessions(raw: unknown): IndicoSession[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => ({
      ...s,
      start: new Date(s.start),
      end: new Date(s.end),
    }))
    .filter((s) => !Number.isNaN(s.start.getTime()) && !Number.isNaN(s.end.getTime()));
}

export const bookmarksStore = $state({
  bookmarkedIds: new Set<string>(),
  isInitialized: false,

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;
    try {
      const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (stored) {
        this.bookmarkedIds = new Set(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  },

  toggle(id: string) {
    this.init();
    const next = new Set(this.bookmarkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.bookmarkedIds = next;
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // ignore
    }
  },

  has(id: string): boolean {
    this.init();
    return this.bookmarkedIds.has(id);
  },
});

export const scheduleStore = $state({
  status: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  sessions: [] as IndicoSession[],
  sessionsByDay: new Map<string, IndicoSession[]>(),
  errorMessage: null as string | null,

  async load() {
    if (this.status === 'loading') return;

    if (this.sessions.length === 0 && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (cached) {
          const parsed = hydrateSessions(JSON.parse(cached));
          if (parsed.length > 0) {
            this.sessions = parsed;
            this.sessionsByDay = groupByDay(parsed);
            this.status = 'success';
          }
        }
      } catch {
        // ignore parse error
      }
    }

    if (this.sessions.length === 0) {
      this.status = 'loading';
    }
    this.errorMessage = null;

    try {
      const sessions = await fetchSchedule(EVENT_CONFIG.indicoId);
      this.sessions = sessions;
      this.sessionsByDay = groupByDay(sessions);
      this.status = 'success';

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(sessions));
        } catch {
          // ignore storage error
        }
      }
    } catch (err) {
      if (this.sessions.length === 0) {
        this.errorMessage = err instanceof Error ? err.message : 'Failed to load schedule';
        this.status = 'error';
      }
    }
  },
});
