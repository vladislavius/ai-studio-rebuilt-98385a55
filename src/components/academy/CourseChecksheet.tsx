import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArrowLeft, Plus, Trash2, Save, UserPlus, BookOpen, PenLine,
  Eye as EyeIcon, Dumbbell, Star, Sparkles, Search, ClipboardCheck,
  FileQuestion, AlertTriangle, CheckCircle2, History, RotateCcw,
  GripVertical, AlertCircle, X, Download, Upload, Library,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { GenerateChecksheetModal } from './GenerateChecksheetModal';
import { RichTextEditor, RichTextViewer } from './RichTextEditor';
import { QuizQuestionEditor } from './QuizQuestionEditor';

interface ChecksheetItem {
  id: string;
  order: number;
  type: 'read' | 'write' | 'demo' | 'drill' | 'starrate' | 'clay_demo' | 'checkout' | 'word_clearing' | 'quiz';
  title: string;
  content: string;
  task?: string;
  critical?: boolean;
  needsCheckout?: boolean;
  starred?: boolean;
  quizQuestions?: { question: string; options: string[]; correctIndex: number; correctIndices?: number[]; multiSelect?: boolean }[];
}

const TYPE_META: Record<string, { label: string; icon: typeof BookOpen; color: string; chip: string; border: string; bg: string }> = {
  read:          { label: 'Прочитать',       icon: BookOpen,       color: 'text-blue-500',    chip: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',    border: 'border-l-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/20' },
  write:         { label: 'Написать',        icon: PenLine,        color: 'text-amber-500',   chip: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',   border: 'border-l-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/20' },
  demo:          { label: 'Демо',            icon: EyeIcon,        color: 'text-emerald-500', chip: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  clay_demo:     { label: 'Пластилиновое демо',   icon: Sparkles,       color: 'text-teal-500',    chip: 'bg-teal-500/12 text-teal-600 dark:text-teal-400',    border: 'border-l-teal-400',    bg: 'bg-teal-50 dark:bg-teal-950/20' },
  drill:         { label: 'Упражнение',      icon: Dumbbell,       color: 'text-purple-500',  chip: 'bg-purple-500/12 text-purple-600 dark:text-purple-400',  border: 'border-l-purple-400',  bg: 'bg-purple-50 dark:bg-purple-950/20' },
  checkout:      { label: 'Чек-аут',         icon: ClipboardCheck, color: 'text-rose-500',    chip: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',    border: 'border-l-rose-400',    bg: 'bg-rose-50 dark:bg-rose-950/20' },
  word_clearing: { label: 'Прояснение',      icon: Search,         color: 'text-cyan-500',    chip: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-400',    border: 'border-l-cyan-400',    bg: 'bg-cyan-50 dark:bg-cyan-950/20' },
  starrate:      { label: 'Оценка',          icon: Star,           color: 'text-orange-500',  chip: 'bg-orange-500/12 text-orange-600 dark:text-orange-400',  border: 'border-l-orange-400',  bg: 'bg-orange-50 dark:bg-orange-950/20' },
  quiz:          { label: 'Тест',            icon: FileQuestion,   color: 'text-indigo-500',  chip: 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-400',  border: 'border-l-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
};

const THEORY_TYPES = new Set(['read']);
const PRACTICE_TYPES = new Set(['demo', 'clay_demo', 'drill', 'checkout', 'starrate', 'quiz']);

// ─── Visual Type Picker ───────────────────────────────────────────────────────
function TypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Object.entries(TYPE_META).map(([key, m]) => {
        const Icon = m.icon;
        const sel = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-display font-bold transition-all ${
              sel ? `${m.chip} border-current shadow-sm` : 'border-border text-muted-foreground hover:bg-accent/60 hover:border-border/80'
            }`}
          >
            <Icon size={13} className={sel ? m.color : 'text-muted-foreground/50'} />
            <span className={sel ? m.color : ''}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step List Item ───────────────────────────────────────────────────────────
function StepListItem({
  item, idx, isSelected, hasGradientWarn,
  isDragging, isDropTarget,
  onSelect, onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  item: ChecksheetItem; idx: number; isSelected: boolean; hasGradientWarn: boolean;
  isDragging: boolean; isDropTarget: boolean;
  onSelect: () => void; onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void; onDrop: () => void; onDragEnd: () => void;
}) {
  const meta = TYPE_META[item.type] || TYPE_META.read;
  const Icon = meta.icon;
  const hasContent = !!(item.content?.replace(/<[^>]*>/g, '').trim());

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none transition-colors border-l-[3px] ${
        isSelected ? 'bg-primary/8 border-l-primary' : 'border-l-transparent hover:bg-accent/50'
      } ${isDragging ? 'opacity-30' : ''} ${isDropTarget ? 'bg-primary/5 border-l-primary/40' : ''}`}
      onClick={onSelect}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        className="opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing shrink-0"
        draggable
        onDragStart={(e) => { e.stopPropagation(); onDragStart(); }}
        onDragEnd={onDragEnd}
      >
        <GripVertical size={13} className="text-muted-foreground" />
      </div>
      <span className="text-[10px] font-display font-bold text-muted-foreground/40 w-5 text-right shrink-0">{idx + 1}</span>
      <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${meta.chip}`}>
        <Icon size={11} />
      </span>
      <span className={`flex-1 min-w-0 text-[11px] font-body leading-snug truncate ${
        isSelected ? 'text-foreground font-medium' : 'text-foreground/75'
      }`}>
        {item.title || <em className="text-muted-foreground/30 not-italic">Без заголовка</em>}
      </span>
      <div className="flex items-center gap-0.5 shrink-0">
        {hasGradientWarn && <AlertTriangle size={9} className="text-amber-500" />}
        {item.critical && <span className="w-1.5 h-1.5 rounded-full bg-destructive/80" />}
        {item.starred && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
        {hasContent
          ? <CheckCircle2 size={10} className="text-emerald-500/60 ml-0.5" />
          : <AlertTriangle size={10} className="text-muted-foreground/20 ml-0.5" />
        }
      </div>
    </div>
  );
}

// ─── Step Detail Editor ───────────────────────────────────────────────────────
function StepDetailEditor({
  item, idx, total, onUpdate, onToggleFlag, onRemove,
}: {
  item: ChecksheetItem; idx: number; total: number;
  onUpdate: (field: keyof ChecksheetItem | string, value: any) => void;
  onToggleFlag: (flag: 'critical' | 'needsCheckout' | 'starred') => void;
  onRemove: () => void;
}) {
  const meta = TYPE_META[item.type] || TYPE_META.read;
  const hasContent = !!(item.content?.replace(/<[^>]*>/g, '').trim());

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky top: step number + title */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border bg-card/40">
        <div className="flex items-center gap-3">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-display font-bold shrink-0 ${meta.chip}`}>
            {idx + 1}
          </span>
          <Input
            value={item.title}
            onChange={e => onUpdate('title', e.target.value)}
            placeholder="Название шага..."
            className="flex-1 h-10 text-[15px] font-display font-semibold bg-transparent border-0 border-b border-transparent focus:border-primary rounded-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"
          />
          <button
            onClick={onRemove}
            className="p-2 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/8 transition-colors shrink-0"
            title="Удалить шаг"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 font-display mt-1.5 pl-12">
          Шаг {idx + 1} из {total} · <span className={meta.color}>{meta.label}</span>
          {item.critical && <span className="text-destructive"> · Критический</span>}
          {item.starred && <span className="text-amber-500"> · Звёздочный</span>}
          {item.needsCheckout && <span className="text-rose-500"> · Чек-аут</span>}
        </p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-7">

          {/* Type picker */}
          <section>
            <p className="text-[10px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-2.5">Тип шага</p>
            <TypePicker value={item.type} onChange={v => onUpdate('type', v)} />
          </section>

          {/* Material */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest">📖 Учебный материал</p>
              {!hasContent && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-display">
                  <AlertTriangle size={10} /> Материал не добавлен
                </span>
              )}
            </div>
            <RichTextEditor
              content={item.content || ''}
              onChange={html => onUpdate('content', html)}
              placeholder="Текст статьи, материал для изучения студентом..."
              minHeight="180px"
            />
          </section>

          {/* Task */}
          <section>
            <p className="text-[10px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">📝 Задание для студента</p>
            <p className="text-[10px] text-muted-foreground/50 font-body mb-2">Что должен сделать? Вопросы, инструкции, критерии выполнения.</p>
            <RichTextEditor
              content={item.task || ''}
              onChange={html => onUpdate('task', html)}
              placeholder="Напишите задание, вопросы, критерии оценки..."
              minHeight="120px"
            />
          </section>

          {/* Quiz editor */}
          {item.type === 'quiz' && (
            <section>
              <p className="text-[10px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-2.5">❓ Вопросы теста</p>
              <QuizQuestionEditor
                questions={item.quizQuestions || []}
                onChange={qs => onUpdate('quizQuestions', qs)}
              />
            </section>
          )}

          {/* Flags */}
          <section className="border-t border-border/50 pt-5">
            <p className="text-[10px] font-display font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">⚙️ Параметры шага</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([
                { flag: 'critical' as const, emoji: '🔴', label: 'Критический', sub: 'Блокирует прогресс', activeClass: 'border-destructive/40 bg-destructive/8 text-destructive' },
                { flag: 'needsCheckout' as const, emoji: '✅', label: 'Нужен чек-аут', sub: 'Проверяет супервизор', activeClass: 'border-rose-500/40 bg-rose-500/8 text-rose-600 dark:text-rose-400' },
                { flag: 'starred' as const, emoji: '⭐', label: 'Звёздочный', sub: 'Ключевой момент', activeClass: 'border-amber-500/40 bg-amber-500/8 text-amber-600 dark:text-amber-400' },
              ]).map(({ flag, emoji, label, sub, activeClass }) => (
                <button
                  key={flag}
                  onClick={() => onToggleFlag(flag)}
                  className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${
                    item[flag] ? activeClass : 'border-border text-muted-foreground hover:bg-accent/60'
                  }`}
                >
                  <span className="text-base shrink-0 leading-tight">{emoji}</span>
                  <div>
                    <p className="text-xs font-display font-bold leading-tight">{label}</p>
                    <p className="text-[10px] font-body opacity-60 mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Panel ────────────────────────────────────────────────────────────
function StepPreview({ item, idx, total }: { item: ChecksheetItem; idx: number; total: number }) {
  const meta = TYPE_META[item.type] || TYPE_META.read;
  const Icon = meta.icon;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-display font-bold ${meta.chip}`}>
            <Icon size={11} /> {meta.label}
          </span>
          <span className="text-[10px] text-muted-foreground font-display">Шаг {idx + 1} / {total}</span>
          {item.critical && <span className="text-[10px] px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-display font-bold">Критический</span>}
          {item.starred && <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-display font-bold">⭐ Звёздочный</span>}
        </div>
        <h2 className="text-xl font-display font-bold text-foreground">{item.title || 'Без заголовка'}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {item.content?.replace(/<[^>]*>/g, '').trim() ? (
          <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed">
            <RichTextViewer content={item.content} />
          </div>
        ) : (
          <div className="text-center py-14 text-muted-foreground/30">
            <BookOpen size={32} className="mx-auto mb-2" />
            <p className="text-sm font-body">Материал не добавлен</p>
          </div>
        )}
        {item.task?.replace(/<[^>]*>/g, '').trim() && (
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="text-[10px] font-display font-bold text-primary/70 uppercase mb-2">📝 Задание</p>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <RichTextViewer content={item.task!} />
            </div>
          </div>
        )}
        <div className="w-full py-3 bg-primary/10 text-primary rounded-xl font-display font-bold text-sm text-center opacity-60 cursor-not-allowed">
          ✓ Выполнено (превью)
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { courseId: string; onBack: () => void; }

export function CourseChecksheet({ courseId, onBack }: Props) {
  const qc = useQueryClient();
  const [items, setItems] = useState<ChecksheetItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isHst, setIsHst] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name, position');
      if (error) throw error;
      return data;
    },
  });

  const { data: existingProgress } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_progress').select('employee_id').eq('course_id', courseId);
      if (error) throw error;
      return data;
    },
  });

  const { data: versions } = useQuery({
    queryKey: ['course-versions', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_versions')
        .select('*').eq('course_id', courseId).order('version_number', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description || '');
      setIsHst(course.is_hst_course || false);
      const secs = Array.isArray(course.sections) ? (course.sections as unknown as ChecksheetItem[]) : [];
      const sorted = secs.sort((a, b) => a.order - b.order);
      setItems(sorted);
      if (sorted.length > 0) setSelectedId(sorted[0].id);
    }
  }, [course]);

  // Gradient warnings
  const gradientWarnings = useMemo(() => {
    const set = new Set<number>();
    let run = 0;
    for (let i = 0; i < items.length; i++) {
      if (THEORY_TYPES.has(items[i].type)) { run++; if (run >= 3) set.add(i); }
      else if (PRACTICE_TYPES.has(items[i].type)) run = 0;
    }
    return set;
  }, [items]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const ordered = items.map((it, i) => ({ ...it, order: i + 1 }));
      const nextVersion = (versions?.length ?? 0) + 1;
      await supabase.from('course_versions').insert({
        course_id: courseId, version_number: nextVersion,
        title: course?.title || title, description: course?.description || description,
        sections: (course?.sections || []) as any, is_hst_course: course?.is_hst_course || false,
        duration_hours: course?.duration_hours, change_note: `Версия ${nextVersion}`,
      });
      const { error } = await supabase.from('courses').update({
        title, description: description || null, is_hst_course: isHst, sections: ordered as any,
      }).eq('id', courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      qc.invalidateQueries({ queryKey: ['course-versions', courseId] });
      toast.success('Контрольный лист сохранён');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreVersionMut = useMutation({
    mutationFn: async (versionId: string) => {
      const v = versions?.find(v => v.id === versionId);
      if (!v) throw new Error('Версия не найдена');
      const { error } = await supabase.from('courses').update({
        title: v.title, description: v.description, sections: v.sections as any,
        is_hst_course: v.is_hst_course, duration_hours: v.duration_hours,
      }).eq('id', courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      toast.success('Версия восстановлена');
      setShowHistory(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMut = useMutation({
    mutationFn: async (empIds: string[]) => {
      const rows = empIds.map(eid => ({ course_id: courseId, employee_id: eid, progress_percent: 0, completed_sections: [] }));
      const { error } = await supabase.from('course_progress').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-progress', courseId] });
      toast.success('Сотрудники назначены');
      setShowAssign(false); setSelectedEmployees([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addItem = useCallback(() => {
    const id = crypto.randomUUID();
    const newItem: ChecksheetItem = { id, order: items.length + 1, type: 'read', title: '', content: '', critical: false, needsCheckout: false, starred: false };
    setItems(prev => [...prev, newItem]);
    setSelectedId(id);
    // Scroll list to bottom after render
    setTimeout(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
  }, [items.length]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(it => it.id !== id);
      if (selectedId === id) setSelectedId(next.length > 0 ? next[Math.max(0, prev.findIndex(it => it.id === id) - 1)]?.id ?? next[0].id : null);
      return next;
    });
  }, [selectedId]);

  const updateItem = useCallback((id: string, field: string, value: any) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  }, []);

  const toggleFlag = useCallback((id: string, flag: 'critical' | 'needsCheckout' | 'starred') => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [flag]: !it[flag] } : it));
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = items.findIndex(it => it.id === selectedId);
    if (e.key === 'ArrowDown' && idx < items.length - 1) { e.preventDefault(); setSelectedId(items[idx + 1].id); }
    if (e.key === 'ArrowUp' && idx > 0) { e.preventDefault(); setSelectedId(items[idx - 1].id); }
  }, [items, selectedId]);

  // Drag-and-drop
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDropIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDropIdx(null); return; }
    const next = [...items];
    const [dragged] = next.splice(dragIdx, 1);
    next.splice(idx, 0, dragged);
    setItems(next);
    setDragIdx(null); setDropIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDropIdx(null); };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ title, description, items: items.map((it, i) => ({ ...it, order: i + 1 })) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title || 'checksheet'}.json`; a.click();
    URL.revokeObjectURL(url); toast.success('Чекшит экспортирован');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (Array.isArray(json.items)) {
          const imported = json.items.map((it: any, i: number) => ({ ...it, id: it.id || crypto.randomUUID(), order: i + 1 }));
          setItems(imported); if (json.title) setTitle(json.title); if (json.description) setDescription(json.description);
          if (imported.length > 0) setSelectedId(imported[0].id);
          toast.success(`Импортировано ${imported.length} шагов`);
        } else toast.error('Неверный формат JSON');
      } catch { toast.error('Ошибка парсинга JSON'); }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = '';
  };

  const handleSaveAsTemplate = async () => {
    const { error } = await (supabase as any).from('checksheet_templates').insert({ title, description, sections: items.map((it, i) => ({ ...it, order: i + 1 })) });
    if (error) toast.error(error.message); else { toast.success('Шаблон сохранён'); setShowTemplates(false); }
  };

  const assignedIds = new Set(existingProgress?.map(p => p.employee_id) || []);
  const unassignedEmployees = employees?.filter(e => !assignedIds.has(e.id)) || [];
  const selectedItem = items.find(it => it.id === selectedId) ?? null;
  const selectedIdx = items.findIndex(it => it.id === selectedId);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm font-body">Загрузка...</div>;

  return (
    <div className="space-y-3">
      {/* ── Header toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap bg-card/60 backdrop-blur-sm border border-border rounded-2xl px-4 py-3">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-display font-bold text-foreground truncate">{title || 'Контрольный лист'}</h1>
          <p className="text-[10px] text-muted-foreground font-body">
            <span className="mr-2">{items.length} шагов</span>
            <span>{assignedIds.size} назначено</span>
            {gradientWarnings.size > 0 && <span className="ml-2 text-amber-500">· {gradientWarnings.size} предупреждений</span>}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setPreviewMode(!previewMode)} className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 transition-all ${previewMode ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'}`}>
            <EyeIcon size={12} /> {previewMode ? 'Редактор' : 'Превью'}
          </button>
          <button onClick={handleExportJSON} className="p-2 border border-border rounded-lg text-muted-foreground hover:bg-accent" title="Экспорт JSON"><Download size={14} /></button>
          <button onClick={() => importRef.current?.click()} className="p-2 border border-border rounded-lg text-muted-foreground hover:bg-accent" title="Импорт JSON"><Upload size={14} /></button>
          <button onClick={() => setShowTemplates(!showTemplates)} className={`p-2 border rounded-lg transition-all ${showTemplates ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`} title="Шаблоны"><Library size={14} /></button>
          <button onClick={() => setShowHistory(!showHistory)} className={`px-2.5 py-1.5 border rounded-lg text-xs font-display font-bold flex items-center gap-1 transition-all ${showHistory ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            <History size={13} /> {versions?.length ? <span className="text-[9px] bg-muted rounded-full px-1 py-0.5">{versions.length}</span> : ''}
          </button>
          <button onClick={() => setShowAssign(true)} className="px-2.5 py-1.5 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1">
            <UserPlus size={13} /> <span className="hidden sm:inline">Назначить</span>
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-primary/90 shadow-sm shadow-primary/20">
            <Save size={13} /> Сохранить
          </button>
        </div>
      </div>

      {/* ── Course meta (collapsible) ── */}
      <div className="bg-card/60 border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowMeta(!showMeta)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
        >
          <span className="text-xs font-display font-bold text-muted-foreground flex items-center gap-2">
            Настройки курса
            {!showMeta && <span className="text-foreground/60 font-normal">{title}</span>}
          </span>
          {showMeta ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>
        {showMeta && (
          <div className="px-4 pb-4 space-y-3 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <div>
                <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Название курса</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-background" />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 text-xs font-display cursor-pointer">
                  <Switch checked={isHst} onCheckedChange={setIsHst} /> HST курс
                </label>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Описание</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="bg-background resize-none text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* ── Panels ── */}
      {showTemplates && (
        <TemplatesPanel
          onClose={() => setShowTemplates(false)}
          onSaveAsTemplate={handleSaveAsTemplate}
          onLoadTemplate={(tpl) => {
            const loaded = tpl.sections.map((s: any, i: number) => ({ ...s, id: s.id || crypto.randomUUID(), order: i + 1 }));
            setItems(loaded);
            if (loaded.length > 0) setSelectedId(loaded[0].id);
            toast.success(`Шаблон «${tpl.title}» загружен`);
            setShowTemplates(false);
          }}
        />
      )}

      {showHistory && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold flex items-center gap-2"><History size={15} /> История версий</h3>
            <button onClick={() => setShowHistory(false)}><X size={14} className="text-muted-foreground" /></button>
          </div>
          {(!versions || versions.length === 0) ? (
            <p className="text-xs text-muted-foreground text-center py-4 font-body">Версия создаётся при каждом сохранении.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {versions.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-display font-bold text-primary shrink-0">v{v.version_number}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-display font-semibold truncate">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground">{Array.isArray(v.sections) ? (v.sections as any[]).length : 0} шагов · {new Date(v.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button onClick={() => { if (confirm(`Восстановить версию ${v.version_number}?`)) restoreVersionMut.mutate(v.id); }} className="px-2 py-1 border border-border rounded text-[10px] font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1 shrink-0">
                    <RotateCcw size={10} /> Откатить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Two-column editor ── */}
      <div
        className="border border-border rounded-2xl overflow-hidden bg-background"
        style={{ minHeight: '72vh', display: 'grid', gridTemplateColumns: '272px 1fr' }}
      >
        {/* Left: step list */}
        <div className="border-r border-border flex flex-col bg-card" onKeyDown={handleKeyDown} tabIndex={0}>
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
            <span className="text-[11px] font-display font-bold text-muted-foreground uppercase tracking-wider">
              Шаги <span className="text-foreground/50">({items.length})</span>
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowGenerate(true)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Сгенерировать с ИИ">
                <Sparkles size={13} />
              </button>
              <button onClick={addItem} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[11px] font-display font-bold">
                <Plus size={12} /> Шаг
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto">
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center mb-2">
                  <FileQuestion size={18} className="text-muted-foreground/30" />
                </div>
                <p className="text-xs text-muted-foreground font-body">Добавьте первый шаг или сгенерируйте с ИИ</p>
                <button onClick={addItem} className="mt-3 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1">
                  <Plus size={12} /> Добавить шаг
                </button>
              </div>
            )}
            {items.map((item, idx) => (
              <StepListItem
                key={item.id}
                item={item}
                idx={idx}
                isSelected={item.id === selectedId}
                hasGradientWarn={gradientWarnings.has(idx)}
                isDragging={dragIdx === idx}
                isDropTarget={dropIdx === idx && dragIdx !== idx}
                onSelect={() => setSelectedId(item.id)}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>

          {gradientWarnings.size > 0 && (
            <div className="shrink-0 px-3 py-2 border-t border-amber-500/20 bg-amber-500/5 flex items-start gap-2">
              <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-body leading-snug">3+ теоретических шага подряд без практики</p>
            </div>
          )}
        </div>

        {/* Right: step editor / preview / empty */}
        <div className="flex flex-col overflow-hidden" style={{ minHeight: '72vh' }}>
          {selectedItem && selectedIdx !== -1 ? (
            previewMode ? (
              <StepPreview item={selectedItem} idx={selectedIdx} total={items.length} />
            ) : (
              <StepDetailEditor
                key={selectedItem.id}
                item={selectedItem}
                idx={selectedIdx}
                total={items.length}
                onUpdate={(field, value) => updateItem(selectedItem.id, field, value)}
                onToggleFlag={(flag) => toggleFlag(selectedItem.id, flag)}
                onRemove={() => removeItem(selectedItem.id)}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
                <FileQuestion size={24} className="text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground font-body mb-1">Выберите шаг слева для редактирования</p>
              <p className="text-xs text-muted-foreground/50 font-body">или добавьте новый шаг</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Assign modal ── */}
      {showAssign && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAssign(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold">Назначить курс сотрудникам</h3>
            {unassignedEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground">Все сотрудники уже назначены</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {unassignedEmployees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer text-sm">
                    <input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={e => {
                      if (e.target.checked) setSelectedEmployees(p => [...p, emp.id]);
                      else setSelectedEmployees(p => p.filter(id => id !== emp.id));
                    }} className="rounded" />
                    <span className="font-body">{emp.full_name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{emp.position}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAssign(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground">Отмена</button>
              <button onClick={() => assignMut.mutate(selectedEmployees)} disabled={selectedEmployees.length === 0} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50">
                Назначить ({selectedEmployees.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerate && (
        <GenerateChecksheetModal
          courseTitle={title}
          onGenerated={(generated) => {
            if (items.length > 0 && items.some(it => it.title.trim())) {
              if (!confirm('Существующие пункты будут заменены. Продолжить?')) return;
            }
            setItems(generated as ChecksheetItem[]);
            if (generated.length > 0) setSelectedId(generated[0].id);
          }}
          onClose={() => setShowGenerate(false)}
        />
      )}
    </div>
  );
}

// ─── Templates Panel ──────────────────────────────────────────────────────────
function TemplatesPanel({ onClose, onSaveAsTemplate, onLoadTemplate }: {
  onClose: () => void; onSaveAsTemplate: () => void; onLoadTemplate: (tpl: any) => void;
}) {
  const { data: templates, refetch } = useQuery({
    queryKey: ['checksheet-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checksheet_templates').select('*').order('created_at', { ascending: false });
      if (error) throw error; return data;
    },
  });

  const deleteTpl = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checksheet_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Шаблон удалён'); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-bold flex items-center gap-2"><Library size={15} /> Библиотека шаблонов</h3>
        <button onClick={onClose}><X size={14} className="text-muted-foreground" /></button>
      </div>
      <button onClick={async () => { await onSaveAsTemplate(); refetch(); }} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5">
        <Download size={13} /> Сохранить текущий как шаблон
      </button>
      {(!templates || templates.length === 0) ? (
        <p className="text-xs text-muted-foreground text-center py-4 font-body">Нет сохранённых шаблонов</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {templates.map((tpl: any) => (
            <div key={tpl.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-semibold truncate">{tpl.title}</p>
                <p className="text-[10px] text-muted-foreground">{Array.isArray(tpl.sections) ? tpl.sections.length : 0} шагов · {new Date(tpl.created_at).toLocaleDateString('ru-RU')}</p>
              </div>
              <button onClick={() => onLoadTemplate(tpl)} className="px-2 py-1 border border-border rounded text-[10px] font-display font-bold text-muted-foreground hover:bg-accent shrink-0">Загрузить</button>
              <button onClick={() => { if (confirm('Удалить шаблон?')) deleteTpl.mutate(tpl.id); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
