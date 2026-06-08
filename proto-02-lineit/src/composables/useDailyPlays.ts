import { computed, ref } from 'vue'

const STORAGE_KEY = 'line-it-daily-plays'
const MAX_PLAYS = 100

interface DailyRecord {
  date: string
  count: number
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function readRecord(): DailyRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DailyRecord
      if (parsed.date === todayKey()) return parsed
    }
  } catch {
    /* ignore */
  }
  return { date: todayKey(), count: 0 }
}

function writeRecord(record: DailyRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
}

export function useDailyPlays() {
  const record = ref<DailyRecord>(readRecord())

  const playsToday = computed(() => record.value.count)
  const playsRemaining = computed(() =>
    Math.max(0, MAX_PLAYS - record.value.count)
  )
  const canPlay = computed(() => record.value.count < MAX_PLAYS)

  function refresh(): void {
    record.value = readRecord()
  }

  function consumePlay(): boolean {
    refresh()
    if (record.value.count >= MAX_PLAYS) return false
    record.value = {
      date: todayKey(),
      count: record.value.count + 1,
    }
    writeRecord(record.value)
    return true
  }

  return {
    playsToday,
    playsRemaining,
    canPlay,
    maxPlays: MAX_PLAYS,
    refresh,
    consumePlay,
  }
}
