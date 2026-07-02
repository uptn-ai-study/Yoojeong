import type { ViewMode } from '../types';

/** 지폐 모드: 당월 기록 총합 기준 */
export function getBillLevel(monthlyAmount: number): string {
  if (monthlyAmount <= 0) return 'level_01';
  if (monthlyAmount <= 100_000) return 'level_02';
  if (monthlyAmount < 110_000) return 'level_02';
  if (monthlyAmount <= 400_000) return 'level_03';
  if (monthlyAmount < 410_000) return 'level_03';
  if (monthlyAmount <= 600_000) return 'level_04';
  if (monthlyAmount < 610_000) return 'level_04';
  if (monthlyAmount <= 900_000) return 'level_05';
  if (monthlyAmount < 910_000) return 'level_05';
  if (monthlyAmount <= 1_000_000) return 'level_06';
  if (monthlyAmount < 1_010_000) return 'level_06';
  if (monthlyAmount <= 1_500_000) return 'level_07';
  return 'level_08';
}

/** 어항 모드: 당월 기록 총합 기준 */
export function getFishLevel(monthlyAmount: number): string {
  if (monthlyAmount <= 0) return 'level_01_fish';
  if (monthlyAmount < 110_000) return 'level_01_fish';
  if (monthlyAmount <= 300_000) return 'level_02_fish';
  if (monthlyAmount < 310_000) return 'level_02_fish';
  if (monthlyAmount <= 500_000) return 'level_03_fish';
  if (monthlyAmount < 510_000) return 'level_03_fish';
  if (monthlyAmount <= 600_000) return 'level_04_fish';
  if (monthlyAmount < 610_000) return 'level_04_fish';
  if (monthlyAmount <= 1_500_000) return 'level_05_fish';
  return 'level_06_fish';
}

export function getLevelImage(amount: number, mode: ViewMode): string {
  const level = mode === 'bill' ? getBillLevel(amount) : getFishLevel(amount);
  return `/images/${level}.webp`;
}
