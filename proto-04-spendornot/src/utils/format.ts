import { parseDateString } from './dateRange';

export function formatAmount(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return safeAmount.toLocaleString('ko-KR');
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatRecordDateTitle(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${Number(month)}월 ${Number(day)}일 기록`;
}

export function isSameMonth(dateStr: string, reference = new Date()): boolean {
  const date = parseDateString(dateStr);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}
