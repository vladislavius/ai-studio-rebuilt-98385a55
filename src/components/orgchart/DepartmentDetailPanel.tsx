import { useState } from 'react';
import { DBDepartment } from '@/hooks/useDepartments';
import { X, BookOpen, Pencil, Users, Search, ChevronDown, ChevronUp, AlertTriangle, Rocket, Plus } from 'lucide-react';
import { useStatisticDefinitions } from '@/hooks/useStatistics';
import { useDepartmentDiagnostics } from '@/hooks/useOrgChartMutations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { StatDefinitionEditModal } from './StatDefinitionEditModal';

interface Props {
  dept: DBDepartment;
  allDepts: DBDepartment[];
  employees: Array<{
    id: string;
    full_name: string;
    position: string;
    department_ids: string[] | null;
    subdepartment_ids?: string[] | null;
    photo_url?: string | null;
    nickname?: string | null;
    phone?: string | null;
    telegram?: string | null;
  }>;
  onClose: () => void;
  isAdmin?: boolean;
  onEditDept?: (d: DBDepartment) => void;
  onAddChild?: (d: DBDepartment) => void;
}

export function DepartmentDetailPanel({ dept, allDepts, employees, onClose, isAdmin, onEditDept, onAddChild }: Props) {
  const [search, setSearch] = useState('');
  const [statPeriod, setStatPeriod] = useState('3');
  const [expandedStatId, setExpandedStatId] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [editingStat, setEditingStat] = useState<any>(null); // null=closed, object=edit, 'new'=create
  const [showStatModal, setShowStatModal] = useState(false);

  const { data: statDefs } = useStatisticDefinitions('department', dept.id);
  const { data: diagnosticsData } = useDepartmentDiagnostics(dept.id);

  const { data: allStatValues } = useQuery({
    queryKey: ['all-stat-values-dept', dept.id],
    queryFn: async () => {
      const defIds = (statDefs ?? []).map(d => d.id);
      if (defIds.length === 0) return [];
      const { data, error } = await supabase
        .from('statistic_values')
        .select('*')
        .in('definition_id', defIds)
        .order('date');
      if (error) throw error;
      return data;
    },
    enabled: (statDefs ?? []).length > 0,
  });
  const statValues = allStatValues ?? [];

  const children = allDepts.filter(d => d.parent_id === dept.id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const deptAndChildIds = [dept.id, ...children.map(c => c.id)];
  const deptEmployees = employees.filter(e =>
    (e.department_ids ?? []).some(id => deptAndChildIds.includes(id)) ||
    (e.subdepartment_ids ?? []).some(id => deptAndChildIds.includes(id))
  );
  const filteredEmployees = deptEmployees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const deptStatDefs = (statDefs ?? []).filter(
    s => s.owner_type === 'department' && s.owner_id === dept.id
  );

  const problems = (diagnosticsData ?? []).filter(d => d.type === 'problem');
  const actions = (diagnosticsData ?? []).filter(d => d.type === 'action');
  const hasDiagnostics = problems.length > 0 || actions.length > 0;

  const getStatChartData = (defId: string) => {
    return (statValues ?? [])
      .filter(v => v.definition_id === defId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-parseInt(statPeriod) * 7)
      .map(v => ({
        date: new Date(v.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        value: v.value,
      }));
  };

  const getLatestValue = (defId: string) => {
    const values = (statValues ?? []).filter(v => v.definition_id === defId);
    if (values.length === 0) return null;
    return [...values].sort((a, b) => b.date.localeCompare(a.date))[0];
  };

  const getTrend = (defId: string) => {
    const values = (statValues ?? [])
      .filter(v => v.definition_id === defId)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (values.length < 2) return null;
    const prev = values[values.length - 2].value;
    const curr = values[values.length - 1].value;
    if (prev === 0) return null;
    return Math.round(((curr - prev) / Math.abs(prev)) * 100);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border z-50 overflow-y-auto shadow-2xl animate-in slide-in-from-right-full duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-bold text-card"
            style={{ backgroundColor: dept.color ?? 'hsl(var(--primary))' }}
          >
            {dept.sort_order}
          </span>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">{dept.name}</h2>
            {dept.full_name && <p className="text-xs text-muted-foreground font-body">{dept.full_name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <BookOpen size={16} />
          </button>
          {isAdmin && onEditDept && (
            <button
              onClick={() => onEditDept(dept)}
              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Pencil size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Description */}
        <section>
          <p className="text-[10px] font-display font-bold text-primary uppercase tracking-widest mb-2">📋 Описание</p>
          <p className="text-sm font-body text-muted-foreground leading-relaxed">
            {dept.long_description ?? dept.description ?? 'Описание не указано'}
          </p>
        </section>

        {/* VFP */}
        {dept.vfp && (
          <section>
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
              👑 ЦКП Департамента
            </p>
            <div className="border-l-4 border-primary pl-4 bg-primary/5 rounded-r-lg py-3 pr-3">
              <p className="text-sm font-body text-foreground italic leading-relaxed">"{dept.vfp}"</p>
            </div>
          </section>
        )}

        {/* Statistics */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
              📊 Статистики департамента ({deptStatDefs.length})
            </p>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => { setEditingStat(null); setShowStatModal(true); }}
                  className="text-[10px] text-primary font-display font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={10} /> Добавить
                </button>
              )}
              <select
                value={statPeriod}
                onChange={e => setStatPeriod(e.target.value)}
                className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground font-display"
              >
                <option value="3">3 Нед.</option>
                <option value="6">6 Нед.</option>
                <option value="12">12 Нед.</option>
              </select>
            </div>
          </div>
          {deptStatDefs.length > 0 ? (
            <div className="space-y-3">
              {deptStatDefs.map(def => {
                const chartData = getStatChartData(def.id);
                const latest = getLatestValue(def.id);
                const trend = getTrend(def.id);
                const isExpanded = expandedStatId === def.id;
                return (
                  <div key={def.id} className="bg-muted/50 border border-border rounded-xl p-4 group/stat">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs font-display font-bold text-foreground uppercase flex-1">{def.title}</p>
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <button
                            onClick={() => { setEditingStat(def); setShowStatModal(true); }}
                            className="opacity-0 group-hover/stat:opacity-100 transition-opacity"
                          >
                            <Pencil size={10} className="text-muted-foreground hover:text-primary" />
                          </button>
                        )}
                        {def.purpose && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-display font-bold ml-1 flex-shrink-0">
                            {def.purpose}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] font-body text-muted-foreground mb-2">{def.description ?? ''}</p>

                    <button
                      onClick={() => setExpandedStatId(isExpanded ? null : def.id)}
                      className="flex items-center gap-1 text-[10px] text-primary font-display font-bold mb-2 hover:underline"
                    >
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      {isExpanded ? 'Скрыть' : 'Подробнее'}
                    </button>
                    {isExpanded && def.calculation_method && (
                      <div className="bg-card border border-border rounded-lg p-3 mb-2">
                        <p className="text-[10px] font-display font-bold text-muted-foreground uppercase mb-1">Метод расчёта</p>
                        <p className="text-xs font-body text-muted-foreground">{def.calculation_method}</p>
                      </div>
                    )}

                    {latest ? (
                      <>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-display font-bold text-foreground">
                            {Number(latest.value).toLocaleString('ru-RU')}
                          </span>
                          {trend !== null && (
                            <span className={`text-xs font-display font-bold ${trend >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                              {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
                            </span>
                          )}
                        </div>
                        {chartData.length >= 2 && (
                          <div className="h-16">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                <Line type="monotone" dataKey="value" stroke={dept.color ?? 'hsl(var(--primary))'} strokeWidth={2} dot={false} />
                                <Tooltip
                                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '10px' }}
                                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Нет данных</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground/50 text-xs">Статистики не заданы</div>
          )}
        </section>

        {/* Diagnostics from DB */}
        {hasDiagnostics && (
          <section>
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full flex items-center justify-between text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2 hover:text-foreground transition-colors"
            >
              <span>🔍 Диагностика и развитие</span>
              {showDiagnostics ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showDiagnostics && (
              <div className="grid grid-cols-1 gap-3">
                {problems.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-destructive" />
                      <p className="text-xs font-display font-bold text-destructive">Признаки проблем</p>
                    </div>
                    <ul className="space-y-1">
                      {problems.map((p) => (
                        <li key={p.id} className="text-xs font-body text-muted-foreground flex items-start gap-2">
                          <span className="text-destructive mt-0.5">•</span> {p.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {actions.length > 0 && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket size={14} className="text-green-500" />
                      <p className="text-xs font-display font-bold text-green-500">Первоочередные действия</p>
                    </div>
                    <ul className="space-y-1">
                      {actions.map((a) => (
                        <li key={a.id} className="text-xs font-body text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span> {a.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Goal */}
        {dept.goal && (
          <section>
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">🎯 Цель</p>
            <p className="text-sm font-body text-muted-foreground">{dept.goal}</p>
          </section>
        )}

        {/* Manager */}
        <section>
          <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Users size={16} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">Руководитель</p>
              <p className="text-sm font-display font-semibold text-foreground">{dept.manager_name ?? '—'}</p>
            </div>
          </div>
        </section>

        {/* Subdivisions */}
        {children.length > 0 && (
          <section>
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-3">
              🏢 Отделы департамента ({children.length})
            </p>
            <div className="space-y-3">
              {children.map(child => {
                const childEmps = employees.filter(e =>
                  (e.department_ids ?? []).includes(child.id) ||
                  ((e as any).subdepartment_ids ?? []).some((id: string) => id === child.id)
                );
                return (
                  <div key={child.id} className="bg-muted/30 border border-border rounded-xl overflow-hidden group/child">
                    <div className="h-1" style={{ backgroundColor: child.color ?? dept.color ?? 'hsl(var(--primary))' }} />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-display font-bold text-foreground">{child.name}</p>
                        <div className="flex items-center gap-2">
                          {isAdmin && onEditDept && (
                            <button
                              onClick={() => onEditDept(child)}
                              className="opacity-0 group-hover/child:opacity-100 transition-opacity"
                            >
                              <Pencil size={10} className="text-muted-foreground hover:text-primary" />
                            </button>
                          )}
                          <span className="text-xs text-muted-foreground font-display">{childEmps.length}</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-body text-muted-foreground mb-2">
                        {child.description ?? ''}
                      </p>
                      {child.vfp && (
                        <div className="border-l-2 border-primary/40 pl-2 mb-2">
                          <p className="text-[10px] font-display text-primary font-bold uppercase">ЦКП</p>
                          <p className="text-[10px] font-body text-muted-foreground italic">{child.vfp}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-body">
                        <span>👤</span>
                        <span>{child.manager_name ?? '—'}</span>
                      </div>
                      {child.main_stat && (
                        <p className="text-[10px] text-primary/70 font-display mt-1">📈 {child.main_stat}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {isAdmin && onAddChild && (
              <button
                onClick={() => onAddChild(dept)}
                className="mt-3 w-full py-2 border border-dashed border-border rounded-xl text-xs text-muted-foreground font-display hover:border-primary hover:text-primary flex items-center justify-center gap-1 transition-colors"
              >
                <Plus size={12} /> Добавить отдел
              </button>
            )}
          </section>
        )}

        {/* Employees */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
              👥 Сотрудники ({deptEmployees.length})
            </p>
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-xs bg-muted border border-border rounded-lg pl-7 pr-3 py-1.5 text-foreground font-body w-36 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/50">
              <Users size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-body">Нет сотрудников</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="bg-muted/30 border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-display font-bold text-muted-foreground">
                        {emp.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-foreground truncate">{emp.full_name}</p>
                    <p className="text-xs font-body text-primary truncate">{emp.position}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Stat edit modal */}
      <StatDefinitionEditModal
        open={showStatModal}
        onClose={() => { setShowStatModal(false); setEditingStat(null); }}
        stat={editingStat}
        ownerId={dept.id}
      />
    </div>
  );
}
