import { ref } from 'vue'

const COLORS = [
  'Coral',
  'Violet',
  'Amber',
  'Teal',
  'Crimson',
  'Indigo',
  'Mint',
  'Rose',
  'Azure',
  'Lime',
  'Peach',
  'Sage',
]

const ANIMALS = [
  'Fox',
  'Bear',
  'Owl',
  'Cat',
  'Deer',
  'Duck',
  'Hare',
  'Koala',
  'Lynx',
  'Moth',
  'Newt',
  'Panda',
]

export const PLAYER_ID_STORAGE_KEY = 'line-it-player-id'
const STORAGE_KEY = PLAYER_ID_STORAGE_KEY
const WELCOME_SEEN_KEY = 'line-it-id-welcome-seen'

function generateId(): string {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${color}${animal}`
}

export function usePlayerId() {
  const playerId = ref('')

  /** 저장된 아이디를 불러오거나, 최초 진입 시 색상+동물 조합으로 생성 */
  function loadOrCreate(): string {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      playerId.value = stored
      return stored
    }
    const id = generateId()
    localStorage.setItem(STORAGE_KEY, id)
    playerId.value = id
    return id
  }

  /** @deprecated loadOrCreate 사용 */
  function loadExisting(): void {
    loadOrCreate()
  }

  /** @deprecated loadOrCreate 사용 */
  function ensurePlayerId(): string {
    return loadOrCreate()
  }

  function hasSeenWelcome(): boolean {
    return localStorage.getItem(WELCOME_SEEN_KEY) === '1'
  }

  function markWelcomeSeen(): void {
    localStorage.setItem(WELCOME_SEEN_KEY, '1')
  }

  return {
    playerId,
    loadOrCreate,
    loadExisting,
    ensurePlayerId,
    hasSeenWelcome,
    markWelcomeSeen,
  }
}
