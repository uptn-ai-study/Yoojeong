import type { RankingEntry } from '../types/game'

/** 최초 실행 시 TOP 10이 비어 보이지 않도록 하는 목업 데이터 */
export const DEMO_RANKINGS: RankingEntry[] = [
  { id: 'VioletBear', score: 12_480, timestamp: 1 },
  { id: 'CoralFox', score: 11_920, timestamp: 2 },
  { id: 'TealOwl', score: 10_650, timestamp: 3 },
  { id: 'AmberCat', score: 9_840, timestamp: 4 },
  { id: 'IndigoHare', score: 8_720, timestamp: 5 },
  { id: 'MintKoala', score: 7_560, timestamp: 6 },
  { id: 'RoseDuck', score: 6_430, timestamp: 7 },
  { id: 'AzureNewt', score: 5_290, timestamp: 8 },
  { id: 'LimePanda', score: 4_150, timestamp: 9 },
  { id: 'PeachLynx', score: 3_080, timestamp: 10 },
]
