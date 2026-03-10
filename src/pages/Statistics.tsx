import { useState, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, LayoutDashboard, List, Layers, Download, Upload, Edit2, Trash2, Plus, X, Settings, Save, Info, ChevronDown } from 'lucide-react';
import { useStatisticDefinitions, useAllStatisticValues, useStatisticValues, useCreateStatValue, useDeleteStatValue, useUpdateStatValue } from '@/hooks/useStatistics';
import { useUpdateStatDefinition, useDeleteStatDefinition } from '@/hooks/useOrgChartMutations';
import { useDepartments, DBDepartment } from '@/hooks/useDepartments';
import { useEmployees } from '@/hooks/useEmployees';
import { useLabels } from '@/hooks/useLabels';
import { StatCard } from '@/components/statistics/StatCard';
import { PERIODS, PeriodType, getFilteredValues, analyzeTrend, calculateCondition, getConditionInfo, CONDITIONS, calculateTrendLine, StatCondition } from '@/utils/statistics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
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
  const { t } = useLabels();
  const { data: allDefinitions, isLoading } = useStatisticDefinitions();
  const { data: allValuesMap } = useAllStatisticValues();
  const { data: departments } = useDepartments();
  const { data: employees } = useEmployees();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('3w');
  const [displayMode, setDisplayMode] = useState<'dashboard' | 'list'>('dashboard');
  const [trendFilter, setTrendFilter] = useState<'all' | 'growing' | 'declining' | 'achieved' | 'not_achieved'>('all');
  const [expandedStatId, setExpandedStatId] = useState<string | null>(null);
  const { data: expandedValues } = useStatisticValues(expandedStatId);
  const createStatValue = useCreateStatValue();
  const deleteStatValue = useDeleteStatValue();
  const updateStatValue = useUpdateStatValue();
  const updateStatDef = useUpdateStatDefinition();
  const deleteStatDef = useDeleteStatDefinition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Modal tabs
  const [modalTab, setModalTab] = useState<'view' | 'program'>('view');

  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editDate, setEditDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editValue, setEditValue] = useState('');
  const [editValue2, setEditValue2] = useState('');

  // Inline edit for plan/fact
  const [editingPlanFact, setEditingPlanFact] = useState(false);
  const [planInput, setPlanInput] = useState('');
  const [factInput, setFactInput] = useState('');

  // Manual condition override
  const [manualCondition, setManualCondition] = useState<StatCondition | null>(null);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);

  // Definition editing
  const [showDefEdit, setShowDefEdit] = useState(false);
  const [defEditForm, setDefEditForm] = useState({ title: '', description: '', calculation_method: '', purpose: '', is_double: false, inverted: false, is_favorite: false });

  // Battle plan (program) state
  const [programForm, setProgramForm] = useState({
    name: '',
    deadline: '1 неделя',
    links: [''],
    purpose: '',
    mainTask: '',
    tasks: [{ text: '', responsible: '', deadline: '', subtasks: [''] }] as { text: string; responsible: string; deadline: string; subtasks: string[] }[],
  });

  // Inline value editing
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editingValueVal, setEditingValueVal] = useState('');

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
    { id: 'all' as const, label: t('stats.all'), count: stats.total, color: 'bg-primary text-primary-foreground' },
    { id: 'growing' as const, label: t('stats.growing'), count: stats.growing, color: 'text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' },
    { id: 'declining' as const, label: t('stats.declining'), count: stats.declining, color: 'text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
    { id: 'achieved' as const, label: t('stats.achieved'), count: stats.achieved, color: 'text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' },
    { id: 'not_achieved' as const, label: t('stats.not_achieved'), count: stats.notAchieved, color: 'text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
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
    const mapped = sorted.map(v => ({ date: v.date, value: Number(v.value), value2: v.value2 != null ? Number(v.value2) : null }));
    const filtered = getFilteredValues(mapped, selectedPeriod);
    const trendData = calculateTrendLine(filtered);
    return filtered.map((v, i) => ({
      date: new Date(v.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      rawDate: v.date,
      fact: v.value,
      plan: (v as any).value2 ?? null,
      trend: trendData[i]?.trend ?? v.value,
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

  const activeCondition = manualCondition ?? expandedCondition;
  const conditionInfo = getConditionInfo(activeCondition);

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

  const handleAddValue = () => {
    if (!expandedStatId || !editValue) return;
    createStatValue.mutate({
      definition_id: expandedStatId,
      date: editDate,
      value: parseFloat(editValue),
      value2: editValue2 ? parseFloat(editValue2) : undefined,
      condition: manualCondition ?? undefined,
    });
    setEditValue('');
    setEditValue2('');
  };

  const handleSaveManualCondition = async (condition: StatCondition) => {
    setManualCondition(condition);
    setShowConditionDropdown(false);
    if (expandedValues?.length) {
      const latest = [...expandedValues].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      updateStatValue.mutate({ id: latest.id, condition });
    }
    toast.success(`Состояние: ${getConditionInfo(condition).label}`);
  };

  const openDefEdit = () => {
    if (!expandedDef) return;
    setDefEditForm({
      title: expandedDef.title ?? '',
      description: expandedDef.description ?? '',
      calculation_method: expandedDef.calculation_method ?? '',
      purpose: expandedDef.purpose ?? '',
      is_double: expandedDef.is_double ?? false,
      inverted: expandedDef.inverted ?? false,
      is_favorite: expandedDef.is_favorite ?? false,
    });
    setShowDefEdit(true);
  };

  const handleSaveDefEdit = async () => {
    if (!expandedStatId || !defEditForm.title.trim()) return;
    await updateStatDef.mutateAsync({ id: expandedStatId, ...defEditForm });
    setShowDefEdit(false);
  };

  const handleExpandStat = (id: string) => {
    setExpandedStatId(id);
    setManualCondition(null);
    setShowEditForm(false);
    setShowDefEdit(false);
    setModalTab('view');
    setEditingPlanFact(false);
    setShowConditionDropdown(false);
  };

  const handleSavePlanFact = () => {
    if (!expandedValues?.length || !expandedStatId) return;
    const latest = [...expandedValues].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    updateStatValue.mutate({
      id: latest.id,
      value: factInput ? parseFloat(factInput) : Number(latest.value),
      value2: planInput ? parseFloat(planInput) : (latest.value2 != null ? Number(latest.value2) : undefined),
    });
    setEditingPlanFact(false);
  };

  const handleInlineEdit = (id: string, currentValue: number) => {
    setEditingValueId(id);
    setEditingValueVal(String(currentValue));
  };

  const handleInlineEditSave = (id: string) => {
    const val = parseFloat(editingValueVal);
    if (!isNaN(val)) {
      updateStatValue.mutate({ id, value: val });
    }
    setEditingValueId(null);
  };

  // Get owner dept chain label like "2 → Отдел 2.6 - Продаж"
  const getOwnerLabel = () => {
    if (!expandedOwnerDept) return '';
    const parent = departments?.find(d => d.id === expandedOwnerDept.parent_id);
    if (parent) {
      return `${parent.code.replace(/\D/g, '')} → ${expandedOwnerDept.full_name || expandedOwnerDept.name}`;
    }
    return expandedOwnerDept.full_name || expandedOwnerDept.name;
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
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-display font-bold text-[10px] shadow-md flex-shrink-0" style={{ backgroundColor: dept.color ?? 'hsl(var(--primary))' }}>
                  {dept.code.replace(/\D/g, '').charAt(0) || dept.name.charAt(0)}
                </div>
                <h2 className="text-xs font-display font-bold text-foreground uppercase tracking-tight">{dept.full_name || dept.name}</h2>
              </div>
              <span className="text-[9px] text-muted-foreground font-display font-bold uppercase">{t('stats.main_indicators')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {visibleStats.map(stat => (
                <StatCard key={stat.id} title={stat.title} description={stat.description} values={getStatValues(stat.id)} period={selectedPeriod} inverted={stat.inverted ?? false} isFavorite={stat.is_favorite ?? false} accentColor={dept.color ?? 'hsl(var(--primary))'} onClick={() => handleExpandStat(stat.id)} />
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
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 bg-muted rounded-lg text-muted-foreground"><Layers size={12} /></div>
            <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">Общие статистики департамента</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {deptMainStats.map(stat => (
              <StatCard key={stat.id} title={stat.title} description={stat.description} values={getStatValues(stat.id)} period={selectedPeriod} inverted={stat.inverted ?? false} isFavorite={stat.is_favorite ?? false} accentColor={selectedDept.color ?? 'hsl(var(--primary))'} onClick={() => handleExpandStat(stat.id)} />
            ))}
          </div>
        </div>
        {subDepts.map(sub => {
          const subStats = definitions.filter(d => d.owner_id === sub.id).filter(shouldRenderStat);
          if (subStats.length === 0) return null;
          return (
            <div key={sub.id} className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 px-1">
                <div className="bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-lg text-amber-700 dark:text-amber-400 text-[9px] font-display font-bold border border-amber-200 dark:border-amber-800 uppercase">DIV {sub.code.replace('div', '')}</div>
                <span className="text-[10px] font-display font-bold text-foreground uppercase tracking-tight">{sub.full_name || sub.name}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {subStats.map(stat => (
                  <StatCard key={stat.id} title={stat.title} description={stat.description} values={getStatValues(stat.id)} period={selectedPeriod} inverted={stat.inverted ?? false} isFavorite={stat.is_favorite ?? false} accentColor={selectedDept.color ?? 'hsl(var(--primary))'} onClick={() => handleExpandStat(stat.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Latest plan/fact values
  const latestPlan = expandedChartData.length > 0 ? expandedChartData[expandedChartData.length - 1]?.plan : null;
  const latestFact = expandedChartData.length > 0 ? expandedChartData[expandedChartData.length - 1]?.fact : null;

  return (
    <div className="flex flex-col animate-in fade-in space-y-4">
      {/* Toolbar */}
      <div className="bg-card p-3 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2">
          <div className="flex gap-1 bg-muted p-1 rounded-lg w-full md:w-auto">
            <button onClick={() => setDisplayMode('dashboard')} className={`flex-1 md:flex-none px-3 py-2 rounded-md text-xs font-display font-bold transition-colors flex items-center justify-center gap-1.5 ${displayMode === 'dashboard' ? 'bg-card shadow text-primary' : 'text-muted-foreground'}`}>
              <LayoutDashboard size={14} />{t('stats.title')}
            </button>
            <button onClick={() => setDisplayMode('list')} className={`flex-1 md:flex-none px-3 py-2 rounded-md text-xs font-display font-bold transition-colors flex items-center justify-center gap-1.5 ${displayMode === 'list' ? 'bg-card shadow text-primary' : 'text-muted-foreground'}`}>
              <List size={14} />Список
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Скачать CSV"><Download size={16} /></button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Импорт CSV"><Upload size={16} /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(fb => (
            <button key={fb.id} onClick={() => setTrendFilter(fb.id)} className={`px-3 py-1.5 rounded-full text-xs font-display font-bold transition-colors flex items-center gap-1.5 ${trendFilter === fb.id ? fb.color : 'text-muted-foreground border border-border hover:bg-accent'}`}>
              {fb.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${trendFilter === fb.id ? 'bg-white/20' : 'bg-muted'}`}>{fb.count}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setSelectedPeriod(p.id)} className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-colors ${selectedPeriod === p.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>{p.label}</button>
          ))}
        </div>
      </div>

      {selectedDept && (
        <div className="bg-card p-3 rounded-xl border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold text-xs shadow-lg flex-shrink-0" style={{ backgroundColor: selectedDept.color ?? 'hsl(var(--primary))' }}>
            {selectedDept.code.replace(/\D/g, '').charAt(0) || selectedDept.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-[11px] md:text-xs font-display font-bold text-foreground uppercase tracking-tight">{selectedDept.full_name || selectedDept.name}</h1>
            <p className="text-[9px] text-muted-foreground font-display font-semibold uppercase">РУКОВОДИТЕЛЬ: {selectedDept.manager_name || '—'}</p>
          </div>
        </div>
      )}

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
        <RenderListView definitions={definitions} valuesMap={valuesMap} selectedPeriod={selectedPeriod} onExpand={handleExpandStat} />
      )}

      {/* ========== MODAL ========== */}
      {expandedStatId && expandedDef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4" onClick={() => { setExpandedStatId(null); setShowEditForm(false); setShowDefEdit(false); setManualCondition(null); }}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="p-5 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-foreground text-lg leading-tight">{expandedDef.title}</h3>
                  <p className="text-xs text-muted-foreground font-display mt-0.5">{getOwnerLabel()}</p>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button onClick={openDefEdit} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent" title="Настройки"><Settings size={16} /></button>
                  <button onClick={() => { if (confirm('Удалить эту статистику и все её значения?')) { deleteStatDef.mutate(expandedStatId!); setExpandedStatId(null); setShowEditForm(false); setShowDefEdit(false); setManualCondition(null); } }} className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-accent"><Trash2 size={16} /></button>
                  <button onClick={() => { setExpandedStatId(null); setShowEditForm(false); setShowDefEdit(false); setManualCondition(null); }} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"><X size={18} /></button>
                </div>
              </div>
            </div>

            {/* Definition edit */}
            {showDefEdit && (
              <div className="px-5 pb-4">
                <div className="bg-accent/30 border border-border rounded-xl p-4 space-y-3">
                  <p className="text-xs font-display font-bold text-foreground uppercase">Редактирование определения</p>
                  <div>
                    <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Название *</label>
                    <input value={defEditForm.title} onChange={e => setDefEditForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Описание</label>
                    <textarea value={defEditForm.description} onChange={e => setDefEditForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Метод расчёта</label>
                      <textarea value={defEditForm.calculation_method} onChange={e => setDefEditForm(p => ({ ...p, calculation_method: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Назначение (тег)</label>
                      <input value={defEditForm.purpose} onChange={e => setDefEditForm(p => ({ ...p, purpose: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={defEditForm.is_favorite} onChange={e => setDefEditForm(p => ({ ...p, is_favorite: e.target.checked }))} className="rounded" />
                      <span className="text-xs font-display font-bold">ГСД</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={defEditForm.is_double} onChange={e => setDefEditForm(p => ({ ...p, is_double: e.target.checked }))} className="rounded" />
                      <span className="text-xs font-display font-bold">Двойная</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={defEditForm.inverted} onChange={e => setDefEditForm(p => ({ ...p, inverted: e.target.checked }))} className="rounded" />
                      <span className="text-xs font-display font-bold">Обратная</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveDefEdit} disabled={!defEditForm.title.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"><Save size={14} />Сохранить</button>
                    <button onClick={() => setShowDefEdit(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent transition-colors">Отмена</button>
                  </div>
                </div>
              </div>
            )}

            {/* Справка / Info block */}
            {(expandedDef.description || expandedDef.calculation_method) && (
              <div className="px-5 pb-3">
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Info size={14} className="text-orange-500" />
                    <span className="text-xs font-display font-bold text-orange-600 dark:text-orange-400 uppercase">Справка</span>
                  </div>
                  <p className="text-sm text-foreground/80">{expandedDef.description || expandedDef.calculation_method}</p>
                </div>
              </div>
            )}

            {/* Current value + Trend */}
            <div className="px-5 pb-3 grid grid-cols-2 gap-3">
              <div className="border border-border rounded-xl p-4">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-1">Текущее значение</p>
                <p className="text-3xl font-display font-bold text-foreground">{expandedTrend.current.toLocaleString('ru-RU')}</p>
              </div>
              <div className="border border-border rounded-xl p-4">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-1">Динамика периода</p>
                <div className="flex items-center gap-2">
                  {expandedTrend.direction === 'down' ? <TrendingDown size={22} className="text-rose-500" /> : <TrendingUp size={22} className="text-emerald-500" />}
                  <p className={`text-3xl font-display font-bold ${expandedTrend.isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {Math.abs(expandedTrend.percent).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs: Просмотр | Создать Программу */}
            <div className="px-5 pb-2">
              <div className="flex gap-4 border-b border-border">
                <button onClick={() => setModalTab('view')} className={`pb-2 text-sm font-display font-bold transition-colors border-b-2 ${modalTab === 'view' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
                  Просмотр
                </button>
                <button onClick={() => setModalTab('program')} className={`pb-2 text-sm font-display font-bold transition-colors border-b-2 ${modalTab === 'program' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
                  Создать Программу
                </button>
              </div>
            </div>

            {/* ===== VIEW TAB ===== */}
            {modalTab === 'view' && (
              <>
                {/* Chart: План/Факт */}
                <div className="px-5 pb-3">
                  <div className="border border-border rounded-xl p-4">
                    <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">ГРАФИК ПЛАН/ФАКТ</p>
                    {expandedChartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={expandedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(val: number, name: string) => {
                            const labels: Record<string, string> = { fact: 'Факт', plan: 'План' };
                            return [val.toLocaleString('ru-RU'), labels[name] || name];
                          }} />
                          <Legend formatter={(val) => ({ fact: 'Факт', plan: 'План' }[val] || val)} />
                          {/* Plan line - dashed blue */}
                          {expandedChartData.some(d => d.plan != null) && (
                            <Line type="linear" dataKey="plan" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="6 4" dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }} name="plan" />
                          )}
                          {/* Fact line - solid green */}
                          <Line type="linear" dataKey="fact" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} name="fact" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">Нет данных</div>
                    )}
                  </div>
                </div>

                {/* Chart: Динамика (Area + Trend) */}
                <div className="px-5 pb-3">
                  <div className="border border-border rounded-xl p-4">
                    <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">ГРАФИК ДИНАМИКИ</p>
                    {expandedChartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={expandedChartData}>
                          <defs>
                            <linearGradient id="factGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(val: number, name: string) => [val.toLocaleString('ru-RU'), name === 'trend' ? 'Тренд' : 'Факт']} />
                          {/* Area for fact */}
                          <Area type="linear" dataKey="fact" stroke="#3b82f6" strokeWidth={2} fill="url(#factGradient)" dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                          {/* Trend dashed line */}
                          <Line type="linear" dataKey="trend" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 4" dot={false} activeDot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">Нет данных</div>
                    )}
                  </div>
                </div>

                {/* Plan & Fact block */}
                <div className="px-5 pb-3">
                  <div className="border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider">ПЛАН И ФАКТ</p>
                      {!editingPlanFact && (
                        <button onClick={() => {
                          setEditingPlanFact(true);
                          setPlanInput(latestPlan != null ? String(latestPlan) : '');
                          setFactInput(latestFact != null ? String(latestFact) : '');
                        }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
                          <Edit2 size={12} />Редактировать
                        </button>
                      )}
                    </div>
                    {editingPlanFact ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">План</label>
                            <input type="number" value={planInput} onChange={e => setPlanInput(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Факт</label>
                            <input type="number" value={factInput} onChange={e => setFactInput(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSavePlanFact} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"><Save size={14} />Сохранить</button>
                          <button onClick={() => setEditingPlanFact(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent transition-colors">Отмена</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[9px] text-muted-foreground font-display uppercase">План</p>
                          <p className="text-xl font-display font-bold text-foreground">{latestPlan != null ? `${latestPlan.toLocaleString('ru-RU')} шт` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground font-display uppercase">Факт</p>
                          <p className="text-xl font-display font-bold text-foreground">{latestFact != null ? `${latestFact.toLocaleString('ru-RU')} шт` : '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Condition block */}
                <div className="px-5 pb-3">
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-800/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider">УСЛОВИЕ</p>
                      <button onClick={() => { setManualCondition(null); toast.info('Автоматический расчёт'); }} className="text-[10px] text-muted-foreground font-display hover:underline">
                        Автоматически
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      {/* Condition dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowConditionDropdown(!showConditionDropdown)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 border ${conditionInfo.bgColor} ${conditionInfo.color} border-current/20`}
                        >
                          {conditionInfo.label}
                          <ChevronDown size={12} />
                        </button>
                        {showConditionDropdown && (
                          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px] py-1">
                            {CONDITIONS.map(c => (
                              <button
                                key={c.id}
                                onClick={() => handleSaveManualCondition(c.id)}
                                className={`w-full text-left px-3 py-2 text-xs font-display font-bold hover:bg-accent transition-colors flex items-center gap-2 ${activeCondition === c.id ? c.color : 'text-foreground'}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${c.bgColor}`} />
                                {c.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">Автоматический расчет по тренду</span>
                    </div>
                    {/* Battle plan shortcut */}
                    <button
                      onClick={() => {
                        setModalTab('program');
                        setProgramForm(p => ({ ...p, name: `Боевой план: ${conditionInfo.label}`, purpose: `Выполнение формулы состояния "${conditionInfo.label}" для улучшения показателей.`, mainTask: `В точности выполнить шаги формулы "${conditionInfo.label}" и добиться повышения статистики.` }));
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs font-display font-bold text-foreground hover:bg-accent transition-colors"
                    >
                      📋 Создать боевой план для: {conditionInfo.label}
                    </button>
                  </div>
                </div>

                {/* Big button */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => {
                      const next = !showEditForm;
                      setShowEditForm(next);
                      if (next) {
                        setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                      }
                    }}
                    className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-display font-bold hover:bg-primary/90 transition-colors uppercase tracking-wider"
                  >
                    {showEditForm ? 'СКРЫТЬ РЕДАКТОР' : 'РЕДАКТИРОВАТЬ ДАННЫЕ (ВВОД)'}
                  </button>
                </div>

                {/* Data editor overlay */}
                {showEditForm && (
                  <div ref={editorRef} className="px-5 pb-5">
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="p-4 bg-accent/30 border-b border-border">
                        <p className="text-xs font-display font-bold text-foreground uppercase">Редактор статистики</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{expandedDef.title}</p>
                        {expandedDef.description && (
                          <p className="text-[10px] text-muted-foreground mt-1">ⓘ Справка / Методика: {expandedDef.description}</p>
                        )}
                      </div>
                      {/* Add new value */}
                      <div className="p-4 border-b border-border bg-orange-50/50 dark:bg-orange-950/10">
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                          <div>
                            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Дата</label>
                            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Значение 1</label>
                            <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} placeholder="0" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                          </div>
                          <button onClick={handleAddValue} disabled={!editValue} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 h-[38px]">
                            <Plus size={14} />Добавить
                          </button>
                        </div>
                      </div>
                      {/* Values list */}
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-accent/50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-[10px] font-display font-bold text-muted-foreground uppercase">Дата</th>
                              <th className="px-4 py-2 text-right text-[10px] font-display font-bold text-muted-foreground uppercase">Значение</th>
                              <th className="px-4 py-2 text-right text-[10px] font-display font-bold text-muted-foreground uppercase w-24">Действия</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {expandedValues && [...expandedValues].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(v => (
                              <tr key={v.id} className="hover:bg-accent/20">
                                <td className="px-4 py-2.5 font-display text-foreground">
                                  {new Date(v.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-2.5 text-right font-display font-bold text-foreground">
                                  {editingValueId === v.id ? (
                                    <input
                                      type="number"
                                      value={editingValueVal}
                                      onChange={e => setEditingValueVal(e.target.value)}
                                      onBlur={() => handleInlineEditSave(v.id)}
                                      onKeyDown={e => e.key === 'Enter' && handleInlineEditSave(v.id)}
                                      autoFocus
                                      className="w-20 px-2 py-1 rounded border border-primary bg-background text-foreground text-sm text-right"
                                    />
                                  ) : (
                                    Number(v.value).toLocaleString('ru-RU')
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleInlineEdit(v.id, Number(v.value))} className="p-1.5 text-muted-foreground hover:text-primary rounded transition-colors" title="Редактировать">
                                      <Edit2 size={13} />
                                    </button>
                                    <button onClick={() => deleteStatValue.mutate({ id: v.id, definitionId: v.definition_id })} className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors" title="Удалить">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== PROGRAM TAB ===== */}
            {modalTab === 'program' && (
              <div className="px-5 pb-5 space-y-4">
                <div className="border border-border rounded-xl p-5 space-y-4">
                  <p className="text-sm font-display font-bold text-foreground">Основная информация</p>
                  <div>
                    <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Название программы *</label>
                    <input value={programForm.name} onChange={e => setProgramForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm" placeholder="Боевой план: Чрезвычайное положение" />
                  </div>
                  <div>
                    <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Срок выполнения</label>
                    <input value={programForm.deadline} onChange={e => setProgramForm(p => ({ ...p, deadline: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Ссылки (ИП ОХС и другие материалы)</label>
                    {programForm.links.map((link, i) => (
                      <input key={i} value={link} onChange={e => { const l = [...programForm.links]; l[i] = e.target.value; setProgramForm(p => ({ ...p, links: l })); }} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm mb-2" placeholder='ИП ОХС "Формулы состояний"' />
                    ))}
                    <button onClick={() => setProgramForm(p => ({ ...p, links: [...p.links, ''] }))} className="text-xs text-primary font-display font-bold flex items-center gap-1 hover:underline">
                      <Plus size={12} />Добавить ссылку
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Замысел программы *</label>
                    <textarea value={programForm.purpose} onChange={e => setProgramForm(p => ({ ...p, purpose: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm resize-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Главная задача *</label>
                    <textarea value={programForm.mainTask} onChange={e => setProgramForm(p => ({ ...p, mainTask: e.target.value }))} rows={2} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm resize-none" />
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-display font-bold text-primary flex items-center gap-2">⊙ Первоочередные задачи</p>
                    <button onClick={() => setProgramForm(p => ({ ...p, tasks: [...p.tasks, { text: '', responsible: '', deadline: '', subtasks: [''] }] }))} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
                      <Plus size={12} />Добавить задачу
                    </button>
                  </div>
                  <div className="space-y-3">
                    {programForm.tasks.map((task, ti) => (
                      <div key={ti} className="border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-display font-bold text-muted-foreground mt-2.5">{ti + 1}.</span>
                          <textarea
                            value={task.text}
                            onChange={e => { const t = [...programForm.tasks]; t[ti].text = e.target.value; setProgramForm(p => ({ ...p, tasks: t })); }}
                            rows={2}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none"
                            placeholder={`${ti + 1}. Описание задачи...`}
                          />
                          <button onClick={() => { const t = [...programForm.tasks]; t.splice(ti, 1); setProgramForm(p => ({ ...p, tasks: t.length > 0 ? t : [{ text: '', responsible: '', deadline: '', subtasks: [''] }] })); }} className="p-1 text-muted-foreground hover:text-destructive">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pl-5">
                          <div>
                            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Ответственный</label>
                            <select
                              value={task.responsible}
                              onChange={e => { const t = [...programForm.tasks]; t[ti].responsible = e.target.value; setProgramForm(p => ({ ...p, tasks: t })); }}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                            >
                              <option value="">Выберите сотрудника</option>
                              {(employees ?? []).map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Срок выполнения</label>
                            <input type="date" value={task.deadline} onChange={e => { const t = [...programForm.tasks]; t[ti].deadline = e.target.value; setProgramForm(p => ({ ...p, tasks: t })); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                          </div>
                        </div>
                        {/* Subtasks */}
                        <div className="pl-5">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase">Подзадачи</label>
                            <button onClick={() => { const t = [...programForm.tasks]; t[ti].subtasks.push(''); setProgramForm(p => ({ ...p, tasks: t })); }} className="text-[10px] text-primary font-display font-bold flex items-center gap-0.5 hover:underline">
                              <Plus size={10} />Добавить подзадачу
                            </button>
                          </div>
                          {task.subtasks.map((st, si) => (
                            <div key={si} className="flex gap-2 mb-1.5">
                              <input
                                value={st}
                                onChange={e => { const t = [...programForm.tasks]; t[ti].subtasks[si] = e.target.value; setProgramForm(p => ({ ...p, tasks: t })); }}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                                placeholder="Подзадача..."
                              />
                              <button onClick={() => { const t = [...programForm.tasks]; t[ti].subtasks.splice(si, 1); setProgramForm(p => ({ ...p, tasks: t })); }} className="p-1 text-muted-foreground hover:text-destructive">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save program button */}
                <button
                  onClick={() => { toast.success('Программа сохранена (функция в разработке)'); }}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-display font-bold hover:bg-primary/90 transition-colors uppercase tracking-wider"
                >
                  Сохранить программу
                </button>
              </div>
            )}
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
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-display font-bold uppercase">{stat.owner_type}</span></td>
                <td className="px-4 py-3">{stat.is_favorite && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-display font-bold">ГСД</span>}</td>
                <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded font-display font-bold ${ci.bgColor} ${ci.color}`}>{ci.label}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); onExpand(stat.id); }} className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"><TrendingUp size={16} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
