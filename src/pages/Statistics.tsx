import { useState } from 'react';
import { TrendingUp, ArrowUp, ArrowDown, Minus, Plus } from 'lucide-react';
import { useStatisticDefinitions, useStatisticValues } from '@/hooks/useStatistics';
import { useDepartments } from '@/hooks/useDepartments';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatisticsPageProps {
  selectedDeptId: string | null;
}

export function StatisticsPage({ selectedDeptId }: StatisticsPageProps) {
  const { data: departments } = useDepartments();
  const dept = selectedDeptId ? departments?.find(d => d.id === selectedDeptId) : null;

  const ownerType = dept ? 'department' : 'company';
  const ownerId = dept?.id ?? undefined;

  const { data: definitions, isLoading } = useStatisticDefinitions(ownerType, ownerId);
  const [selectedStatId, setSelectedStatId] = useState<string | null>(null);
  const { data: values } = useStatisticValues(selectedStatId);

  const chartData = (values ?? []).map(v => ({
    date: new Date(v.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    value: Number(v.value),
    value2: v.value2 != null ? Number(v.value2) : undefined,
  }));

  // Calculate trend for selected stat
  const lastTwo = (values ?? []).slice(-2);
  const trend = lastTwo.length === 2
    ? Number(lastTwo[1].value) > Number(lastTwo[0].value) ? 'up'
    : Number(lastTwo[1].value) < Number(lastTwo[0].value) ? 'down' : 'same'
    : 'same';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
          {dept ? `Статистики — ${dept.name}` : 'Дашборд статистик ОС'}
        </h1>
        <p className="text-sm text-muted-foreground font-body">
          {dept ? dept.full_name : 'Сводка по всем отделениям организации'}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Загрузка статистик...</div>
      ) : !definitions?.length ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <TrendingUp size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm mb-2">Нет определённых статистик</p>
          <p className="text-xs text-muted-foreground/60 font-body">Создайте статистику для отслеживания показателей</p>
        </div>
      ) : (
        <>
          {/* Stat definitions as cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {definitions.map(def => {
              const isSelected = selectedStatId === def.id;
              const lastVal = values && selectedStatId === def.id && values.length > 0
                ? values[values.length - 1] : null;
              return (
                <button
                  key={def.id}
                  onClick={() => setSelectedStatId(isSelected ? null : def.id)}
                  className={`bg-card border rounded-xl p-5 text-left transition-all ${
                    isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/20'
                  }`}
                >
                  <p className="text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-2 truncate">{def.title}</p>
                  {lastVal ? (
                    <p className="text-2xl font-display font-bold text-foreground mb-1">{Number(lastVal.value).toLocaleString('ru-RU')}</p>
                  ) : (
                    <p className="text-2xl font-display font-bold text-muted-foreground/30 mb-1">—</p>
                  )}
                  {def.is_favorite && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-display font-medium">★ Избранная</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chart */}
          {selectedStatId && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">
                  {definitions.find(d => d.id === selectedStatId)?.title}
                </h3>
                <div className={`flex items-center gap-1 text-sm font-display font-semibold ${
                  trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {trend === 'up' && <ArrowUp size={14} />}
                  {trend === 'down' && <ArrowDown size={14} />}
                  {trend === 'same' && <Minus size={14} />}
                  <span className="text-xs">{trend === 'up' ? 'Рост' : trend === 'down' ? 'Спад' : 'Стабильно'}</span>
                </div>
              </div>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm font-body">
                  Нет данных для графика
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
