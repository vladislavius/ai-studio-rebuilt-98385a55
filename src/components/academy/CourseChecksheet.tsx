import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Save, UserPlus, BookOpen, PenLine, Eye as EyeIcon, Dumbbell, Star, Sparkles, Search, MessageSquare, ClipboardCheck, FileQuestion, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { GenerateChecksheetModal } from './GenerateChecksheetModal';
import { RichTextEditor } from './RichTextEditor';

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

const TYPE_LABELS: Record<string, { label: string; icon: typeof BookOpen }> = {
  read: { label: 'Прочитать', icon: BookOpen },
  write: { label: 'Написать', icon: PenLine },
  demo: { label: 'Демо', icon: EyeIcon },
  clay_demo: { label: 'Глиняное демо', icon: Sparkles },
  drill: { label: 'Упражнение', icon: Dumbbell },
  checkout: { label: 'Чек-аут', icon: ClipboardCheck },
  word_clearing: { label: 'Прояснение слов', icon: Search },
  starrate: { label: 'Звёздная оценка', icon: Star },
  quiz: { label: 'Тест', icon: FileQuestion },
};

function ChecksheetItemEditor({ item, idx, totalItems, onUpdateItem, onMoveItem, onRemoveItem, onToggleFlag, isNew }: {
  item: ChecksheetItem; idx: number; totalItems: number;
  onUpdateItem: (id: string, field: keyof ChecksheetItem, value: string) => void;
  onMoveItem: (index: number, dir: -1 | 1) => void;
  onRemoveItem: (id: string) => void;
  onToggleFlag: (id: string, flag: 'critical' | 'needsCheckout' | 'starred') => void;
  isNew?: boolean;
}) {
  const [expanded, setExpanded] = useState(isNew || false);
  const hasContent = !!(item.content && item.content.replace(/<[^>]*>/g, '').trim());

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4">
        <span className="text-xs font-display font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
        <div className="w-36">
          <Select value={item.type} onValueChange={v => onUpdateItem(item.id, 'type', v)}>
            <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input value={item.title} onChange={e => onUpdateItem(item.id, 'title', e.target.value)} placeholder="Заголовок задания" className="flex-1 h-8 text-xs bg-background" />

        {hasContent ? (
          <span className="flex items-center gap-1 text-[10px] font-display font-bold text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">
            <CheckCircle2 size={12} /> Материал
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-display font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full whitespace-nowrap">
            <AlertTriangle size={12} /> Нет материала
          </span>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-display font-bold transition-colors ${expanded ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground hover:bg-accent/80'}`}
        >
          <FileText size={12} />
          {expanded ? 'Свернуть' : 'Редактировать'}
        </button>

        <div className="flex gap-0.5">
          <button onClick={() => onMoveItem(idx, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-accent text-muted-foreground disabled:opacity-30"><ChevronUp size={14} /></button>
          <button onClick={() => onMoveItem(idx, 1)} disabled={idx === totalItems - 1} className="p-1 rounded hover:bg-accent text-muted-foreground disabled:opacity-30"><ChevronDown size={14} /></button>
          <button onClick={() => onRemoveItem(item.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/20">
          <div>
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Учебный материал (WYSIWYG)</label>
            {!hasContent && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertTriangle size={14} className="text-destructive shrink-0" />
                <span className="text-[11px] font-body text-muted-foreground">Добавьте учебный материал для этого шага — студенты увидят его при прохождении курса</span>
              </div>
            )}
            <RichTextEditor
              content={item.content || ''}
              onChange={html => onUpdateItem(item.id, 'content', html)}
              placeholder="Текст задания, материал для изучения, инструкции..."
              minHeight="150px"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 text-[10px] font-display cursor-pointer">
              <input type="checkbox" checked={item.critical || false} onChange={() => onToggleFlag(item.id, 'critical')} className="rounded" />
              <span className="text-destructive font-bold">🔴 Критический</span>
            </label>
            <label className="flex items-center gap-1.5 text-[10px] font-display cursor-pointer">
              <input type="checkbox" checked={item.needsCheckout || false} onChange={() => onToggleFlag(item.id, 'needsCheckout')} className="rounded" />
              <span className="text-destructive font-bold">✅ Нужен чек-аут</span>
            </label>
            <label className="flex items-center gap-1.5 text-[10px] font-display cursor-pointer">
              <input type="checkbox" checked={item.starred || false} onChange={() => onToggleFlag(item.id, 'starred')} className="rounded" />
              <span className="text-primary font-bold">⭐ Звёздочный</span>
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
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

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

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description || '');
      setIsHst(course.is_hst_course || false);
      const secs = Array.isArray(course.sections) ? (course.sections as unknown as ChecksheetItem[]) : [];
      setItems(secs.sort((a, b) => a.order - b.order));
    }
  }, [course]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const ordered = items.map((it, i) => ({ ...it, order: i + 1 }));
      const { error } = await supabase.from('courses').update({
        title, description: description || null, is_hst_course: isHst,
        sections: ordered as any,
      }).eq('id', courseId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); qc.invalidateQueries({ queryKey: ['course', courseId] }); toast.success('Контрольный лист сохранён'); },
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

  const [newItemId, setNewItemId] = useState<string | null>(null);

  const addItem = () => {
    const id = crypto.randomUUID();
    setNewItemId(id);
    setItems(prev => [...prev, { id, order: prev.length + 1, type: 'read', title: '', content: '', critical: false, needsCheckout: false, starred: false }]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  const toggleFlag = (id: string, flag: 'critical' | 'needsCheckout' | 'starred') => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [flag]: !it[flag] } : it));
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    const newItems = [...items];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setItems(newItems);
  };

  const updateItem = (id: string, field: keyof ChecksheetItem, value: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const handleGenerated = (generated: ChecksheetItem[]) => {
    if (items.length > 0 && items.some(it => it.title.trim())) {
      if (!confirm('Существующие пункты будут заменены. Продолжить?')) return;
    }
    setItems(generated);
  };

  const assignedIds = new Set(existingProgress?.map(p => p.employee_id) || []);
  const unassignedEmployees = employees?.filter(e => !assignedIds.has(e.id)) || [];

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Контрольный лист</h1>
          <p className="text-xs text-muted-foreground font-body">{items.length} пунктов • Назначено: {assignedIds.size} сотр.</p>
        </div>
        <button onClick={() => setShowAssign(true)} className="px-3 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1.5">
          <UserPlus size={14} /> Назначить
        </button>
        <button onClick={() => saveMut.mutate()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5">
          <Save size={14} /> Сохранить
        </button>
      </div>

      {/* Course meta */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Название курса</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-background" />
          </div>
          <div className="flex items-center gap-4 pt-5">
            <label className="flex items-center gap-2 text-xs font-display">
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

      {/* Checksheet items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-display font-bold text-foreground">Пункты контрольного листа</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowGenerate(true)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-accent/80">
              <Sparkles size={14} /> Сгенерировать с ИИ
            </button>
            <button onClick={addItem} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-primary/20">
              <Plus size={14} /> Добавить пункт
            </button>
          </div>
        </div>

        {items.length === 0 && (
          <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground font-body">Добавьте пункты контрольного листа или сгенерируйте с помощью ИИ</p>
          </div>
        )}

        {items.map((item, idx) => (
          <ChecksheetItemEditor
            key={item.id}
            item={item}
            idx={idx}
            totalItems={items.length}
            onUpdateItem={updateItem}
            onMoveItem={moveItem}
            onRemoveItem={removeItem}
            onToggleFlag={toggleFlag}
            isNew={item.id === newItemId}
          />
        ))}
      </div>

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

      {/* Generate modal */}
      {showGenerate && (
        <GenerateChecksheetModal courseTitle={title} onGenerated={handleGenerated} onClose={() => setShowGenerate(false)} />
      )}
    </div>
  );
}
