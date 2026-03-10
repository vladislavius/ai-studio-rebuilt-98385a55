import { useState, useMemo, useRef } from 'react';
import { TrendingUp, LayoutDashboard, List, Layers, ChevronUp, ChevronDown, Award, Download, Upload, Edit2 } from 'lucide-react';
import { useStatisticDefinitions, useStatisticValues, useCreateStatValue } from '@/hooks/useStatistics';
import { useDepartments, DBDepartment } from '@/hooks/useDepartments';
import { StatCard } from '@/components/statistics/StatCard';
import { PERIODS, PeriodType, getFilteredValues, analyzeTrend, generateMockHistory } from '@/utils/statistics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface StatisticsPageProps {
  selectedDeptId: string | null;
}

// Department order matching original: 7, 1, 2, 3, 4, 5, 6
const DEPT_SORT_ORDER = ['7', '1', '2', '3', '4', '5', '6'];

function sortDepartments(departments: DBDepartment[]): DBDepartment[] {
  const topLevel = departments.filter(d => !d.parent_id);
  return topLevel.sort((a, b) => {
    const aIdx = DEPT_SORT_ORDER.indexOf(a.code.replace(/\D/g, '').charAt(0));
    const bIdx = DEPT_SORT_ORDER.indexOf(b.code.replace(/\D/g, '').charAt(0));
    const ai = aIdx === -1 ? 999 : aIdx;
    const bi = bIdx === -1 ? 999 : bIdx;
    if (ai !== bi) return ai - bi;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

export function StatisticsPage({ selectedDeptId }: StatisticsPageProps) {
  const { data: allDefinitions, isLoading } = useStatisticDefinitions();
  const { data: departments } = useDepartments();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('3w');
  const [displayMode, setDisplayMode] = useState<'dashboard' | 'list'>('dashboard');
  const [trendFilter, setTrendFilter] = useState<'all' | 'growing' | 'declining' | 'achieved' | 'not_achieved'>('all');
  const [expandedStatId, setExpandedStatId] = useState<string | null>(null);
  const { data: expandedValues } = useStatisticValues(expandedStatId);

  const definitions = allDefinitions ?? [];

  // Build mock values cache (stable per session)
  const mockValues = useMemo(() => {
    const cache: Record<string, { date: string; value: number }[]> = {};
    definitions.forEach(def => {
      let base = 100;
      const t = (def.title ?? '').toLowerCase();
      if (t.includes('выручк') || t.includes('доход') || t.includes('продаж') || t.includes('оборот') || t.includes('стоимост') || t.includes('сумм')) base = 1500000;
      else if (t.includes('прибыл') || t.includes('маржин') || t.includes('задолженност')) base = 500000;
      cache[def.id] = generateMockHistory(base, 52);
    });
    return cache;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitions.length]);

  // Get values for a stat (will use mock if no real data exists)
  const getStatValues = (statId: string): { date: string; value: number }[] => {
    return mockValues[statId] ?? generateMockHistory(100);
  };

  // Sorted top-level departments
  const sortedDepts = useMemo(() => {
    if (!departments) return [];
    return sortDepartments(departments);
  }, [departments]);

  // Get subdepartments for a given parent
  const getSubDepts = (parentId: string) => {
    return (departments ?? [])
      .filter(d => d.parent_id === parentId)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  };

  // Get current department and its subdepts IDs
  const selectedDept = selectedDeptId ? departments?.find(d => d.id === selectedDeptId) : null;
  const subDepts = selectedDeptId ? getSubDepts(selectedDeptId) : [];
  const allSelectedIds = selectedDeptId ? [selectedDeptId, ...subDepts.map(s => s.id)] : [];

  // Count stats by trend
  const stats = useMemo(() => {
    const relevantDefs = selectedDeptId
      ? definitions.filter(d => allSelectedIds.includes(d.owner_id ?? ''))
      : definitions;

    let growing = 0, declining = 0, achieved = 0, notAchieved = 0;

    relevantDefs.forEach(def => {
      const vals = getStatValues(def.id);
      const sorted = [...vals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const filtered = getFilteredValues(sorted, selectedPeriod);
      const { direction, isGood } = analyzeTrend(filtered, def.inverted ?? false);
      if (direction === 'up') growing++;
      if (direction === 'down') declining++;
      // Plan simplified: achieved = isGood, notAchieved = !isGood
      if (isGood) achieved++;
      else notAchieved++;
    });

    return { total: relevantDefs.length, growing, declining, achieved, notAchieved };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitions, selectedDeptId, selectedPeriod, mockValues]);

  // Filter buttons data
  const filterButtons = [
    { id: 'all' as const, label: 'Все', count: stats.total, color: 'bg-primary text-primary-foreground' },
    { id: 'growing' as const, label: 'Растущие', count: stats.growing, color: 'text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' },
    { id: 'declining' as const, label: 'Падающие', count: stats.declining, color: 'text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
    { id: 'achieved' as const, label: 'Достиг план', count: stats.achieved, color: 'text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' },
    { id: 'not_achieved' as const, label: 'Не достиг', count: stats.notAchieved, color: 'text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
  ];

  // Should render a stat card based on current filter
  const shouldRenderStat = (def: typeof definitions[0]) => {
    if (trendFilter === 'all') return true;
    const vals = getStatValues(def.id);
    const sorted = [...vals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const filtered = getFilteredValues(sorted, selectedPeriod);
    const { direction, isGood } = analyzeTrend(filtered, def.inverted ?? false);
    if (trendFilter === 'growing') return direction === 'up';
    if (trendFilter === 'declining') return direction === 'down';
    if (trendFilter === 'achieved') return isGood;
    if (trendFilter === 'not_achieved') return !isGood;
    return true;
  };

  // Expanded stat chart data
  const expandedChartData = useMemo(() => {
    if (!expandedStatId) return [];
    // Use real values if available, otherwise mock
    const vals = expandedValues?.length
      ? expandedValues.map(v => ({ date: v.date, value: Number(v.value) }))
      : getStatValues(expandedStatId);
    const sorted = [...vals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const filtered = getFilteredValues(sorted, selectedPeriod);
    return filtered.map(v => ({
      date: new Date(v.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      value: v.value,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedStatId, expandedValues, selectedPeriod]);

  const expandedDef = expandedStatId ? definitions.find(d => d.id === expandedStatId) : null;

  // =================== RENDER ===================

  const renderDashboardOS = () => (
    <div className="space-y-8 lg:space-y-12 animate-in fade-in pb-20">
      {sortedDepts.map(dept => {
        const subIds = getSubDepts(dept.id).map(s => s.id);
        const allIds = [dept.id, ...subIds];
        const favStats = definitions.filter(d => allIds.includes(d.owner_id ?? '') && d.is_favorite);
        const visibleStats = favStats.filter(shouldRenderStat);
        if (visibleStats.length === 0) return null;

        return (
          <div key={dept.id} className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-display font-bold text-[10px] shadow-md flex-shrink-0"
                  style={{ backgroundColor: dept.color ?? 'hsl(var(--primary))' }}
                >
                  {dept.code.replace(/\D/g, '').charAt(0) || dept.name.charAt(0)}
                </div>
                <h2 className="text-xs font-display font-bold text-foreground uppercase tracking-tight">
                  {dept.name}
                </h2>
              </div>
              <span className="text-[9px] text-muted-foreground font-display font-bold uppercase">
                ГЛАВНЫЕ ПОКАЗАТЕЛИ (ГСД)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {visibleStats.map(stat => (
                <StatCard
                  key={stat.id}
                  title={stat.title}
                  description={stat.description}
                  values={getStatValues(stat.id)}
                  period={selectedPeriod}
                  inverted={stat.inverted ?? false}
                  isFavorite={stat.is_favorite ?? false}
                  accentColor={dept.color ?? 'hsl(var(--primary))'}
                  onClick={() => setExpandedStatId(stat.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDepartmentView = () => {
    if (!selectedDept) return null;
    const deptMainStats = definitions.filter(d => d.owner_id === selectedDeptId).filter(shouldRenderStat);

    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in pb-20">
        {/* Department header */}
        <div className="bg-card p-4 md:p-6 rounded-xl border border-border space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm shadow-lg flex-shrink-0"
              style={{ backgroundColor: selectedDept.color ?? 'hsl(var(--primary))' }}
            >
              {selectedDept.code.replace(/\D/g, '').charAt(0) || selectedDept.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs md:text-sm font-display font-bold text-foreground uppercase tracking-tight leading-tight">
                {selectedDept.full_name || selectedDept.name}
              </h1>
              <p className="text-[9px] md:text-[10px] text-muted-foreground font-display font-semibold mt-0.5 uppercase">
                РУКОВОДИТЕЛЬ: {selectedDept.manager_name || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Department main stats */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 bg-muted rounded-lg text-muted-foreground">
              <Layers size={12} />
            </div>
            <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
              Общие статистики департамента
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {deptMainStats.map(stat => (
              <StatCard
                key={stat.id}
                title={stat.title}
                description={stat.description}
                values={getStatValues(stat.id)}
                period={selectedPeriod}
                inverted={stat.inverted ?? false}
                isFavorite={stat.is_favorite ?? false}
                accentColor={selectedDept.color ?? 'hsl(var(--primary))'}
                onClick={() => setExpandedStatId(stat.id)}
              />
            ))}
          </div>
        </div>

        {/* Subdepartments */}
        {subDepts.map(sub => {
          const subStats = definitions.filter(d => d.owner_id === sub.id).filter(shouldRenderStat);
          if (subStats.length === 0) return null;

          return (
            <div key={sub.id} className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 px-1">
                <div className="bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-lg text-amber-700 dark:text-amber-400 text-[9px] font-display font-bold border border-amber-200 dark:border-amber-800 uppercase">
                  DIV {sub.code}
                </div>
                <span className="text-[10px] font-display font-bold text-foreground uppercase tracking-tight">
                  {sub.name}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {subStats.map(stat => (
                  <StatCard
                    key={stat.id}
                    title={stat.title}
                    description={stat.description}
                    values={getStatValues(stat.id)}
                    period={selectedPeriod}
                    inverted={stat.inverted ?? false}
                    isFavorite={stat.is_favorite ?? false}
                    accentColor={selectedDept.color ?? 'hsl(var(--primary))'}
                    onClick={() => setExpandedStatId(stat.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col animate-in fade-in space-y-4">
      {/* Toolbar */}
      <div className="bg-card p-3 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2">
          {/* Display mode toggle */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg w-full md:w-auto">
            <button
              onClick={() => setDisplayMode('dashboard')}
              className={`flex-1 md:flex-none px-3 py-2 rounded-md text-xs font-display font-bold transition-colors flex items-center justify-center gap-1.5 ${
                displayMode === 'dashboard' ? 'bg-card shadow text-primary' : 'text-muted-foreground'
              }`}
            >
              <LayoutDashboard size={14} />
              Дашборд ОС
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={`flex-1 md:flex-none px-3 py-2 rounded-md text-xs font-display font-bold transition-colors flex items-center justify-center gap-1.5 ${
                displayMode === 'list' ? 'bg-card shadow text-primary' : 'text-muted-foreground'
              }`}
            >
              <List size={14} />
              Список
            </button>
          </div>

          {/* Action buttons placeholder */}
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Скачать CSV">
              <Download size={16} />
            </button>
            <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Импорт">
              <Upload size={16} />
            </button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(fb => (
            <button
              key={fb.id}
              onClick={() => setTrendFilter(fb.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-display font-bold transition-colors flex items-center gap-1.5 ${
                trendFilter === fb.id ? fb.color : 'text-muted-foreground border border-border hover:bg-accent'
              }`}
            >
              {fb.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${trendFilter === fb.id ? 'bg-white/20' : 'bg-muted'}`}>
                {fb.count}
              </span>
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex gap-1 flex-wrap">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-colors ${
                selectedPeriod === p.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Department header when selected */}
      {selectedDept && (
        <div className="bg-card p-3 rounded-xl border border-border flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold text-xs shadow-lg flex-shrink-0"
            style={{ backgroundColor: selectedDept.color ?? 'hsl(var(--primary))' }}
          >
            {selectedDept.code.replace(/\D/g, '').charAt(0) || selectedDept.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-[11px] md:text-xs font-display font-bold text-foreground uppercase tracking-tight">
              {selectedDept.full_name || selectedDept.name}
            </h1>
            <p className="text-[9px] text-muted-foreground font-display font-semibold uppercase">
              РУКОВОДИТЕЛЬ: {selectedDept.manager_name || '—'}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Загрузка статистик...</div>
      ) : definitions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <TrendingUp size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm mb-2">Нет определённых статистик</p>
          <p className="text-xs text-muted-foreground/60 font-body">Создайте статистику для отслеживания показателей</p>
        </div>
      ) : displayMode === 'dashboard' ? (
        selectedDeptId ? renderDepartmentView() : renderDashboardOS()
      ) : (
        <RenderListView definitions={definitions} onExpand={setExpandedStatId} />
      )}

      {/* Expanded stat modal */}
      {expandedStatId && expandedDef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4" onClick={() => setExpandedStatId(null)}>
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground text-lg">{expandedDef.title}</h3>
              <button onClick={() => setExpandedStatId(null)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent">✕</button>
            </div>
            {expandedDef.description && (
              <p className="text-sm text-muted-foreground mb-4 font-body">{expandedDef.description}</p>
            )}
            {expandedChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={expandedChartData}>
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
              <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm font-body">
                Нет данных для графика
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RenderListView({ definitions, onExpand }: { definitions: any[]; onExpand: (id: string) => void }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground font-display font-bold uppercase border-b border-border">
          <tr>
            <th className="px-4 py-3 text-xs">Название</th>
            <th className="px-4 py-3 text-xs">Тип</th>
            <th className="px-4 py-3 text-xs">ГСД</th>
            <th className="px-4 py-3 text-xs text-right">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {definitions.map(stat => (
            <tr key={stat.id} className="hover:bg-accent/50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-display font-semibold text-foreground text-sm">{stat.title}</div>
                {stat.description && <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{stat.description}</div>}
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-display font-bold uppercase">{stat.owner_type}</span>
              </td>
              <td className="px-4 py-3">
                {stat.is_favorite && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-display font-bold">ГСД</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onExpand(stat.id)} className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors">
                  <TrendingUp size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
