import { useState, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, LayoutDashboard, List, Layers, Download, Upload, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useStatisticDefinitions, useAllStatisticValues, useStatisticValues, useCreateStatValue, useDeleteStatValue } from '@/hooks/useStatistics';
import { useDepartments, DBDepartment } from '@/hooks/useDepartments';
import { StatCard } from '@/components/statistics/StatCard';
import { PERIODS, PeriodType, getFilteredValues, analyzeTrend, calculateCondition, getConditionInfo, CONDITIONS, calculateTrendLine } from '@/utils/statistics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface StatisticsPageProps {
  selectedDeptId: string | null;
}

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
  const { data: allValuesMap } = useAllStatisticValues();
  const { data: departments } = useDepartments();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('3w');
  const [displayMode, setDisplayMode] = useState<'dashboard' | 'list'>('dashboard');
  const [trendFilter, setTrendFilter] = useState<'all' | 'growing' | 'declining' | 'achieved' | 'not_achieved'>('all');
  const [expandedStatId, setExpandedStatId] = useState<string | null>(null);
  const { data: expandedValues } = useStatisticValues(expandedStatId);
  const createStatValue = useCreateStatValue();
  const deleteStatValue = useDeleteStatValue();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editDate, setEditDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editValue, setEditValue] = useState('');
  const [editValue2, setEditValue2] = useState('');

  const definitions = allDefinitions ?? [];
  const valuesMap = allValuesMap ?? {};

  const getStatValues = (statId: string): { date: string; value: number }[] => {
    return valuesMap[statId] ?? [];
  };

  const sortedDepts = useMemo(() => {
    if (!departments) return [];
    return sortDepartments(departments);
  }, [departments]);

  const getSubDepts = (parentId: string) => {
    return (departments ?? [])
      .filter(d => d.parent_id === parentId)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  };

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
      if (isGood) achieved++;
      else notAchieved++;
    });

    return { total: relevantDefs.length, growing, declining, achieved, notAchieved };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitions, selectedDeptId, selectedPeriod, valuesMap]);

  const filterButtons = [
    { id: 'all' as const, label: 'Все', count: stats.total, color: 'bg-primary text-primary-foreground' },
    { id: 'growing' as const, label: 'Растущие', count: stats.growing, color: 'text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' },
    { id: 'declining' as const, label: 'Падающие', count: stats.declining, color: 'text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
    { id: 'achieved' as const, label: 'Достиг план', count: stats.achieved, color: 'text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' },
    { id: 'not_achieved' as const, label: 'Не достиг', count: stats.notAchieved, color: 'text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
  ];

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

  // Expanded stat data
  const expandedDef = expandedStatId ? definitions.find(d => d.id === expandedStatId) : null;
  const expandedOwnerDept = expandedDef ? departments?.find(d => d.id === expandedDef.owner_id) : null;

  const expandedChartData = useMemo(() => {
    if (!expandedStatId || !expandedValues?.length) return [];
    const sorted = [...expandedValues].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const filtered = getFilteredValues(sorted.map(v => ({ date: v.date, value: Number(v.value), value2: v.value2 != null ? Number(v.value2) : null })), selectedPeriod);
    return filtered.map(v => ({
      date: new Date(v.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      rawDate: v.date,
      fact: v.value,
      plan: (v as any).value2 ?? null,
    }));
  }, [expandedStatId, expandedValues, selectedPeriod]);

  const expandedTrend = useMemo(() => {
    if (!expandedValues?.length) return { current: 0, percent: 0, direction: 'flat' as const, isGood: true };
    const sorted = [...expandedValues]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(v => ({ date: v.date, value: Number(v.value) }));
    const filtered = getFilteredValues(sorted, selectedPeriod);
    return analyzeTrend(filtered, expandedDef?.inverted ?? false);
  }, [expandedValues, selectedPeriod, expandedDef]);

  const expandedCondition = useMemo(() => {
    if (!expandedValues?.length) return 'non_existence' as const;
    const sorted = [...expandedValues]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(v => ({ date: v.date, value: Number(v.value) }));
    const filtered = getFilteredValues(sorted, selectedPeriod);
    return calculateCondition(filtered, expandedDef?.inverted ?? false);
  }, [expandedValues, selectedPeriod, expandedDef]);

  // CSV Export
  const handleExportCSV = () => {
    const relevantDefs = selectedDeptId
      ? definitions.filter(d => allSelectedIds.includes(d.owner_id ?? ''))
      : definitions;
    if (!relevantDefs.length) { toast.error('Нет данных для экспорта'); return; }

    const rows: string[] = ['Название;Тип;Владелец;Дата;Значение;План'];
    relevantDefs.forEach(def => {
      const vals = getStatValues(def.id);
      const sorted = [...vals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const filtered = getFilteredValues(sorted, selectedPeriod);
      const ownerDept = departments?.find(d => d.id === def.owner_id);
      filtered.forEach(v => {
        rows.push(`"${def.title}";"${def.owner_type}";"${ownerDept?.name ?? ''}";"${v.date}";${v.value};${(v as any).value2 ?? ''}`);
      });
    });

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV экспортирован');
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('Файл пуст'); return; }
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 5) continue;
        const [title, , , date, valueStr] = cols;
        const value = parseFloat(valueStr);
        if (isNaN(value) || !date) continue;
        const def = definitions.find(d => d.title === title);
        if (!def) continue;
        createStatValue.mutate({ definition_id: def.id, date, value });
        imported++;
      }
      toast.success(`Импортировано ${imported} значений`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add value form submit
  const handleAddValue = () => {
    if (!expandedStatId || !editValue) return;
    createStatValue.mutate({
      definition_id: expandedStatId,
      date: editDate,
      value: parseFloat(editValue),
      value2: editValue2 ? parseFloat(editValue2) : undefined,
    });
    setEditValue('');
    setEditValue2('');
    setShowEditForm(false);
  };

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
                  {dept.full_name || dept.name}
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
                  DIV {sub.code.replace('div', '')}
                </div>
                <span className="text-[10px] font-display font-bold text-foreground uppercase tracking-tight">
                  {sub.full_name || sub.name}
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

  const conditionInfo = getConditionInfo(expandedCondition);

  return (
    <div className="flex flex-col animate-in fade-in space-y-4">
      {/* Toolbar */}
      <div className="bg-card p-3 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2">
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

          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Скачать CSV">
              <Download size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Импорт CSV">
              <Upload size={16} />
            </button>
            <button onClick={() => setExpandedStatId(definitions[0]?.id ?? null)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Редактировать">
              <Edit2 size={16} />
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
        </div>
      ) : displayMode === 'dashboard' ? (
        selectedDeptId ? renderDepartmentView() : renderDashboardOS()
      ) : (
        <RenderListView definitions={definitions} valuesMap={valuesMap} selectedPeriod={selectedPeriod} onExpand={setExpandedStatId} />
      )}

      {/* ========== Expanded Stat Modal ========== */}
      {expandedStatId && expandedDef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4" onClick={() => { setExpandedStatId(null); setShowEditForm(false); }}>
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-foreground text-base uppercase">{expandedDef.title}</h3>
                  <p className="text-xs text-muted-foreground font-display mt-0.5">
                    {expandedOwnerDept?.full_name || expandedOwnerDept?.name || ''}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {expandedDef.inverted && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded font-bold">ОБРАТНАЯ</span>
                    )}
                    {expandedDef.is_double && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded font-bold">ДВОЙНАЯ</span>
                    )}
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${conditionInfo.bgColor} ${conditionInfo.color}`}>
                      {conditionInfo.label.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setExpandedStatId(null); setShowEditForm(false); }} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Current value + trend + condition */}
            <div className="p-5 grid grid-cols-3 gap-4">
              <div className="bg-muted rounded-xl p-4">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-1">Текущее значение</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {expandedTrend.current.toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-1">Динамика периода</p>
                <div className="flex items-center gap-2">
                  {expandedTrend.direction === 'down' ? <TrendingDown size={20} className="text-rose-500" /> : <TrendingUp size={20} className="text-emerald-500" />}
                  <p className={`text-2xl font-display font-bold ${expandedTrend.isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {Math.abs(expandedTrend.percent).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className={`rounded-xl p-4 ${conditionInfo.bgColor}`}>
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-1">Состояние</p>
                <p className={`text-lg font-display font-bold ${conditionInfo.color}`}>
                  {conditionInfo.label}
                </p>
              </div>
            </div>

            {/* Condition scale */}
            <div className="px-5 pb-4">
              <div className="flex gap-1">
                {CONDITIONS.map(c => (
                  <div
                    key={c.id}
                    className={`flex-1 py-1.5 rounded text-center text-[7px] font-display font-bold uppercase transition-all ${
                      expandedCondition === c.id
                        ? `${c.bgColor} ${c.color} ring-2 ring-offset-1 ring-current`
                        : 'bg-muted text-muted-foreground/40'
                    }`}
                  >
                    {c.label.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>

            {/* Chart: Факт + План - LINEAR lines */}
            <div className="px-5 pb-4">
              <div className="bg-muted rounded-xl p-4">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">ГРАФИК ПЛАН/ФАКТ</p>
                {expandedChartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={expandedChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: number, name: string) => [val.toLocaleString('ru-RU'), name === 'fact' ? 'Факт' : 'План']}
                      />
                      <Legend formatter={(val) => val === 'fact' ? 'Факт' : 'План'} />
                      <Line type="linear" dataKey="fact" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="fact" />
                      {expandedChartData.some(d => d.plan != null) && (
                        <Line type="linear" dataKey="plan" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="5 5" dot={{ fill: '#f43f5e', r: 3, strokeWidth: 0 }} name="plan" />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Нет данных для графика</div>
                )}
              </div>
            </div>

            {/* Plan vs Fact summary */}
            {expandedChartData.length > 0 && (
              <div className="px-5 pb-4">
                <div className="bg-muted rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-display font-bold text-muted-foreground uppercase mb-1">ПЛАН И ФАКТ</p>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-[9px] text-muted-foreground font-display">План</p>
                        <p className="text-lg font-display font-bold text-foreground">
                          {expandedChartData[expandedChartData.length - 1]?.plan?.toLocaleString('ru-RU') ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-display">Факт</p>
                        <p className="text-lg font-display font-bold text-foreground">
                          {expandedChartData[expandedChartData.length - 1]?.fact?.toLocaleString('ru-RU') ?? '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-display font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                  >
                    <Edit2 size={14} />
                    Редактировать
                  </button>
                </div>
              </div>
            )}

            {/* Edit form */}
            {showEditForm && (
              <div className="px-5 pb-4">
                <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-display font-bold text-foreground uppercase">Добавить значение</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Дата</label>
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Факт</label>
                      <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} placeholder="0"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">План</label>
                      <input type="number" value={editValue2} onChange={e => setEditValue2(e.target.value)} placeholder="0"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddValue} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                      <Plus size={14} />
                      Добавить
                    </button>
                    <button onClick={() => setShowEditForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent transition-colors">
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Values table */}
            {expandedValues && expandedValues.length > 0 && (
              <div className="px-5 pb-5">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-2">ИСТОРИЯ ЗНАЧЕНИЙ</p>
                <div className="bg-muted rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-accent/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-display font-bold text-muted-foreground">Дата</th>
                        <th className="px-3 py-2 text-right font-display font-bold text-muted-foreground">Факт</th>
                        <th className="px-3 py-2 text-right font-display font-bold text-muted-foreground">План</th>
                        <th className="px-3 py-2 text-right font-display font-bold text-muted-foreground w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {[...expandedValues].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(v => (
                        <tr key={v.id} className="hover:bg-accent/30">
                          <td className="px-3 py-1.5 font-display text-foreground">{new Date(v.date).toLocaleDateString('ru-RU')}</td>
                          <td className="px-3 py-1.5 text-right font-display font-bold text-foreground">{Number(v.value).toLocaleString('ru-RU')}</td>
                          <td className="px-3 py-1.5 text-right font-display text-muted-foreground">{v.value2 != null ? Number(v.value2).toLocaleString('ru-RU') : '—'}</td>
                          <td className="px-3 py-1.5 text-right">
                            <button onClick={() => deleteStatValue.mutate({ id: v.id, definitionId: v.definition_id })} className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Big edit button */}
            <div className="p-5 border-t border-border">
              <button
                onClick={() => setShowEditForm(true)}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-display font-bold hover:bg-primary/90 transition-colors uppercase tracking-wider"
              >
                РЕДАКТИРОВАТЬ ДАННЫЕ (ВВОД)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RenderListView({ definitions, valuesMap, selectedPeriod, onExpand }: { definitions: any[]; valuesMap: Record<string, any[]>; selectedPeriod: PeriodType; onExpand: (id: string) => void }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground font-display font-bold uppercase border-b border-border">
          <tr>
            <th className="px-4 py-3 text-xs">Название</th>
            <th className="px-4 py-3 text-xs">Тип</th>
            <th className="px-4 py-3 text-xs">ГСД</th>
            <th className="px-4 py-3 text-xs">Состояние</th>
            <th className="px-4 py-3 text-xs text-right">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {definitions.map(stat => {
            const vals = valuesMap[stat.id] ?? [];
            const sorted = [...vals].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const filtered = getFilteredValues(sorted, selectedPeriod);
            const condition = calculateCondition(filtered, stat.inverted);
            const ci = getConditionInfo(condition);

            return (
              <tr key={stat.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => onExpand(stat.id)}>
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
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-display font-bold ${ci.bgColor} ${ci.color}`}>
                    {ci.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); onExpand(stat.id); }} className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors">
                    <TrendingUp size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
