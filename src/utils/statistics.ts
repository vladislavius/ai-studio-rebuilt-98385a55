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
  now.setHours(23, 59, 59, 999);
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
  cutoff.setHours(0, 0, 0, 0);
  const result = values.filter(v => new Date(v.date + 'T00:00:00') >= cutoff);
  // If filtered too aggressively, return at least last 2 points for trend
  if (result.length < 2 && values.length >= 2) {
    return values.slice(-2);
  }
  return result;
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

// ============ CONDITION (STATE) SYSTEM ============
export type StatCondition = 'non_existence' | 'danger' | 'emergency' | 'normal' | 'affluence' | 'power';

export const CONDITIONS: { id: StatCondition; label: string; color: string; bgColor: string }[] = [
  { id: 'non_existence', label: 'Несуществование', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-900/40' },
  { id: 'danger', label: 'Опасность', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  { id: 'emergency', label: 'Чрезвычайное положение', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  { id: 'normal', label: 'Нормальная деятельность', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'affluence', label: 'Изобилие', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'power', label: 'Могущество', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
];

export function calculateCondition(
  values: { value: number; date: string }[],
  inverted?: boolean
): StatCondition {
  if (values.length < 2) return 'non_existence';

  const sorted = [...values].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const recent = sorted.slice(-Math.min(sorted.length, 5));
  
  let consecutiveUp = 0;
  let consecutiveDown = 0;
  
  for (let i = recent.length - 1; i > 0; i--) {
    const diff = recent[i].value - recent[i - 1].value;
    if (diff > 0) {
      if (consecutiveDown > 0) break;
      consecutiveUp++;
    } else if (diff < 0) {
      if (consecutiveUp > 0) break;
      consecutiveDown++;
    } else {
      break;
    }
  }

  const effectiveUp = inverted ? consecutiveDown : consecutiveUp;
  const effectiveDown = inverted ? consecutiveUp : consecutiveDown;

  const firstVal = recent[0].value;
  const lastVal = recent[recent.length - 1].value;
  const overallChange = firstVal !== 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
  const effectiveChange = inverted ? -overallChange : overallChange;

  if (effectiveDown >= 3 || effectiveChange < -30) return 'danger';
  if (effectiveDown >= 2 || effectiveChange < -15) return 'emergency';
  if (effectiveUp >= 4 && effectiveChange > 30) return 'power';
  if (effectiveUp >= 3 || effectiveChange > 20) return 'affluence';
  if (effectiveUp >= 1 && effectiveChange >= 0) return 'normal';
  if (lastVal === 0 && firstVal === 0) return 'non_existence';
  
  return 'normal';
}

export function getConditionInfo(condition: StatCondition) {
  return CONDITIONS.find(c => c.id === condition) ?? CONDITIONS[3];
}

/**
 * Calculate linear regression trend line data points.
 * Returns array of {date, trend} values for overlay on chart.
 */
export function calculateTrendLine(values: { date: string; value: number }[]): { date: string; trend: number }[] {
  if (values.length < 2) return [];
  
  const sorted = [...values].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const n = sorted.length;
  
  // x = index (0, 1, 2...), y = value
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += sorted[i].value;
    sumXY += i * sorted[i].value;
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return sorted.map((v, i) => ({
    date: v.date,
    trend: Math.round((intercept + slope * i) * 100) / 100,
  }));
}

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
