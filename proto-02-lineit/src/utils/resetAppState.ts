import { PLAYER_ID_STORAGE_KEY } from '../composables/usePlayerId'

const WELCOME_SEEN_KEY = 'line-it-id-welcome-seen'
const DAILY_PLAYS_KEY = 'line-it-daily-plays'

/** 최초 진입·오늘 플레이 테스트용 로컬 상태 초기화 */
export function resetFirstVisitState(): void {
  localStorage.removeItem(PLAYER_ID_STORAGE_KEY)
  localStorage.removeItem(WELCOME_SEEN_KEY)
  localStorage.removeItem(DAILY_PLAYS_KEY)
}
