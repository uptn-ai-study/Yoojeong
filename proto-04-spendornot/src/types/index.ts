export type Category = '택시' | '외식' | '쇼핑' | '기타';

export type Record = {
  id: string;
  date: string;
  category: Category;
  amount: number;
  memo?: string;
};

export type User = {
  name: string;
};

export type ViewMode = 'bill' | 'fish';

export const CATEGORIES: Category[] = ['택시', '외식', '쇼핑', '기타'];

export const MEMO_CATEGORIES: Category[] = ['쇼핑', '기타'];

export const MAX_MEMO_LENGTH = 50;

export function categoryHasMemo(category: Category | null): boolean {
  return category === '쇼핑' || category === '기타';
}

export type MonthlyStat = {
  key: string;
  year: number;
  month: number;
  label: string;
  total: number;
};
