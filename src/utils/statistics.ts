import { format, subWeeks, subMonths, subYears } from 'date-fns';

export type PeriodType = '1w' | '3w' | '1m' | '3m' | '6m' | '1y' | 'all';

export const PERIODS: { id: PeriodType; label: string }[] = [
  { id: '1w', label: '1 Нед.' },
  { id: '3w', label: '3 Нед.' },
  { id: '1m', label: '1 Мес.' },
  { id: '3m', label: '3 Мес.' },
  { id: '6m', label: 'Полгода' },
  { id: '1y', label: 'Год' },
  { id: 'all', label: 'Все' },
];

export function getFilteredValues<T extends { date: string }>(values: T[], period: PeriodType): T[] {
  if (period === 'all' || !values.length) return values;
  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case '1w': cutoff = subWeeks(now, 1); break;
    case '3w': cutoff = subWeeks(now, 3); break;
    case '1m': cutoff = subMonths(now, 1); break;
    case '3m': cutoff = subMonths(now, 3); break;
    case '6m': cutoff = subMonths(now, 6); break;
    case '1y': cutoff = subYears(now, 1); break;
    default: return values;
  }
  return values.filter(v => new Date(v.date) >= cutoff);
}

export function analyzeTrend(
  values: { value: number; date: string }[],
  inverted?: boolean
): { current: number; percent: number; direction: 'up' | 'down' | 'flat'; isGood: boolean } {
  if (!values.length) return { current: 0, percent: 0, direction: 'flat', isGood: true };
  
  const sorted = [...values].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const current = sorted[sorted.length - 1].value;
  
  if (sorted.length < 2) return { current, percent: 0, direction: 'flat', isGood: true };
  
  const previous = sorted[sorted.length - 2].value;
  const diff = current - previous;
  const percent = previous !== 0 ? (diff / previous) * 100 : 0;
  
  let direction: 'up' | 'down' | 'flat' = 'flat';
  if (diff > 0) direction = 'up';
  if (diff < 0) direction = 'down';
  
  const isGood = inverted
    ? direction === 'down' || direction === 'flat'
    : direction === 'up' || direction === 'flat';
  
  return { current, percent, direction, isGood };
}

// Generate stable mock data for stats that have no real values
export function generateMockHistory(baseVal: number, weeks: number = 52): { date: string; value: number }[] {
  return Array.from({ length: weeks }).map((_, i) => {
    const weekOffset = weeks - 1 - i;
    const d = new Date();
    d.setDate(d.getDate() - weekOffset * 7);
    const trend = Math.sin(i / 8) * (baseVal * 0.1) + (i / weeks) * baseVal * 0.4;
    const noise = (Math.random() - 0.5) * (baseVal * 0.1);
    const val = Math.max(0, Math.floor(baseVal + trend + noise));
    return { date: format(d, 'yyyy-MM-dd'), value: val };
  });
}
