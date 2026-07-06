export function parseDateString(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

export function isSameDay(dateStr: string, reference = new Date()): boolean {
  const date = parseDateString(dateStr);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function getWeekRange(reference = new Date()): { start: Date; end: Date } {
  const date = new Date(reference);
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function isSameWeek(dateStr: string, reference = new Date()): boolean {
  const date = parseDateString(dateStr);
  const { start, end } = getWeekRange(reference);
  return date >= start && date <= end;
}

export function formatWeekRangeLabel(reference = new Date()): string {
  const { start, end } = getWeekRange(reference);
  const startLabel = `${start.getMonth() + 1}월 ${start.getDate()}일`;
  const endLabel = `${end.getMonth() + 1}월 ${end.getDate()}일`;
  return `${startLabel} ~ ${endLabel}`;
}

export function formatTodayLabel(reference = new Date()): string {
  return `${reference.getMonth() + 1}월 ${reference.getDate()}일`;
}
