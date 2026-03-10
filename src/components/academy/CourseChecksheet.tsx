import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Save, UserPlus, BookOpen, PenLine, Eye as EyeIcon, Dumbbell, Star, Sparkles, Search, ClipboardCheck, FileQuestion, FileText, AlertTriangle, CheckCircle2, History, RotateCcw, GripVertical, AlertCircle, X, Download, Upload, Library } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  quizQuestions?: { question: string; options: string[]; correctIndex: number }[];
}

const TYPE_META: Record<string, { label: string; icon: typeof BookOpen; color: string; border: string; bg: string }> = {
  read:          { label: 'Прочитать',       icon: BookOpen,      color: 'text-blue-500',    border: 'border-l-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/20' },
  write:         { label: 'Написать',        icon: PenLine,       color: 'text-amber-500',   border: 'border-l-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/20' },
  demo:          { label: 'Демо',            icon: EyeIcon,       color: 'text-emerald-500', border: 'border-l-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  clay_demo:     { label: 'Глиняное демо',   icon: Sparkles,      color: 'text-teal-500',    border: 'border-l-teal-400',    bg: 'bg-teal-50 dark:bg-teal-950/20' },
  drill:         { label: 'Упражнение',      icon: Dumbbell,      color: 'text-purple-500',  border: 'border-l-purple-400',  bg: 'bg-purple-50 dark:bg-purple-950/20' },
  checkout:      { label: 'Чек-аут',         icon: ClipboardCheck, color: 'text-rose-500',   border: 'border-l-rose-400',    bg: 'bg-rose-50 dark:bg-rose-950/20' },
  word_clearing: { label: 'Прояснение слов', icon: Search,        color: 'text-cyan-500',    border: 'border-l-cyan-400',    bg: 'bg-cyan-50 dark:bg-cyan-950/20' },
  starrate:      { label: 'Звёздная оценка', icon: Star,          color: 'text-orange-500',  border: 'border-l-orange-400',  bg: 'bg-orange-50 dark:bg-orange-950/20' },
  quiz:          { label: 'Тест',            icon: FileQuestion,  color: 'text-indigo-500',  border: 'border-l-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
};

// Theory step types (for gradient check)
const THEORY_TYPES = new Set(['read']);
const PRACTICE_TYPES = new Set(['demo', 'clay_demo', 'drill', 'checkout', 'starrate', 'quiz']);

function ChecksheetItemEditor({
  item, idx, totalItems,
  onUpdateItem, onRemoveItem, onToggleFlag,
  isNew, isDragging, isDropTarget,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  item: ChecksheetItem;
  idx: number;
  totalItems: number;
  onUpdateItem: (id: string, field: keyof ChecksheetItem, value: any) => void;
  onRemoveItem: (id: string) => void;
  onToggleFlag: (id: string, flag: 'critical' | 'needsCheckout' | 'starred') => void;
  isNew?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const [expanded, setExpanded] = useState(isNew || false);
  const hasContent = !!(item.content && item.content.replace(/<[^>]*>/g, '').trim());
  const meta = TYPE_META[item.type] || TYPE_META.read;
  const Icon = meta.icon;

  return (
    <div
      className={`bg-card/80 border border-l-4 ${meta.border} rounded-xl overflow-hidden transition-all duration-150 ${isDragging ? 'opacity-40 scale-[0.98]' : ''} ${isDropTarget ? 'ring-2 ring-primary/60 ring-offset-1 shadow-md' : 'hover:shadow-sm'}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 px-2 py-2">
        {/* Drag handle */}
        <div
          className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground/40 hover:text-muted-foreground rounded transition-colors"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <GripVertical size={14} />
        </div>

        <span className="text-[11px] font-display font-bold text-muted-foreground/60 w-5 text-center shrink-0">{idx + 1}</span>

        {/* Type selector */}
        <div className="w-36 shrink-0">
          <Select value={item.type} onValueChange={v => onUpdateItem(item.id, 'type', v as any)}>
            <SelectTrigger className={`h-8 text-xs bg-background border-0 ${meta.color} font-display font-bold`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_META).map(([key, m]) => {
                const MI = m.icon;
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <MI size={12} className={m.color} />
                      {m.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Input
          value={item.title}
          onChange={e => onUpdateItem(item.id, 'title', e.target.value)}
          placeholder="Заголовок шага..."
          className="flex-1 h-8 text-xs bg-background"
        />

        {/* Flags inline */}
        <div className="flex gap-1 shrink-0">
          {item.critical && <span className="text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded font-bold">🔴 Крит</span>}
          {item.needsCheckout && <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded font-bold">✅ Чек-аут</span>}
          {item.starred && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded font-bold">⭐</span>}
        </div>

        {/* Content status */}
        {hasContent ? (
          <span className="text-[10px] font-display font-bold text-primary whitespace-nowrap flex items-center gap-1 shrink-0">
            <CheckCircle2 size={11} />
          </span>
        ) : (
          <span className="text-[10px] font-display font-bold text-destructive/60 whitespace-nowrap flex items-center gap-1 shrink-0">
            <AlertTriangle size={11} />
          </span>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-display font-bold transition-colors shrink-0 ${expanded ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground hover:bg-accent/80'}`}
        >
          <FileText size={11} />
          {expanded ? 'Свернуть' : 'Открыть'}
        </button>

        <button
          onClick={() => onRemoveItem(item.id)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className={`border-t border-border p-4 space-y-4 ${meta.bg}`}>
          {/* Study material */}
          <div>
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1.5">📖 Учебный материал</label>
            {!hasContent && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertTriangle size={13} className="text-destructive shrink-0" />
                <span className="text-[11px] font-body text-muted-foreground">Добавьте учебный материал — студент увидит его в центральной панели</span>
              </div>
            )}
            <RichTextEditor
              content={item.content || ''}
              onChange={html => onUpdateItem(item.id, 'content', html)}
              placeholder="Текст статьи, материал для изучения..."
              minHeight="150px"
            />
          </div>

          {/* Task */}
          <div>
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1.5">📝 Задание для студента</label>
            <p className="text-[10px] text-muted-foreground mb-1.5 font-body">Что именно должен сделать студент? Вопросы, инструкции, критерии выполнения.</p>
            <RichTextEditor
              content={item.task || ''}
              onChange={html => onUpdateItem(item.id, 'task', html)}
              placeholder="Напишите задание: вопросы, что нужно продемонстрировать, описать, выполнить..."
              minHeight="100px"
            />
          </div>

          {/* Quiz editor */}
          {item.type === 'quiz' && (
            <QuizQuestionEditor
              questions={item.quizQuestions || []}
              onChange={(qs) => onUpdateItem(item.id, 'quizQuestions' as any, qs as any)}
            />
          )}

          {/* Flags */}
          <div className="flex items-center gap-4 flex-wrap pt-1 border-t border-border/50">
            <label className="flex items-center gap-1.5 text-[10px] font-display cursor-pointer select-none">
              <input type="checkbox" checked={item.critical || false} onChange={() => onToggleFlag(item.id, 'critical')} className="rounded" />
              <span className="text-destructive font-bold">🔴 Критический шаг</span>
            </label>
            <label className="flex items-center gap-1.5 text-[10px] font-display cursor-pointer select-none">
              <input type="checkbox" checked={item.needsCheckout || false} onChange={() => onToggleFlag(item.id, 'needsCheckout')} className="rounded" />
              <span className="font-bold text-rose-600">✅ Нужен чек-аут</span>
            </label>
            <label className="flex items-center gap-1.5 text-[10px] font-display cursor-pointer select-none">
              <input type="checkbox" checked={item.starred || false} onChange={() => onToggleFlag(item.id, 'starred')} className="rounded" />
              <span className="text-amber-600 font-bold">⭐ Звёздочный пункт</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  courseId: string;
  onBack: () => void;
}

export function CourseChecksheet({ courseId, onBack }: Props) {
  const qc = useQueryClient();
  const [items, setItems] = useState<ChecksheetItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isHst, setIsHst] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

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
      setItems(secs.sort((a, b) => a.order - b.order));
    }
  }, [course]);

  // Gradient warning: 3+ consecutive theory steps without practice
  const gradientWarnings = useMemo(() => {
    const warnings: number[] = [];
    let theoryRun = 0;
    let startIdx = 0;
    for (let i = 0; i < items.length; i++) {
      if (THEORY_TYPES.has(items[i].type)) {
        if (theoryRun === 0) startIdx = i;
        theoryRun++;
        if (theoryRun >= 3) {
          if (!warnings.includes(startIdx)) warnings.push(i);
        }
      } else if (PRACTICE_TYPES.has(items[i].type)) {
        theoryRun = 0;
      }
    }
    return new Set(warnings);
  }, [items]);

  const hasGradientIssue = gradientWarnings.size > 0;

  const handleExportJSON = () => {
    const payload = { title, description, items: items.map((it, i) => ({ ...it, order: i + 1 })) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'checksheet'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Чекшит экспортирован');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (Array.isArray(json.items)) {
          const imported = json.items.map((it: any, i: number) => ({
            ...it,
            id: it.id || crypto.randomUUID(),
            order: i + 1,
          }));
          setItems(imported);
          if (json.title) setTitle(json.title);
          if (json.description) setDescription(json.description);
          toast.success(`Импортировано ${imported.length} шагов`);
        } else {
          toast.error('Неверный формат JSON');
        }
      } catch {
        toast.error('Ошибка парсинга JSON');
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = '';
  };

  const handleSaveAsTemplate = async () => {
    const { error } = await supabase.from('checksheet_templates').insert({
      title,
      description,
      sections: items.map((it, i) => ({ ...it, order: i + 1 })),
    });
    if (error) toast.error(error.message);
    else { toast.success('Шаблон сохранён'); setShowTemplates(false); }
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const ordered = items.map((it, i) => ({ ...it, order: i + 1 }));
      const nextVersion = (versions?.length ?? 0) + 1;
      await supabase.from('course_versions').insert({
        course_id: courseId,
        version_number: nextVersion,
        title: course?.title || title,
        description: course?.description || description,
        sections: (course?.sections || []) as any,
        is_hst_course: course?.is_hst_course || false,
        duration_hours: course?.duration_hours,
        change_note: `Версия ${nextVersion}`,
      });
      const { error } = await supabase.from('courses').update({
        title, description: description || null, is_hst_course: isHst,
        sections: ordered as any,
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
      const version = versions?.find(v => v.id === versionId);
      if (!version) throw new Error('Версия не найдена');
      const { error } = await supabase.from('courses').update({
        title: version.title, description: version.description,
        sections: version.sections as any, is_hst_course: version.is_hst_course,
        duration_hours: version.duration_hours,
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
      setShowAssign(false);
      setSelectedEmployees([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addItem = () => {
    const id = crypto.randomUUID();
    setNewItemId(id);
    setItems(prev => [...prev, { id, order: prev.length + 1, type: 'read', title: '', content: '', critical: false, needsCheckout: false, starred: false }]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));
  const toggleFlag = (id: string, flag: 'critical' | 'needsCheckout' | 'starred') =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [flag]: !it[flag] } : it));
  const updateItem = (id: string, field: keyof ChecksheetItem, value: any) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  const handleGenerated = (generated: ChecksheetItem[]) => {
    if (items.length > 0 && items.some(it => it.title.trim())) {
      if (!confirm('Существующие пункты будут заменены. Продолжить?')) return;
    }
    setItems(generated);
  };

  // Drag-and-drop handlers
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDropIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDropIdx(null); return; }
    const newItems = [...items];
    const [dragged] = newItems.splice(dragIdx, 1);
    newItems.splice(idx, 0, dragged);
    setItems(newItems);
    setDragIdx(null);
    setDropIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDropIdx(null); };

  const assignedIds = new Set(existingProgress?.map(p => p.employee_id) || []);
  const unassignedEmployees = employees?.filter(e => !assignedIds.has(e.id)) || [];
  const previewItem = items[previewIdx];

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-display font-bold text-foreground truncate">{title || 'Контрольный лист'}</h1>
          <p className="text-[11px] text-muted-foreground font-body">
            <span className="inline-flex items-center gap-1 mr-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block" />{items.length} шагов</span>
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 inline-block" />{assignedIds.size} назначено</span>
          </p>
        </div>

        {/* Toolbar group */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => { setPreviewMode(!previewMode); if (!previewMode) setPreviewIdx(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 transition-all ${previewMode ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border text-muted-foreground hover:bg-accent'}`}
          >
            <EyeIcon size={13} /> {previewMode ? 'Редактор' : 'Превью'}
          </button>
          <button onClick={handleExportJSON} className="px-2.5 py-1.5 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1" title="Экспорт в JSON">
            <Download size={13} /> <span className="hidden sm:inline">JSON</span>
          </button>
          <button onClick={() => importRef.current?.click()} className="px-2.5 py-1.5 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1" title="Импорт из JSON">
            <Upload size={13} /> <span className="hidden sm:inline">Импорт</span>
          </button>
          <button onClick={() => setShowTemplates(!showTemplates)} className={`px-2.5 py-1.5 border rounded-lg text-xs font-display font-bold flex items-center gap-1 transition-all ${showTemplates ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`} title="Шаблоны">
            <Library size={13} /> <span className="hidden sm:inline">Шаблоны</span>
          </button>
          <button onClick={() => setShowHistory(!showHistory)} className={`px-2.5 py-1.5 border rounded-lg text-xs font-display font-bold flex items-center gap-1 transition-all ${showHistory ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            <History size={13} /> <span className="hidden sm:inline">Версии</span>{versions?.length ? <span className="ml-0.5 text-[9px] bg-muted rounded-full px-1">{versions.length}</span> : ''}
          </button>
          <button onClick={() => setShowAssign(true)} className="px-2.5 py-1.5 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1">
            <UserPlus size={13} /> <span className="hidden sm:inline">Назначить</span>
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
          >
            <Save size={13} /> Сохранить
          </button>
        </div>
      </div>

      {/* Gradient warning */}
      {hasGradientIssue && (
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-display font-bold text-amber-700 dark:text-amber-400">Слишком крутой градиент сложности</p>
            <p className="text-[11px] text-muted-foreground font-body mt-0.5">
              3 или более шагов «Прочитать» подряд без демонстрации или упражнения. Добавьте шаг типа «Демо», «Упражнение» или «Тест» для снятия барьера «отсутствия массы».
            </p>
          </div>
        </div>
      )}

      {/* Templates panel */}
      {showTemplates && (
        <TemplatesPanel
          onClose={() => setShowTemplates(false)}
          onSaveAsTemplate={handleSaveAsTemplate}
          onLoadTemplate={(tpl) => {
            setItems(tpl.sections.map((s: any, i: number) => ({ ...s, id: s.id || crypto.randomUUID(), order: i + 1 })));
            toast.success(`Шаблон «${tpl.title}» загружен`);
            setShowTemplates(false);
          }}
        />
      )}

      {/* Version history */}
      {showHistory && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2"><History size={16} /> История версий</h3>
            <button onClick={() => setShowHistory(false)} className="text-xs text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
          {(!versions || versions.length === 0) ? (
            <p className="text-xs text-muted-foreground font-body text-center py-4">Версия создаётся при каждом сохранении.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {versions.map(v => {
                const sectionCount = Array.isArray(v.sections) ? (v.sections as any[]).length : 0;
                return (
                  <div key={v.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-display font-bold text-primary shrink-0">v{v.version_number}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display font-semibold text-foreground truncate">{v.title}</p>
                      <p className="text-[10px] text-muted-foreground">{sectionCount} пунктов • {new Date(v.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button
                      onClick={() => { if (confirm(`Восстановить версию ${v.version_number}?`)) restoreVersionMut.mutate(v.id); }}
                      className="px-2 py-1 border border-border rounded text-[10px] font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw size={10} /> Откатить
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Course meta */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Название курса</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-background" />
          </div>
          <div className="flex items-center gap-4 pt-5">
            <label className="flex items-center gap-2 text-xs font-display cursor-pointer">
              <Switch checked={isHst} onCheckedChange={setIsHst} />
              HST курс
            </label>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Описание</label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="bg-background resize-none" />
        </div>
      </div>

      {/* PREVIEW MODE */}
      {previewMode && items.length > 0 ? (
        <div className="grid grid-cols-[220px_1fr] gap-0 border border-border rounded-xl overflow-hidden" style={{ minHeight: '70vh' }}>
          {/* Sidebar */}
          <div className="bg-card border-r border-border flex flex-col">
            <div className="p-3 border-b border-border">
              <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Превью студента</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {items.map((item, idx) => {
                const meta = TYPE_META[item.type] || TYPE_META.read;
                const Icon = meta.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPreviewIdx(idx)}
                    className={`w-full text-left p-3 flex items-start gap-2 border-b border-border/50 border-l-2 transition-colors ${idx === previewIdx ? `bg-primary/5 border-l-primary` : 'border-l-transparent hover:bg-accent/50'}`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-border`}>
                      <span className="text-[10px] text-muted-foreground">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body leading-tight text-foreground truncate">{item.title || 'Без заголовка'}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Icon size={10} className={meta.color} />
                        <span className="text-[10px] text-muted-foreground">{meta.label}</span>
                      </div>
                      <div className="flex gap-0.5 mt-0.5">
                        {item.critical && <span className="text-[8px] text-destructive">🔴</span>}
                        {item.starred && <span className="text-[8px] text-amber-500">⭐</span>}
                        {item.needsCheckout && <span className="text-[8px] text-rose-500">✅</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview content */}
          {previewItem ? (
            <div className="flex flex-col">
              <div className="p-6 border-b border-border bg-background">
                <div className="flex items-center gap-2 mb-3">
                  {(() => { const m = TYPE_META[previewItem.type] || TYPE_META.read; const I = m.icon; return <I size={16} className={m.color} />; })()}
                  <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider">{TYPE_META[previewItem.type]?.label}</span>
                  <span className="text-[10px] text-muted-foreground">• Шаг {previewIdx + 1} из {items.length}</span>
                  {previewItem.critical && <span className="text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded font-bold">Критический</span>}
                  {previewItem.starred && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded font-bold">⭐ Звёздочный</span>}
                  {previewItem.needsCheckout && <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded font-bold">✅ Чек-аут</span>}
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-4">{previewItem.title || 'Без заголовка'}</h2>
                {previewItem.content && previewItem.content.replace(/<[^>]*>/g, '').trim() ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed">
                    <RichTextViewer content={previewItem.content} />
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground/40">
                    <BookOpen size={28} className="mx-auto mb-2" />
                    <p className="text-sm font-body">Материал не добавлен</p>
                  </div>
                )}
              </div>
              <div className="p-5 bg-card">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase mb-3">Задание и действия</p>
                {previewItem.task && previewItem.task.replace(/<[^>]*>/g, '').trim() && (
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl prose prose-sm dark:prose-invert max-w-none mb-4">
                    <RichTextViewer content={previewItem.task} />
                  </div>
                )}
                <div className="w-full px-6 py-3 bg-primary/20 text-primary rounded-xl font-display font-bold text-sm text-center cursor-not-allowed opacity-60">
                  ✓ Выполнено (превью — кнопка недоступна)
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* EDITOR MODE */
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-display font-bold text-foreground">
              Пункты контрольного листа
              <span className="ml-2 text-xs font-normal text-muted-foreground">({items.length})</span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGenerate(true)}
                className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-accent/80"
              >
                <Sparkles size={14} /> Сгенерировать с ИИ
              </button>
              <button
                onClick={addItem}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-primary/20"
              >
                <Plus size={14} /> Добавить шаг
              </button>
            </div>
          </div>

          {items.length === 0 && (
            <div className="bg-card/50 border border-dashed border-border/60 rounded-2xl p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
                <FileQuestion size={24} className="text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground font-body">Добавьте шаги или сгенерируйте чекшит с ИИ</p>
            </div>
          )}

          {items.map((item, idx) => (
            <ChecksheetItemEditor
              key={item.id}
              item={item}
              idx={idx}
              totalItems={items.length}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onToggleFlag={toggleFlag}
              isNew={item.id === newItemId}
              isDragging={dragIdx === idx}
              isDropTarget={dropIdx === idx && dragIdx !== idx}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}

      {/* Assign modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAssign(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-foreground">Назначить курс сотрудникам</h3>
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
                    <span className="font-body text-foreground">{emp.full_name}</span>
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
        <GenerateChecksheetModal courseTitle={title} onGenerated={handleGenerated} onClose={() => setShowGenerate(false)} />
      )}
    </div>
  );
}

// ─── Templates Panel ───────────────────────────────────────────────────────────
function TemplatesPanel({
  onClose,
  onSaveAsTemplate,
  onLoadTemplate,
}: {
  onClose: () => void;
  onSaveAsTemplate: () => void;
  onLoadTemplate: (tpl: any) => void;
}) {
  const { data: templates, refetch } = useQuery({
    queryKey: ['checksheet-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checksheet_templates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
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
        <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2"><Library size={16} /> Библиотека шаблонов</h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground"><X size={14} /></button>
      </div>
      <button
        onClick={async () => { await onSaveAsTemplate(); refetch(); }}
        className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5"
      >
        <Download size={14} /> Сохранить текущий как шаблон
      </button>
      {(!templates || templates.length === 0) ? (
        <p className="text-xs text-muted-foreground font-body text-center py-4">Нет сохранённых шаблонов</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {templates.map((tpl: any) => {
            const count = Array.isArray(tpl.sections) ? tpl.sections.length : 0;
            return (
              <div key={tpl.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-display font-semibold text-foreground truncate">{tpl.title}</p>
                  <p className="text-[10px] text-muted-foreground">{count} шагов • {new Date(tpl.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
                <button
                  onClick={() => onLoadTemplate(tpl)}
                  className="px-2 py-1 border border-border rounded text-[10px] font-display font-bold text-muted-foreground hover:bg-accent shrink-0"
                >
                  Загрузить
                </button>
                <button
                  onClick={() => { if (confirm('Удалить шаблон?')) deleteTpl.mutate(tpl.id); }}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
