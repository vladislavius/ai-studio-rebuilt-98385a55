import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { analyzeTrend, getFilteredValues, PeriodType } from '@/utils/statistics';

interface StatCardProps {
  title: string;
  description?: string | null;
  values: { date: string; value: number }[];
  period: PeriodType;
  inverted?: boolean;
  isFavorite?: boolean;
  accentColor?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  description,
  values,
  period,
  inverted,
  isFavorite,
  accentColor = 'hsl(var(--primary))',
  onClick,
}: StatCardProps) {
  const filtered = useMemo(() => {
    const sorted = [...values].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return getFilteredValues(sorted, period);
  }, [values, period]);

  const { current, percent, direction, isGood } = useMemo(
    () => analyzeTrend(filtered, inverted),
    [filtered, inverted]
  );

  const chartData = useMemo(() => filtered.map(v => ({ v: v.value })), [filtered]);

  const lineColor = isGood ? '#10b981' : '#f43f5e';

  return (
    <div
      onClick={onClick}
      className="relative bg-card rounded-xl border border-border overflow-hidden flex flex-col h-[180px] md:h-[210px] lg:h-[240px] transition-colors group cursor-pointer hover:border-primary/30 hover:shadow-sm"
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: accentColor }} />

      <div className="p-3 md:p-4 flex flex-col h-full relative z-10">
        {/* Title */}
        <div className="flex justify-between items-start mb-1">
          <div className="flex-1 pr-4">
            <h3 className="text-[9px] md:text-[10px] font-display font-bold text-foreground uppercase leading-tight mb-0.5 line-clamp-2">
              {title}
            </h3>
            <p className="text-[8px] md:text-[9px] text-muted-foreground font-body line-clamp-2 min-h-[20px] leading-snug">
              {description || 'Ключевой показатель эффективности подразделения.'}
            </p>
          </div>
          {inverted && (
            <span className="text-[7px] md:text-[8px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1 rounded font-bold flex-shrink-0">
              ОБР
            </span>
          )}
        </div>

        {/* Value + Trend */}
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-base md:text-xl lg:text-2xl font-display font-bold text-foreground">
            {current.toLocaleString('ru-RU')}
          </span>
          {filtered.length > 1 && (
            <div className={`flex items-center gap-0.5 text-[9px] md:text-[10px] font-display font-bold ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {direction === 'up' && <TrendingUp size={10} />}
              {direction === 'down' && <TrendingDown size={10} />}
              {Math.abs(percent).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Mini Chart */}
        <div className="flex-1 w-full min-h-0">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <YAxis hide domain={['auto', 'auto']} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={lineColor}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[9px] text-muted-foreground/40 font-body">
              Нет данных
            </div>
          )}
        </div>

        {/* ГСД badge */}
        {isFavorite && (
          <div className="absolute bottom-2 right-2 text-[8px] font-display font-bold text-primary/60 uppercase tracking-widest">
            ГСД
          </div>
        )}
      </div>
    </div>
  );
}
