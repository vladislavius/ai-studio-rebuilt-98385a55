import { useState } from 'react';
import { DBDepartment } from '@/hooks/useDepartments';
import { X, BookOpen, Pencil, Users, Search, TrendingUp, ChevronDown } from 'lucide-react';
import { useStatisticDefinitions, useStatisticValues } from '@/hooks/useStatistics';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  dept: DBDepartment;
  allDepts: DBDepartment[];
  employees: Array<{
    id: string;
    full_name: string;
    position: string;
    department_ids: string[] | null;
    photo_url?: string | null;
    nickname?: string | null;
    phone?: string | null;
    telegram?: string | null;
  }>;
  onClose: () => void;
}

type Tab = 'info' | 'functions' | 'employees';

export function DepartmentDetailPanel({ dept, allDepts, employees, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [statPeriod, setStatPeriod] = useState('3');
  const { data: statDefs } = useStatisticDefinitions();
  const { data: statValues } = useStatisticValues();

  const deptEmployees = employees.filter(e => (e.department_ids ?? []).includes(dept.id));
  const filteredEmployees = deptEmployees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase())
  );

  // Stats for this department
  const deptStatDefs = (statDefs ?? []).filter(
    s => s.owner_type === 'department' && s.owner_id === dept.id
  );

  const getStatChartData = (defId: string) => {
    const values = (statValues ?? [])
      .filter(v => v.definition_id === defId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-parseInt(statPeriod) * 7);
    return values.map(v => ({
      date: new Date(v.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      value: v.value,
    }));
  };

  const getLatestValue = (defId: string) => {
    const values = (statValues ?? []).filter(v => v.definition_id === defId);
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0];
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

  const children = allDepts.filter(d => d.parent_id === dept.id);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border z-50 overflow-y-auto shadow-2xl animate-in slide-in-from-right-full duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-bold text-card"
            style={{ backgroundColor: dept.color ?? '#4C5CFF' }}
          >
            {dept.sort_order}
          </span>
          <h2 className="text-lg font-display font-bold text-foreground">
            {dept.name.replace(/^Отд\. \d+ — /, '')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <BookOpen size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
            <Pencil size={16} />
          </button>
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

        {/* Main Stat */}
        <section>
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">Главная статистика</p>
          <div className="border-2 border-primary/30 rounded-xl p-4 bg-primary/5">
            <p className="text-xs font-display font-bold text-primary uppercase">📈 Главная статистика</p>
            <p className="text-xs font-body text-muted-foreground mt-1">
              {dept.main_stat ?? 'Статистика не указана'}
            </p>
          </div>
        </section>

        {/* All Department Stats */}
        {deptStatDefs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
                📊 Все статистики департамента
              </p>
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
            <div className="grid grid-cols-2 gap-3">
              {deptStatDefs.map(def => {
                const chartData = getStatChartData(def.id);
                const latest = getLatestValue(def.id);
                const trend = getTrend(def.id);
                return (
                  <div key={def.id} className="bg-muted/50 border border-border rounded-xl p-4">
                    <p className="text-xs font-display font-bold text-foreground uppercase mb-0.5">{def.title}</p>
                    <p className="text-[10px] font-body text-muted-foreground mb-2">{def.description ?? ''}</p>
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
                                <Line type="monotone" dataKey="value" stroke={dept.color ?? '#4C5CFF'} strokeWidth={2} dot={false} />
                                <Tooltip
                                  contentStyle={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 16%)', borderRadius: '8px', fontSize: '10px' }}
                                  labelStyle={{ color: 'hsl(0 0% 55%)' }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Недостаточно данных</p>
                        <p className="text-[10px] font-body text-muted-foreground/60">Требуется минимум 2 значения</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* VFP */}
        {dept.vfp && (
          <section>
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
              👑 Ценный конечный продукт (ЦКП)
            </p>
            <div className="border-l-4 border-primary pl-4">
              <p className="text-sm font-body text-foreground italic">"{dept.vfp}"</p>
            </div>
          </section>
        )}

        {/* Goal */}
        {dept.goal && (
          <section>
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
              🎯 Цель
            </p>
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
              <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
                Ответственный руководитель
              </p>
              <p className="text-sm font-display font-semibold text-foreground">{dept.manager_name ?? '—'}</p>
            </div>
          </div>
        </section>

        {/* Subdivisions */}
        {children.length > 0 && (
          <section>
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
              🏢 Подразделения ({children.length})
            </p>
            <div className="space-y-2">
              {children.map(child => (
                <div key={child.id} className="bg-muted/50 border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-display font-semibold text-foreground">{child.name}</p>
                    <p className="text-[10px] font-body text-muted-foreground">• {child.manager_name ?? '—'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-display">
                    {employees.filter(e => (e.department_ids ?? []).includes(child.id)).length}
                  </span>
                </div>
              ))}
            </div>
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
              <p className="text-xs font-body">Нет сотрудников в этом отделе</p>
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
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-body">
                      {emp.nickname && <span>• {emp.nickname}</span>}
                      {emp.phone && <span>📞 {emp.phone}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
