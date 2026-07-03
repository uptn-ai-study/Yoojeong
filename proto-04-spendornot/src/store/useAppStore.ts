import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSupabaseConfigured } from '../lib/supabase';
import { resolveTossUserKey } from '../lib/tossUser';
import {
  deleteCloudRecord,
  fetchCloudProfile,
  fetchCloudRecords,
  upsertCloudProfile,
  upsertCloudRecord,
  upsertCloudRecords,
} from '../services/supabaseData';
import type { Category, MonthlyStat, Record, ViewMode } from '../types';
import { isSameDay, isSameWeek } from '../utils/dateRange';
import { isSameMonth } from '../utils/format';
import { JUNE_TEST_RECORDS } from '../data/juneTestRecords';

interface PersistedSlice {
  records?: Record[];
  viewMode?: ViewMode;
  hasSeenIntro?: boolean;
  hasSetNickname?: boolean;
  user?: { name?: string };
  tossUserKey?: string;
}

interface AppState {
  user: { name: string };
  records: Record[];
  viewMode: ViewMode;
  hasSeenIntro: boolean;
  hasSetNickname: boolean;
  tossUserKey: string | null;
  isCloudEnabled: boolean;
  isCloudReady: boolean;
  syncError: string | null;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  setHasSeenIntro: (value: boolean) => void;
  setUserName: (name: string) => void;
  addRecord: (date: string, category: Category, amount: number, memo?: string) => void;
  deleteRecord: (id: string) => void;
  seedJuneTestData: () => void;
  initializeFromCloud: () => Promise<void>;
  getTotalAmount: () => number;
  getTotalCategoryTotal: (category: Category) => number;
  getDailyTotal: (day?: Date) => number;
  getDailyCategoryTotal: (category: Category, day?: Date) => number;
  getWeeklyTotal: (week?: Date) => number;
  getWeeklyCategoryTotal: (category: Category, week?: Date) => number;
  getMonthlyTotal: (month?: Date) => number;
  getMonthlyCategoryTotal: (category: Category, month?: Date) => number;
  getMonthlyStatsHistory: () => MonthlyStat[];
  getRecordsByDate: (date: string) => Record[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizePersistedState(persisted: PersistedSlice | undefined, currentState: AppState): AppState {
  const userName = typeof persisted?.user?.name === 'string' ? persisted.user.name : '';
  const hasNickname = persisted?.hasSetNickname === true || userName.length > 0;

  return {
    ...currentState,
    records: Array.isArray(persisted?.records) ? persisted.records : [],
    viewMode: persisted?.viewMode === 'fish' ? 'fish' : 'bill',
    hasSeenIntro: persisted?.hasSeenIntro === true,
    hasSetNickname: hasNickname,
    user: { name: userName },
    tossUserKey: typeof persisted?.tossUserKey === 'string' ? persisted.tossUserKey : null,
  };
}

function getProfileSnapshot(state: AppState) {
  return {
    nickname: state.user.name,
    viewMode: state.viewMode,
    hasSeenIntro: state.hasSeenIntro,
  };
}

let cloudInitPromise: Promise<void> | null = null;

async function syncProfile(state: AppState): Promise<void> {
  if (!state.isCloudEnabled || !state.tossUserKey) return;
  await upsertCloudProfile(state.tossUserKey, getProfileSnapshot(state));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: { name: '' },
      records: [],
      viewMode: 'bill',
      hasSeenIntro: false,
      hasSetNickname: false,
      tossUserKey: null,
      isCloudEnabled: isSupabaseConfigured(),
      isCloudReady: !isSupabaseConfigured(),
      syncError: null,

      setViewMode: (mode) => {
        set({ viewMode: mode });
        void syncProfile(get()).catch((error: unknown) => {
          set({ syncError: error instanceof Error ? error.message : '프로필 동기화에 실패했습니다.' });
        });
      },

      toggleViewMode: () => {
        set((state) => ({
          viewMode: state.viewMode === 'bill' ? 'fish' : 'bill',
        }));
        void syncProfile(get()).catch((error: unknown) => {
          set({ syncError: error instanceof Error ? error.message : '프로필 동기화에 실패했습니다.' });
        });
      },

      setHasSeenIntro: (value) => {
        set({ hasSeenIntro: value });
        void syncProfile(get()).catch((error: unknown) => {
          set({ syncError: error instanceof Error ? error.message : '프로필 동기화에 실패했습니다.' });
        });
      },

      setUserName: (name) => {
        set({ user: { name }, hasSetNickname: true });
        void syncProfile(get()).catch((error: unknown) => {
          set({ syncError: error instanceof Error ? error.message : '프로필 동기화에 실패했습니다.' });
        });
      },

      addRecord: (date, category, amount, memo) => {
        const trimmedMemo = memo?.trim();
        const newRecord: Record = {
          id: generateId(),
          date,
          category,
          amount,
          ...(trimmedMemo ? { memo: trimmedMemo } : {}),
        };

        set((state) => ({ records: [...(state.records ?? []), newRecord] }));

        const { isCloudEnabled, tossUserKey } = get();
        if (!isCloudEnabled || !tossUserKey) return;

        void (async () => {
          await upsertCloudProfile(tossUserKey, getProfileSnapshot(get()));
          await upsertCloudRecord(tossUserKey, newRecord);
        })().catch((error: unknown) => {
          set({ syncError: error instanceof Error ? error.message : '기록 저장에 실패했습니다.' });
        });
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: (state.records ?? []).filter((record) => record.id !== id),
        }));

        const { isCloudEnabled, tossUserKey } = get();
        if (!isCloudEnabled || !tossUserKey) return;

        void deleteCloudRecord(tossUserKey, id).catch((error: unknown) => {
          set({ syncError: error instanceof Error ? error.message : '기록 삭제에 실패했습니다.' });
        });
      },

      seedJuneTestData: () => {
        set((state) => {
          const existingIds = new Set((state.records ?? []).map((record) => record.id));
          const recordsToAdd = JUNE_TEST_RECORDS.filter((record) => !existingIds.has(record.id));

          if (recordsToAdd.length === 0) {
            return state;
          }

          return { records: [...(state.records ?? []), ...recordsToAdd] };
        });

        const { isCloudEnabled, tossUserKey } = get();
        if (!isCloudEnabled || !tossUserKey) return;

        void (async () => {
          await upsertCloudProfile(tossUserKey, getProfileSnapshot(get()));
          await upsertCloudRecords(tossUserKey, get().records ?? []);
        })().catch((error: unknown) => {
          set({ syncError: error instanceof Error ? error.message : '테스트 데이터 동기화에 실패했습니다.' });
        });
      },

      initializeFromCloud: async () => {
        if (!get().isCloudEnabled) {
          set({ isCloudReady: true });
          return;
        }

        if (cloudInitPromise) {
          await cloudInitPromise;
          return;
        }

        cloudInitPromise = (async () => {
          try {
            const tossUserKey = await resolveTossUserKey();
            const localState = get();

            const [cloudProfile, cloudRecords] = await Promise.all([
              fetchCloudProfile(tossUserKey),
              fetchCloudRecords(tossUserKey),
            ]);

            if (cloudProfile) {
              const nickname = cloudProfile.nickname;
              set({
                tossUserKey,
                user: { name: nickname },
                hasSetNickname: nickname.length > 0,
                viewMode: cloudProfile.viewMode,
                hasSeenIntro: cloudProfile.hasSeenIntro,
                records: cloudRecords,
                isCloudReady: true,
                syncError: null,
              });
              return;
            }

            const localRecords = localState.records ?? [];
            await upsertCloudProfile(tossUserKey, {
              nickname: localState.user.name,
              viewMode: localState.viewMode,
              hasSeenIntro: localState.hasSeenIntro,
            });

            const recordsToUpload = get().records ?? localRecords;
            if (recordsToUpload.length > 0) {
              await upsertCloudRecords(tossUserKey, recordsToUpload);
            }

            set({
              tossUserKey,
              isCloudReady: true,
              syncError: null,
            });
          } catch (error) {
            set({
              isCloudReady: true,
              syncError: error instanceof Error ? error.message : '클라우드 데이터를 불러오지 못했습니다.',
            });
          } finally {
            cloudInitPromise = null;
          }
        })();

        await cloudInitPromise;
      },

      getTotalAmount: () =>
        (get().records ?? []).reduce((sum, record) => sum + (record.amount ?? 0), 0),

      getTotalCategoryTotal: (category) =>
        (get().records ?? [])
          .filter((r) => r.category === category)
          .reduce((sum, r) => sum + (r.amount ?? 0), 0),

      getDailyTotal: (day = new Date()) =>
        (get().records ?? [])
          .filter((r) => isSameDay(r.date, day))
          .reduce((sum, r) => sum + (r.amount ?? 0), 0),

      getDailyCategoryTotal: (category, day = new Date()) =>
        (get().records ?? [])
          .filter((r) => isSameDay(r.date, day) && r.category === category)
          .reduce((sum, r) => sum + (r.amount ?? 0), 0),

      getWeeklyTotal: (week = new Date()) =>
        (get().records ?? [])
          .filter((r) => isSameWeek(r.date, week))
          .reduce((sum, r) => sum + (r.amount ?? 0), 0),

      getWeeklyCategoryTotal: (category, week = new Date()) =>
        (get().records ?? [])
          .filter((r) => isSameWeek(r.date, week) && r.category === category)
          .reduce((sum, r) => sum + (r.amount ?? 0), 0),

      getMonthlyTotal: (month = new Date()) =>
        (get().records ?? [])
          .filter((r) => isSameMonth(r.date, month))
          .reduce((sum, r) => sum + (r.amount ?? 0), 0),

      getMonthlyCategoryTotal: (category, month = new Date()) =>
        (get().records ?? [])
          .filter((r) => isSameMonth(r.date, month) && r.category === category)
          .reduce((sum, r) => sum + (r.amount ?? 0), 0),

      getMonthlyStatsHistory: () => {
        const records = get().records ?? [];
        const totals = new Map<string, number>();

        for (const record of records) {
          const key = record.date.slice(0, 7);
          totals.set(key, (totals.get(key) ?? 0) + (record.amount ?? 0));
        }

        const entries = Array.from(totals.entries()).sort(([a], [b]) => a.localeCompare(b));
        const years = new Set(entries.map(([key]) => Number(key.split('-')[0])));
        const showYear = years.size > 1;

        return entries.map(([key, total]) => {
          const [year, month] = key.split('-').map(Number);
          const label = showYear ? `${String(year).slice(2)}.${month}월` : `${month}월`;
          return { key, year, month, label, total };
        });
      },

      getRecordsByDate: (date) => (get().records ?? []).filter((r) => r.date === date),
    }),
    {
      name: 'spendornot-storage',
      partialize: (state) => ({
        records: state.records,
        viewMode: state.viewMode,
        hasSeenIntro: state.hasSeenIntro,
        hasSetNickname: state.hasSetNickname,
        user: state.user,
        tossUserKey: state.tossUserKey,
      }),
      merge: (persistedState, currentState) =>
        normalizePersistedState(persistedState as PersistedSlice | undefined, currentState),
    },
  ),
);
