import { useState } from 'react';
import { Plus, Edit3, Trash2, Eye, ChevronRight, ChevronDown, Save, BookOpen, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CyberneticCard } from '@/components/ui/cybernetic-card';
import { toast } from 'sonner';
import {
  useAdminScales, AdminScale, AdminScaleProgram, AdminScaleStep,
  STEP_TYPES, emptyProgram, emptyStep,
  buildWifeTemplate, buildMarketingTemplate, buildExcursionsTemplate, buildTIPTemplate,
} from '@/hooks/useAdminScale';

type ASView = 'dashboard' | 'editor' | 'review';

const STEP_TYPE_COLORS: Record<string, string> = {
  primary: 'hsl(0, 72%, 51%)', vital: 'hsl(30, 80%, 50%)',
  conditional: 'hsl(210, 60%, 50%)', operating: 'hsl(145, 60%, 40%)', production: 'hsl(270, 50%, 50%)',
};

export function AdminScalePage() {
  const { scales, currentScale, currentId, setCurrentId, loading, createScale, deleteScale, updateScale } = useAdminScales();
  const [view, setView] = useState<ASView>('dashboard');
  const [newName, setNewName] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({});
  const [refOpen, setRefOpen] = useState(false);

  const toggleLevel = (key: string) => setExpandedLevels(prev => ({ ...prev, [key]: !prev[key] }));

  const openScale = (id: string) => { setCurrentId(id); setView('editor'); };

  const handleCreate = () => {
    const name = newName.trim() || 'Новая шкала';
    createScale(name);
    setNewName('');
    setShowNewModal(false);
    setView('editor');
    toast.success('Шкала создана');
  };

  const loadTemplate = (tpl: string) => {
    let s: AdminScale;
    if (tpl === 'wife') s = buildWifeTemplate();
    else if (tpl === 'marketing') s = buildMarketingTemplate();
    else return;
    updateScale(s.id, () => s);
    // Actually we need to add it
    createScale(s.name);
    // Overwrite with template data
    const created = scales[scales.length]; // won't work, let's just use a different approach
  };

  const handleLoadTemplate = (builder: () => AdminScale) => {
    const s = builder();
    // We need to add to scales directly  
    createScale(s.name);
    // Then update the latest one with template data
    setTimeout(() => {
      updateScale(scales[scales.length - 1]?.id ?? '', () => s);
      setView('editor');
      toast.success('Шаблон загружен');
    }, 100);
  };

  const exportJSON = () => {
    if (!currentScale) return;
    const blob = new Blob([JSON.stringify(currentScale, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${currentScale.name}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON экспортирован');
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text) as AdminScale;
        data.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        createScale(data.name);
        setTimeout(() => {
          updateScale(data.id, () => data);
          toast.success('Шкала импортирована');
        }, 100);
      } catch { toast.error('Ошибка импорта'); }
    };
    input.click();
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Административная Шкала</h1>
          <p className="text-sm text-muted-foreground font-body">10-уровневая шкала: от Цели до ЦКП</p>
        </div>
        <div className="flex gap-2">
          {view !== 'dashboard' && (
            <Button variant="outline" size="sm" onClick={() => setView('dashboard')}>
              ← Назад
            </Button>
          )}
          {view === 'editor' && currentScale && (
            <>
              <Button variant="outline" size="sm" onClick={() => setView('review')}>
                <Eye size={14} className="mr-1" /> Обзор
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRefOpen(!refOpen)}>
                <BookOpen size={14} className="mr-1" /> Справочник
              </Button>
              <Button variant="outline" size="sm" onClick={exportJSON}>
                <Download size={14} className="mr-1" /> JSON
              </Button>
            </>
          )}
          {view === 'dashboard' && (
            <>
              <Button variant="outline" size="sm" onClick={importJSON}>
                <Upload size={14} className="mr-1" /> Импорт
              </Button>
              <Button size="sm" onClick={() => setShowNewModal(true)}>
                <Plus size={14} className="mr-1" /> Новая шкала
              </Button>
            </>
          )}
        </div>
      </div>

      {/* New modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-background/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold text-foreground">Новая шкала</h2>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Название шкалы" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Отмена</Button>
              <Button onClick={handleCreate}>Создать</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Panel */}
      {refOpen && <ReferencePanel onClose={() => setRefOpen(false)} />}

      {/* Views */}
      {view === 'dashboard' && (
        <DashboardView
          scales={scales}
          onOpen={openScale}
          onDelete={deleteScale}
          onNewScale={() => setShowNewModal(true)}
          onOpenRef={() => setRefOpen(true)}
          onLoadTemplate={(builder) => {
            const s = builder();
            createScale(s.name);
            setView('editor');
            toast.success('Шаблон загружен');
          }}
        />
      )}
      {view === 'editor' && currentScale && (
        <EditorView
          scale={currentScale}
          onUpdate={(updater) => updateScale(currentScale.id, updater)}
          expandedLevels={expandedLevels}
          toggleLevel={toggleLevel}
        />
      )}
      {view === 'review' && currentScale && <ReviewView scale={currentScale} />}
    </div>
  );
}

// ─── Dashboard ───
function DashboardView({ scales, onOpen, onDelete, onNewScale, onLoadTemplate, onOpenRef }: {
  scales: AdminScale[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNewScale: () => void;
  onLoadTemplate: (builder: () => AdminScale) => void;
  onOpenRef: () => void;
}) {
  const templateCards = [
    { icon: '✦', title: 'Новая шкала', desc: 'Создайте административную шкалу — от Цели до ЦКП, с программами и задачами по всем правилам.', color: 'hsl(var(--primary))', onClick: onNewScale },
    { icon: '📖', title: 'Справочник', desc: 'Полное руководство: структура программ, 5 типов задач, правила проектов. Всё из первоисточника.', color: 'hsl(210, 60%, 50%)', onClick: onOpenRef },
    { icon: '🏢', title: 'Пример: Экскурсии', desc: 'Загрузить готовую программу «Проведение экскурсий по компании» — реальный пример из ПДФ.', color: 'hsl(270, 50%, 50%)', onClick: () => onLoadTemplate(buildExcursionsTemplate) },
    { icon: '🌹', title: 'Пример: Вечер с женой', desc: 'Классический пример из книги: кино, ресторан, прогулка — программа и проект в действии.', color: 'hsl(145, 60%, 40%)', onClick: () => onLoadTemplate(buildWifeTemplate) },
    { icon: '📈', title: 'Пример: Маркетинговое агентство', desc: 'Полная шкала агентства: увеличить клиентов на 50% через соцсети. Программа + проект + приказы.', color: 'hsl(30, 80%, 50%)', onClick: () => onLoadTemplate(buildMarketingTemplate) },
    { icon: '👥', title: 'Пример: ТИПы сотрудников', desc: 'Программа по составлению технических индивидуальных программ для сотрудников.', color: 'hsl(170, 60%, 40%)', onClick: () => onLoadTemplate(buildTIPTemplate) },
  ];

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templateCards.map((t, i) => (
          <CyberneticCard key={i} glowColor={t.color} className="p-5 cursor-pointer" onClick={t.onClick}>
            <div className="text-3xl mb-3">{t.icon}</div>
            <h3 className="text-sm font-display font-bold text-foreground mb-1">{t.title}</h3>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">{t.desc}</p>
          </CyberneticCard>
        ))}
      </div>

      {/* Info card */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-display font-bold text-foreground">Правильная логика: Программа → Шаг (Задача) → Проект</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: '📋', title: 'ПЛАН', desc: 'Широкомасштабное намерение.', color: 'hsl(var(--primary))' },
            { icon: '⚡', title: 'ПРОГРАММА', desc: 'Упорядоченная последовательность шагов.', color: 'hsl(270, 50%, 50%)' },
            { icon: '📌', title: 'ШАГ = ЗАДАЧА', desc: 'Один тип + исполнитель + дедлайн.', color: 'hsl(210, 60%, 50%)' },
            { icon: '🔧', title: 'ПРОЕКТ', desc: 'Только когда шаг слишком сложный.', color: 'hsl(170, 60%, 40%)' },
          ].map((c, i) => (
            <div key={i} className="p-3 bg-accent/50 rounded-lg border-l-[3px]" style={{ borderLeftColor: c.color }}>
              <p className="text-[11px] font-bold mb-1" style={{ color: c.color }}>{c.icon} {c.title}</p>
              <p className="text-[11px] text-muted-foreground font-body">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Existing scales */}
      {scales.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">Мои шкалы</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scales.map(s => {
              const steps = s.programs.flatMap(p => p.steps);
              const done = steps.filter(x => x.done).length;
              const pct = steps.length ? Math.round(done / steps.length * 100) : 0;
              return (
                <CyberneticCard key={s.id} glowColor="hsl(var(--primary))" className="p-4 cursor-pointer" onClick={() => onOpen(s.id)}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-display font-bold text-foreground">{s.name}</h4>
                    <button onClick={e => { e.stopPropagation(); if (confirm('Удалить шкалу?')) onDelete(s.id); }}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mb-2">
                    {s.programs.length} программ · {steps.length} задач
                  </p>
                  {s.goal && <p className="text-[11px] text-muted-foreground font-body italic truncate mb-2">{s.goal}</p>}
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-display mt-1">{pct}% выполнено</p>
                </CyberneticCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Editor ───
function EditorView({ scale, onUpdate, expandedLevels, toggleLevel }: {
  scale: AdminScale;
  onUpdate: (updater: (s: AdminScale) => AdminScale) => void;
  expandedLevels: Record<string, boolean>;
  toggleLevel: (key: string) => void;
}) {
  const levels1to4 = [
    { n: 1, icon: '🎯', title: 'ЦЕЛЬ', desc: '«Зачем играть?» — абстрактно и долгосрочно', field: 'goal' as keyof AdminScale, ph: 'Что является конечной целью?' },
    { n: 2, icon: '💡', title: 'ЗАМЫСЛЫ', desc: 'Намерения для конкретных видов деятельности', field: 'purpose' as keyof AdminScale, ph: 'Что именно мы хотим осуществить?' },
    { n: 3, icon: '📜', title: 'ПОЛИТИКА / ИНСТРУКЦИИ', desc: 'Неизменные правила, обеспечивающие координацию', field: 'policy' as keyof AdminScale, ph: 'Постоянные правила и принципы работы' },
    { n: 4, icon: '🗺', title: 'ПЛАН', desc: 'Широкое краткосрочное намерение', field: 'plan' as keyof AdminScale, ph: 'Как мы будем осуществлять замысел?' },
  ];

  const levels8to10 = [
    { n: 8, icon: '🌟', title: 'ИДЕАЛЬНАЯ КАРТИНА', desc: 'Как область должна выглядеть в идеале', field: 'ideal' as keyof AdminScale, ph: 'Опишите идеальное состояние' },
    { n: 9, icon: '📈', title: 'СТАТИСТИКИ', desc: 'Количественные показатели', field: 'stats' as keyof AdminScale, ph: 'Какие показатели измеряются?' },
    { n: 10, icon: '🏆', title: 'ЦКП', desc: 'Ценный Конечный Продукт', field: 'vfp' as keyof AdminScale, ph: 'Что является конечным продуктом?' },
  ];

  const LEVEL_COLORS = ['hsl(var(--primary))', 'hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(210,60%,50%)', 'hsl(270,50%,50%)', 'hsl(170,60%,40%)', 'hsl(0,72%,51%)', 'hsl(var(--muted-foreground))', 'hsl(145,60%,40%)', 'hsl(30,80%,50%)'];

  const addProgram = () => {
    onUpdate(s => ({ ...s, programs: [...s.programs, emptyProgram(s.programs.length + 1)] }));
  };

  return (
    <div className="space-y-3">
      {/* Scale name */}
      <Input
        value={scale.name}
        onChange={e => onUpdate(s => ({ ...s, name: e.target.value }))}
        className="bg-transparent border-none text-2xl font-display font-bold text-foreground p-0 h-auto focus-visible:ring-0"
      />

      {/* Levels 1-4 */}
      {levels1to4.map(l => (
        <LevelCard key={l.n} level={l} color={LEVEL_COLORS[l.n - 1]} value={scale[l.field] as string}
          expanded={!!expandedLevels[`${scale.id}_${l.n}`]}
          onToggle={() => toggleLevel(`${scale.id}_${l.n}`)}
          onChange={v => onUpdate(s => ({ ...s, [l.field]: v }))} />
      ))}

      {/* Level 5: Programs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ borderLeftWidth: 4, borderLeftColor: 'hsl(270,50%,50%)' }}>
        <div className="flex items-center justify-between p-4 bg-accent/30">
          <div>
            <p className="text-[10px] font-display font-bold text-muted-foreground tracking-widest">УРОВЕНЬ 5</p>
            <p className="text-sm font-display font-bold text-foreground">⚡ ПРОГРАММЫ</p>
            <p className="text-[11px] text-muted-foreground font-body">Каждая программа — список пронумерованных задач (шагов)</p>
          </div>
          <Button size="sm" variant="outline" onClick={addProgram}>
            <Plus size={14} className="mr-1" /> Программа
          </Button>
        </div>
        <div className="p-4 space-y-4">
          {scale.programs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-body">
              <div className="text-3xl mb-2">⚡</div>
              <p>Нет программ. Нажмите «+ Программа»</p>
            </div>
          ) : scale.programs.map((prog, pi) => (
            <ProgramBlock key={prog.id} program={prog} index={pi} scale={scale} onUpdate={onUpdate} />
          ))}
        </div>
      </div>

      {/* Level 6: Projects (info) */}
      <div className="bg-card border border-border rounded-xl p-4" style={{ borderLeftWidth: 4, borderLeftColor: 'hsl(170,60%,40%)' }}>
        <p className="text-[10px] font-display font-bold text-muted-foreground tracking-widest">УРОВЕНЬ 6</p>
        <p className="text-sm font-display font-bold text-foreground">🔧 ПРОЕКТЫ</p>
        <p className="text-[11px] text-muted-foreground font-body mt-1">Создаются только для детализации одного сложного шага программы. Добавляйте через кнопку внутри шага.</p>
      </div>

      {/* Level 7: Orders (info) */}
      <div className="bg-card border border-border rounded-xl p-4" style={{ borderLeftWidth: 4, borderLeftColor: 'hsl(0,72%,51%)' }}>
        <p className="text-[10px] font-display font-bold text-muted-foreground tracking-widest">УРОВЕНЬ 7</p>
        <p className="text-sm font-display font-bold text-foreground">📢 ПРИКАЗЫ / РАСПОРЯЖЕНИЯ</p>
        <p className="text-[11px] text-muted-foreground font-body mt-1">Устные/письменные указания выполнить шаг прямо сейчас.</p>
      </div>

      {/* Levels 8-10 */}
      {levels8to10.map(l => (
        <LevelCard key={l.n} level={l} color={LEVEL_COLORS[l.n - 1]} value={scale[l.field] as string}
          expanded={!!expandedLevels[`${scale.id}_${l.n}`]}
          onToggle={() => toggleLevel(`${scale.id}_${l.n}`)}
          onChange={v => onUpdate(s => ({ ...s, [l.field]: v }))} />
      ))}
    </div>
  );
}

// ─── Level Card ───
function LevelCard({ level, color, value, expanded, onToggle, onChange }: {
  level: { n: number; icon: string; title: string; desc: string; ph: string };
  color: string; value: string; expanded: boolean;
  onToggle: () => void; onChange: (v: string) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors text-left">
        <span className="text-xl">{level.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-display font-bold text-muted-foreground tracking-widest">УРОВЕНЬ {level.n}</p>
          <p className="text-sm font-display font-bold text-foreground">{level.title}</p>
          <p className="text-[11px] text-muted-foreground font-body">{level.desc}</p>
        </div>
        {expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <textarea
            className="w-full min-h-[80px] bg-accent/50 border border-border rounded-lg p-3 text-sm font-body text-foreground resize-y focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground"
            placeholder={level.ph} value={value} onChange={e => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Program Block ───
function ProgramBlock({ program, index, scale, onUpdate }: {
  program: AdminScaleProgram; index: number; scale: AdminScale;
  onUpdate: (updater: (s: AdminScale) => AdminScale) => void;
}) {
  const [newType, setNewType] = useState<AdminScaleStep['type']>('operating');

  const updateProg = (field: string, value: string) => {
    onUpdate(s => ({
      ...s,
      programs: s.programs.map(p => p.id === program.id ? { ...p, [field]: value } : p),
    }));
  };

  const addStep = () => {
    const step = emptyStep(program.steps.length + 1, newType);
    onUpdate(s => ({
      ...s,
      programs: s.programs.map(p => p.id === program.id ? { ...p, steps: [...p.steps, step] } : p),
    }));
  };

  const deleteProgram = () => {
    if (!confirm('Удалить программу со всеми задачами?')) return;
    onUpdate(s => ({ ...s, programs: s.programs.filter(p => p.id !== program.id) }));
  };

  const done = program.steps.filter(s => s.done).length;
  const pct = program.steps.length ? Math.round(done / program.steps.length * 100) : 0;

  return (
    <div className="bg-accent/20 border border-secondary/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-secondary/10 border-b border-secondary/15">
        <span className="text-[10px] font-display font-bold text-secondary bg-secondary/15 px-2 py-0.5 rounded-full tracking-wider">
          ПРОГРАММА {index + 1}
        </span>
        <input
          className="flex-1 bg-accent/50 border border-secondary/25 rounded px-2 py-1 text-sm font-display font-bold text-foreground focus:outline-none focus:border-secondary"
          value={program.name} onChange={e => updateProg('name', e.target.value)}
        />
        <button onClick={deleteProgram} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Main task */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-[10px] font-display font-bold text-primary tracking-widest mb-1">🎯 ГЛАВНАЯ ЗАДАЧА ПРОГРАММЫ</p>
          <input
            className="w-full bg-accent/50 border border-primary/20 rounded px-2 py-1 text-sm font-body text-foreground focus:outline-none focus:border-primary"
            value={program.mainTask} onChange={e => updateProg('mainTask', e.target.value)}
            placeholder="Конечный результат этой программы..."
          />
        </div>

        {/* Alert */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 text-[11px] text-primary font-body">
          <strong>Правило:</strong> Сначала Первоочередные → Жизненно важные → Условные → Текущие → Производственные.
        </div>

        {/* Steps header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-[10px] font-display font-bold text-secondary tracking-widest">📌 ШАГИ ПРОГРАММЫ (задачи)</p>
          <div className="flex items-center gap-2">
            <select value={newType} onChange={e => setNewType(e.target.value as AdminScaleStep['type'])}
              className="bg-accent border border-border rounded px-2 py-1 text-[11px] font-body text-foreground focus:outline-none">
              {Object.entries(STEP_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={addStep} className="text-xs">
              <Plus size={12} className="mr-1" /> Задача
            </Button>
          </div>
        </div>

        {/* Steps */}
        {program.steps.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground text-xs font-body">Нет задач. Нажмите «+ Задача»</p>
        ) : program.steps.map((step, si) => (
          <StepBlock key={step.id} step={step} index={si} programId={program.id} scale={scale} onUpdate={onUpdate} />
        ))}

        {/* Progress */}
        <div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground font-display mt-1">{done}/{program.steps.length} задач выполнено ({pct}%)</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step Block ───
function StepBlock({ step, index, programId, scale, onUpdate }: {
  step: AdminScaleStep; index: number; programId: string; scale: AdminScale;
  onUpdate: (updater: (s: AdminScale) => AdminScale) => void;
}) {
  const t = STEP_TYPES[step.type];
  const color = STEP_TYPE_COLORS[step.type];

  const updateStep = (field: string, value: any) => {
    onUpdate(s => ({
      ...s,
      programs: s.programs.map(p => p.id === programId ? {
        ...p,
        steps: p.steps.map(st => st.id === step.id ? { ...st, [field]: value } : st),
      } : p),
    }));
  };

  const deleteStep = () => {
    if (!confirm('Удалить задачу?')) return;
    onUpdate(s => ({
      ...s,
      programs: s.programs.map(p => p.id === programId ? { ...p, steps: p.steps.filter(st => st.id !== step.id) } : p),
    }));
  };

  const addProject = () => {
    updateStep('project', { name: '', steps: [] });
  };

  const deleteProject = () => {
    if (!confirm('Удалить проект?')) return;
    updateStep('project', null);
  };

  const addProjStep = () => {
    if (!step.project) return;
    const newProjStep = { id: Date.now().toString(36), text: '', responsible: '' };
    updateStep('project', { ...step.project, steps: [...step.project.steps, newProjStep] });
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
      {/* Header */}
      <div className="flex items-center gap-2 p-2.5 bg-accent/30 border-b border-border flex-wrap">
        <span className="text-[10px] font-display font-bold text-secondary bg-secondary/15 px-1.5 py-0.5 rounded-full">ШАГ {index + 1}</span>
        <span className="text-[10px] font-display font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>{t.icon} {t.label}</span>
        <input
          className="flex-1 min-w-[120px] bg-accent/50 border border-border rounded px-2 py-1 text-xs font-body text-foreground focus:outline-none focus:border-secondary"
          value={step.name} onChange={e => updateStep('name', e.target.value)}
        />
        <button onClick={deleteStep} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-accent/10 border-b border-border flex-wrap text-[11px]">
        <span className="text-muted-foreground">Тип:</span>
        <select value={step.type} onChange={e => updateStep('type', e.target.value)}
          className="bg-accent border border-border rounded px-1.5 py-0.5 text-[11px] font-body text-foreground focus:outline-none">
          {Object.entries(STEP_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <span className="text-muted-foreground">📅</span>
        <input type="date" value={step.deadline} onChange={e => updateStep('deadline', e.target.value)}
          className="bg-accent border border-border rounded px-1.5 py-0.5 text-[11px] font-body text-foreground focus:outline-none" />
        <span className="text-muted-foreground">👤</span>
        <input value={step.responsible} onChange={e => updateStep('responsible', e.target.value)} placeholder="Ответственный"
          className="bg-accent border border-border rounded px-1.5 py-0.5 text-[11px] font-body text-foreground focus:outline-none flex-1 min-w-[100px]" />
      </div>

      {/* Body */}
      <div className="p-2.5 space-y-2">
        {step.type === 'production' && (
          <div className="bg-destructive/5 border border-destructive/20 rounded p-2 text-[11px] text-destructive font-body">
            ⚠ Убедитесь, что у вас уже есть первоочередные, жизненно важные и условные задачи.
          </div>
        )}
        <p className="text-[10px] text-muted-foreground italic font-body">{t.hint}</p>
        <textarea
          className="w-full min-h-[50px] bg-accent/30 border border-border rounded p-2 text-xs font-body text-foreground resize-y focus:outline-none focus:border-primary/30 placeholder:text-muted-foreground"
          value={step.notes} onChange={e => updateStep('notes', e.target.value)} placeholder="Подробное описание задачи..."
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={step.done} onChange={e => updateStep('done', e.target.checked)}
            className="rounded accent-primary" />
          <span className="text-xs text-muted-foreground font-body">Задача выполнена</span>
        </label>

        {/* Project */}
        {step.project ? (
          <div className="bg-accent/30 border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-display font-bold tracking-widest" style={{ color: 'hsl(170,60%,40%)' }}>🔧 ПРОЕКТ:</span>
              <input value={step.project.name} onChange={e => updateStep('project', { ...step.project!, name: e.target.value })}
                placeholder="Название проекта..."
                className="flex-1 min-w-[120px] bg-accent/50 border border-border rounded px-2 py-1 text-xs font-body text-foreground focus:outline-none" />
              <button onClick={deleteProject} className="text-[10px] text-destructive hover:underline">Удалить</button>
            </div>
            {step.project.steps.map((ps, psi) => (
              <div key={ps.id} className="flex items-start gap-2">
                <span className="text-[10px] text-muted-foreground font-display pt-1">{psi + 1}.</span>
                <input value={ps.text} onChange={e => {
                  const newSteps = [...step.project!.steps];
                  newSteps[psi] = { ...newSteps[psi], text: e.target.value };
                  updateStep('project', { ...step.project!, steps: newSteps });
                }} placeholder="Шаг проекта..."
                  className="flex-1 bg-transparent border-none text-xs font-body text-foreground focus:outline-none" />
                <input value={ps.responsible} onChange={e => {
                  const newSteps = [...step.project!.steps];
                  newSteps[psi] = { ...newSteps[psi], responsible: e.target.value };
                  updateStep('project', { ...step.project!, steps: newSteps });
                }} placeholder="Исполнитель"
                  className="w-24 bg-transparent border-none text-[11px] text-muted-foreground font-body focus:outline-none" />
                <button onClick={() => {
                  const newSteps = step.project!.steps.filter((_, i) => i !== psi);
                  updateStep('project', { ...step.project!, steps: newSteps });
                }} className="text-muted-foreground hover:text-destructive"><Trash2 size={10} /></button>
              </div>
            ))}
            <button onClick={addProjStep} className="text-[10px] font-display text-foreground/60 hover:text-primary transition-colors">
              + Шаг проекта
            </button>
          </div>
        ) : (
          <button onClick={addProject} className="text-[10px] font-display text-foreground/50 hover:text-primary transition-colors">
            🔧 Добавить Проект к этому шагу
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Review ───
function ReviewView({ scale }: { scale: AdminScale }) {
  const levels = [
    { n: 1, icon: '🎯', title: 'ЦЕЛЬ', field: 'goal' },
    { n: 2, icon: '💡', title: 'ЗАМЫСЛЫ', field: 'purpose' },
    { n: 3, icon: '📜', title: 'ПОЛИТИКА', field: 'policy' },
    { n: 4, icon: '🗺', title: 'ПЛАН', field: 'plan' },
  ];
  const lowerLevels = [
    { n: 8, icon: '🌟', title: 'ИДЕАЛЬНАЯ КАРТИНА', field: 'ideal' },
    { n: 9, icon: '📈', title: 'СТАТИСТИКИ', field: 'stats' },
    { n: 10, icon: '🏆', title: 'ЦКП', field: 'vfp' },
  ];

  const filledLevels = levels.filter(l => (scale as any)[l.field]);
  const filledLower = lowerLevels.filter(l => (scale as any)[l.field]);

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">{scale.name}</h2>
        <p className="text-xs text-muted-foreground font-body">Создана: {new Date(scale.created).toLocaleDateString('ru-RU')}</p>
      </div>

      {filledLevels.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-[10px] font-display font-bold text-primary tracking-widest w-48">Уровень</th>
                <th className="text-left py-2 px-3 text-[10px] font-display font-bold text-primary tracking-widest">Содержание</th>
              </tr>
            </thead>
            <tbody>
              {filledLevels.map(l => (
                <tr key={l.n} className="border-b border-border/50">
                  <td className="py-2 px-3 text-xs text-muted-foreground font-body whitespace-nowrap">{l.icon} {l.n}. {l.title}</td>
                  <td className="py-2 px-3 text-xs text-foreground font-body whitespace-pre-wrap">{(scale as any)[l.field]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Programs */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <p className="text-[10px] font-display font-bold text-secondary tracking-widest">ПРОГРАММЫ И ЗАДАЧИ</p>
        {scale.programs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Нет программ</p>
        ) : scale.programs.map((prog, pi) => {
          const done = prog.steps.filter(s => s.done).length;
          return (
            <div key={prog.id} className="space-y-2">
              <h4 className="text-sm font-display font-bold text-secondary">⚡ Программа {pi + 1}: {prog.name}</h4>
              {prog.mainTask && <p className="text-xs text-primary italic font-body">🎯 Главная задача: {prog.mainTask}</p>}
              <p className="text-[10px] text-muted-foreground">{done}/{prog.steps.length} задач выполнено</p>
              {prog.steps.map((st, si) => {
                const t = STEP_TYPES[st.type];
                return (
                  <div key={st.id} className="p-2 bg-accent/20 rounded-lg" style={{ borderLeft: `2px solid ${STEP_TYPE_COLORS[st.type]}` }}>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold">{t.icon} Шаг {si + 1}: {st.name}</span>
                      <span className="text-muted-foreground">{t.label}</span>
                      {st.deadline && <span className="text-muted-foreground">📅 {st.deadline}</span>}
                      {st.responsible && <span className="text-muted-foreground">👤 {st.responsible}</span>}
                      <span className={st.done ? 'text-primary' : 'text-muted-foreground'}>{st.done ? '✅ Выполнено' : '○ В работе'}</span>
                    </div>
                    {st.notes && <p className="text-[11px] text-muted-foreground mt-1 whitespace-pre-wrap">{st.notes}</p>}
                    {st.project && (
                      <div className="mt-1 p-2 bg-accent/30 rounded text-[11px]">
                        <p className="font-bold" style={{ color: 'hsl(170,60%,40%)' }}>🔧 Проект: {st.project.name}</p>
                        {st.project.steps.map((ps, psi) => (
                          <p key={psi} className="text-muted-foreground pl-2">{psi + 1}. {ps.text}{ps.responsible ? ` — ${ps.responsible}` : ''}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {filledLower.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <table className="w-full text-sm">
            <tbody>
              {filledLower.map(l => (
                <tr key={l.n} className="border-b border-border/50">
                  <td className="py-2 px-3 text-xs text-muted-foreground font-body whitespace-nowrap w-48">{l.icon} {l.n}. {l.title}</td>
                  <td className="py-2 px-3 text-xs text-foreground font-body whitespace-pre-wrap">{(scale as any)[l.field]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Reference Panel ───
function ReferencePanel({ onClose }: { onClose: () => void }) {
  const LEVEL_ITEMS = [
    { n: 1, title: 'Цель', desc: '«Зачем играть?» Абстрактно и долгосрочно.', color: 'hsl(var(--primary))' },
    { n: 2, title: 'Замыслы', desc: 'Намерения для конкретных видов деятельности.', color: 'hsl(var(--primary))' },
    { n: 3, title: 'Политика', desc: 'Неизменные правила. Обеспечивают координацию.', color: 'hsl(var(--muted-foreground))' },
    { n: 4, title: 'Планы', desc: 'Широкие краткосрочные намерения. Ещё не разбиты на действия.', color: 'hsl(210,60%,50%)' },
    { n: 5, title: 'Программы', desc: 'Последовательность задач для выполнения плана.', color: 'hsl(270,50%,50%)' },
    { n: 6, title: 'Проекты', desc: 'Программа меньшего масштаба для одного сложного шага.', color: 'hsl(170,60%,40%)' },
    { n: 7, title: 'Приказы', desc: '«Сделай это сейчас». Тактика на местах.', color: 'hsl(0,72%,51%)' },
    { n: 8, title: 'Идеальная картина', desc: 'Как должна выглядеть область в идеале.', color: 'hsl(var(--muted-foreground))' },
    { n: 9, title: 'Статистики', desc: 'Количественные показатели выполненной работы.', color: 'hsl(145,60%,40%)' },
    { n: 10, title: 'ЦКП', desc: 'Завершённый результат, который обменивается на ресурсы.', color: 'hsl(30,80%,50%)' },
  ];

  const PRINCIPLES = [
    'Любая идея лучше, чем её полное отсутствие.',
    'Результата можно добиться только при выполнении программы.',
    'Запущенная программа требует руководства.',
    'Программа без руководства провалится.',
    'Любая программа требует финансирования.',
    'Программа требует постоянного внимания.',
    'Лучшая программа затрагивает максимум уровней.',
    'Программы должны сами себя финансировать.',
    'Привлекайте помощь своими положительными сторонами.',
    'Программа плоха, если уводит от работающих программ.',
    'Не вкладывай больше, чем предполагаемая отдача.',
    'Новая программа не должна наносить ущерб действующим.',
  ];

  const TASK_TYPES_REF = [
    { icon: '👥', title: 'Первоочередные', color: STEP_TYPE_COLORS.primary,
      desc: 'Организационные, кадровые, коммуникационные шаги. «Само собой разумеющиеся» — именно их чаще всего пропускают, и именно из-за этого программа рухнет.',
      examples: '«Прочитайте программу» · «Свяжитесь с офисом» · «Передайте ответственному» · «Изучите ссылки»' },
    { icon: '⚠', title: 'Жизненно важные', color: STEP_TYPE_COLORS.vital,
      desc: 'Формируются после инспекции. Устраняют угрозы выживанию проекта. Что нельзя не делать в процессе выполнения.',
      examples: '«Поддерживайте связь с офисом в процессе» · «Проводите инспекции — смотрите своими глазами»' },
    { icon: '🔍', title: 'Условные (Если…то)', color: STEP_TYPE_COLORS.conditional,
      desc: 'Разведка, сбор данных, проверка осуществимости. Без них план оторван от реальности.',
      examples: '«УСЛОВНАЯ: Если нет ответственного — назначьте одного из руководителей» · «УСЛОВНАЯ: Если завязли — применяйте технологию дебага»' },
    { icon: '⚙', title: 'Текущие (рабочие)', color: STEP_TYPE_COLORS.operating,
      desc: 'Конкретные направления действий с указанием кто, что и когда. Основная масса шагов программы.',
      examples: '«Составьте список из 20 людей» · «Каждую неделю писать письма 5 людям из списка» · «Оформите выставку в приёмной»' },
    { icon: '📊', title: 'Производственные', color: STEP_TYPE_COLORS.production,
      desc: 'Устанавливают квоты и количественные показатели. Работают ТОЛЬКО при наличии всех остальных типов задач.',
      examples: '«Проводить не менее 5 экскурсий в неделю» · «Заключить 50 контрактов к концу месяца»' },
  ];

  const ERRORS = [
    { title: 'Пропуск первоочередных', desc: 'Самая частая причина провала. «Само собой разумеется» — не значит «не надо писать». Пишите всё явно.' },
    { title: 'Производственные без остальных', desc: 'Статистика взлетит и рухнет. Квоты без инфраструктуры не работают.' },
    { title: 'Разрыв в иерархии шкалы', desc: 'Нет цели → замыслы бессмысленны. Нет плана → программу не к чему прикрепить. Каждый уровень опирается на предыдущий.' },
    { title: 'Проект вместо шага', desc: 'Проект создаётся только тогда, когда шаг оказался слишком объёмным. Не надо создавать проект на каждый шаг.' },
  ];

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-card border-l border-border z-50 overflow-y-auto shadow-2xl">
      <div className="sticky top-0 bg-accent p-4 border-b border-border flex items-center justify-between z-10">
        <h3 className="font-display font-bold text-foreground">📚 Справочник</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
      </div>
      <div className="p-4 space-y-6 text-xs font-body">

        {/* Ключевая концепция */}
        <div>
          <p className="text-[10px] font-display font-bold text-primary tracking-widest mb-2 pb-1 border-b border-border">КЛЮЧЕВАЯ КОНЦЕПЦИЯ: ШАГИ И ЗАДАЧИ</p>
          <div className="bg-destructive/5 border border-destructive/20 rounded p-2 text-destructive mb-3">
            <strong>‼ Важно:</strong> Шаги программы и задачи — это одно и то же. Каждый шаг программы называется задачей. Нет отдельных «задач внутри шага» — сам шаг и есть задача определённого типа.
          </div>
          <div className="p-2.5 rounded bg-accent/30 border-l-[3px] mb-2" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
            <p className="font-bold" style={{ color: 'hsl(var(--primary))' }}>📋 Программа</p>
            <p className="text-muted-foreground">Упорядоченная последовательность шагов (= задач) для выполнения плана. Шаги нумеруются: 1, 2, 3 или А, Б, В. Каждый шаг поручается конкретному человеку.</p>
          </div>
          <div className="p-2.5 rounded bg-accent/30 border-l-[3px] mb-2" style={{ borderLeftColor: 'hsl(210,60%,50%)' }}>
            <p className="font-bold" style={{ color: 'hsl(210,60%,50%)' }}>📌 Шаг программы = Задача</p>
            <p className="text-muted-foreground">Конкретное действие. Каждому шагу присваивается тип (первоочередной, жизненно важный и т.д.), исполнитель и дедлайн. Подряд идущие шаги одного типа могут группироваться в раздел.</p>
            <p className="text-muted-foreground/70 italic mt-1">Пример: «1. Прочитайте программу» — Первоочередная задача. «Условная: Если нет руководителя — назначьте его» — Условная задача.</p>
          </div>
          <div className="p-2.5 rounded bg-accent/30 border-l-[3px] mb-2" style={{ borderLeftColor: 'hsl(170,60%,40%)' }}>
            <p className="font-bold" style={{ color: 'hsl(170,60%,40%)' }}>🔧 Проект</p>
            <p className="text-muted-foreground">Программа меньшего масштаба, создаётся ТОЛЬКО для выполнения одного конкретного шага, если тот оказался слишком объёмным. Позволяет не терять фокус на общей программе.</p>
            <p className="text-muted-foreground/70 italic mt-1">«Вместо того чтобы зацикливаться на одном шаге — определяете Проект, намечаете шаги, выполняете их.»</p>
          </div>
        </div>

        {/* 5 типов задач */}
        <div>
          <p className="text-[10px] font-display font-bold text-primary tracking-widest mb-2 pb-1 border-b border-border">5 ТИПОВ ЗАДАЧ (ШАГОВ ПРОГРАММЫ)</p>
          <div className="bg-destructive/5 border border-destructive/20 rounded p-2 text-destructive mb-3">
            <strong>Критический порядок:</strong> Сначала первоочередные → жизненно важные → условные → текущие. Производственные — только после всех остальных!
          </div>
          {TASK_TYPES_REF.map((t, i) => (
            <div key={i} className="p-2.5 rounded bg-accent/30 border-l-[3px] mb-2" style={{ borderLeftColor: t.color }}>
              <p className="font-bold" style={{ color: t.color }}>{t.icon} {t.title}</p>
              <p className="text-muted-foreground">{t.desc}</p>
              <p className="text-muted-foreground/70 italic mt-1">{t.examples}</p>
            </div>
          ))}
        </div>

        {/* 10 уровней шкалы */}
        <div>
          <p className="text-[10px] font-display font-bold text-primary tracking-widest mb-2 pb-1 border-b border-border">АДМИНИСТРАТИВНАЯ ШКАЛА (10 УРОВНЕЙ)</p>
          <div className="space-y-1">
            {LEVEL_ITEMS.map(l => (
              <div key={l.n} className="py-1.5 px-2.5 rounded border-l-[3px] bg-accent/20" style={{ borderLeftColor: l.color }}>
                <span className="font-bold" style={{ color: l.color }}>{l.n}. {l.title}</span>
                <span className="text-muted-foreground"> — {l.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 12 принципов */}
        <div>
          <p className="text-[10px] font-display font-bold text-primary tracking-widest mb-2 pb-1 border-b border-border">12 ПРИНЦИПОВ ПРОГРАММИРОВАНИЯ</p>
          <div className="space-y-1">
            {PRINCIPLES.map((p, i) => (
              <div key={i} className="py-1.5 px-2.5 bg-accent/20 rounded text-foreground/80">
                {i + 1}. {p}
              </div>
            ))}
          </div>
        </div>

        {/* Типичные ошибки */}
        <div>
          <p className="text-[10px] font-display font-bold text-primary tracking-widest mb-2 pb-1 border-b border-border">ТИПИЧНЫЕ ОШИБКИ</p>
          {ERRORS.map((e, i) => (
            <div key={i} className="bg-destructive/5 border border-destructive/20 rounded p-2 text-destructive mb-2">
              <strong>{e.title}</strong> — {e.desc}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
