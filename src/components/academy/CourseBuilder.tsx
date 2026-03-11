/**
 * CourseBuilder — Phase 4
 *
 * HST course builder: Material → Tasks → Material → Tasks → ...
 *
 * Each block = one section of material (text/html/video/image/pdf/audio)
 *            + list of tasks for that material
 *
 * Saves to courses.sections JSONB array (ChecksheetItem[] format):
 * { id, order, type, title, content, task?, critical?, needsCheckout? }
 *
 * The material of each block becomes a 'read' step; tasks become subsequent steps.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Save, X, ChevronUp, ChevronDown,
  BookOpen, FileText, Image, Video, Music, Globe, Upload,
  Search, Sparkles, Repeat2, PenLine, ClipboardCheck,
  Star, FileQuestion, Eye, HelpCircle, GraduationCap,
  ChevronRight, AlertTriangle, CheckCircle2, Copy, ArrowLeft,
} from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { StepType } from '@/types/academy';

// ─── Block data model ─────────────────────────────────────────────────────────

type MaterialType = 'text' | 'html' | 'image' | 'pdf' | 'docx' | 'video' | 'audio';

interface CourseMaterial {
  type: MaterialType;
  content: string;
  fileUrl?: string;
  filePath?: string;
  fileName?: string;
}

interface BlockTask {
  id: string;
  type: StepType;
  title: string;
  task?: string;            // additional instructions
  critical?: boolean;
  needsCheckout?: boolean;
  quizQuestions?: { question: string; options: string[]; correctIndex: number }[];
}

interface CourseBlock {
  id: string;
  order: number;
  title: string;
  material: CourseMaterial;
  tasks: BlockTask[];
}

// ChecksheetItem is what gets stored in courses.sections
interface ChecksheetItem {
  id: string;
  order: number;
  type: StepType;
  title: string;
  content: string;
  task?: string;
  critical?: boolean;
  needsCheckout?: boolean;
  quizQuestions?: { question: string; options: string[]; correctIndex: number }[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CourseBuilderProps {
  courseId: string;
  onBack: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MATERIAL_TYPES: { id: MaterialType; label: string; icon: React.ElementType }[] = [
  { id: 'text',  label: 'Текст',        icon: FileText },
  { id: 'html',  label: 'HTML',         icon: Globe },
  { id: 'image', label: 'Изображение',  icon: Image },
  { id: 'pdf',   label: 'PDF',          icon: FileText },
  { id: 'video', label: 'Видео',        icon: Video },
  { id: 'audio', label: 'Аудио',        icon: Music },
];

const TASK_TYPES: { id: StepType; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'read',          label: 'Чтение',           icon: BookOpen,       color: 'blue' },
  { id: 'write',         label: 'Написание',         icon: PenLine,        color: 'amber' },
  { id: 'demo',          label: 'Демонстрация',      icon: Eye,            color: 'emerald' },
  { id: 'drill',         label: 'Упражнение',        icon: Repeat2,        color: 'purple' },
  { id: 'starrate',      label: 'Оценка',            icon: Star,           color: 'orange' },
  { id: 'clay_demo',     label: 'Пластилиновое демо', icon: Sparkles,      color: 'teal' },
  { id: 'checkout',      label: 'Чек-аут',           icon: ClipboardCheck, color: 'rose' },
  { id: 'word_clearing', label: 'Прояснение слов',   icon: Search,         color: 'cyan' },
  { id: 'quiz',          label: 'Тест',              icon: FileQuestion,   color: 'indigo' },
];

const TASK_DEFAULT_TITLES: Record<StepType, string> = {
  read:          'Прочитайте данный раздел',
  write:         'Напишите конспект / эссе по теме',
  demo:          'Продемонстрируйте понимание',
  drill:         'Отработайте до автоматизма',
  starrate:      'Оцените свой уровень понимания',
  clay_demo:     'Сделайте демонстрацию из пластилина',
  checkout:      'Сдайте чек-аут куратору',
  word_clearing: 'Проясните все непонятые слова',
  quiz:          'Пройдите тест',
};

// ─── Converters ───────────────────────────────────────────────────────────────

function checksheetToBlocks(items: ChecksheetItem[]): CourseBlock[] {
  // Group flat items into blocks: a 'read' step starts a new block
  const blocks: CourseBlock[] = [];
  let currentBlock: CourseBlock | null = null;
  let blockOrder = 0;

  for (const item of items) {
    if (item.type === 'read') {
      // Start new block
      currentBlock = {
        id: `block-${item.id}`,
        order: blockOrder++,
        title: item.title,
        material: { type: 'html', content: item.content },
        tasks: [],
      };
      blocks.push(currentBlock);
    } else if (currentBlock) {
      currentBlock.tasks.push({
        id: item.id,
        type: item.type,
        title: item.title,
        task: item.task,
        critical: item.critical,
        needsCheckout: item.needsCheckout,
        quizQuestions: item.quizQuestions,
      });
    } else {
      // Orphaned task — create a block for it
      currentBlock = {
        id: `block-orphan-${blockOrder}`,
        order: blockOrder++,
        title: '',
        material: { type: 'text', content: '' },
        tasks: [{
          id: item.id,
          type: item.type,
          title: item.title,
          task: item.task,
          critical: item.critical,
          needsCheckout: item.needsCheckout,
          quizQuestions: item.quizQuestions,
        }],
      };
      blocks.push(currentBlock);
    }
  }

  return blocks;
}

function blocksToChecksheet(blocks: CourseBlock[]): ChecksheetItem[] {
  const items: ChecksheetItem[] = [];
  let globalOrder = 0;

  for (const block of blocks) {
    // Material becomes a 'read' step
    const readId = `read-${block.id}`;
    items.push({
      id: readId,
      order: globalOrder++,
      type: 'read',
      title: block.title || 'Материал',
      content: block.material.type === 'html'
        ? block.material.content
        : block.material.type === 'video' && block.material.fileUrl
          ? `<video src="${block.material.fileUrl}" controls style="width:100%"></video><p>${block.material.content}</p>`
          : block.material.type === 'audio' && block.material.fileUrl
            ? `<audio src="${block.material.fileUrl}" controls></audio><p>${block.material.content}</p>`
            : block.material.type === 'image' && block.material.fileUrl
              ? `<img src="${block.material.fileUrl}" alt="${block.material.content}" style="max-width:100%" />`
              : block.material.type === 'pdf' && block.material.fileUrl
                ? `<p><a href="${block.material.fileUrl}" target="_blank">${block.material.fileName ?? 'Открыть PDF'}</a></p>`
                : `<p>${block.material.content}</p>`,
    });

    // Tasks become subsequent steps
    for (const t of block.tasks) {
      items.push({
        id: t.id,
        order: globalOrder++,
        type: t.type,
        title: t.title,
        content: '',
        task: t.task,
        critical: t.critical,
        needsCheckout: t.needsCheckout,
        quizQuestions: t.quizQuestions,
      });
    }
  }

  return items;
}

// ─── Factories ────────────────────────────────────────────────────────────────

function newBlock(order: number): CourseBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    order,
    title: '',
    material: { type: 'text', content: '' },
    tasks: [],
  };
}

function newTask(type: StepType): BlockTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title: TASK_DEFAULT_TITLES[type] ?? '',
    critical: false,
    needsCheckout: type === 'checkout',
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function pl(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function CourseBuilder({ courseId, onBack }: CourseBuilderProps) {
  const qc = useQueryClient();

  // Load existing course
  const { data: course, isLoading } = useQuery({
    queryKey: ['course-builder', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [blocks, setBlocks] = useState<CourseBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Initialize from loaded course
  const initialized = React.useRef(false);
  React.useEffect(() => {
    if (course && !initialized.current) {
      initialized.current = true;
      setTitle(course.title ?? '');
      setDescription(course.description ?? '');
      const items = Array.isArray(course.sections)
        ? (course.sections as unknown as ChecksheetItem[]).sort((a, b) => a.order - b.order)
        : [];
      const parsed = items.length > 0 ? checksheetToBlocks(items) : [newBlock(0)];
      setBlocks(parsed);
      setSelectedBlockId(parsed[0]?.id ?? '');
    }
  }, [course]);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedTask = selectedBlock?.tasks.find(t => t.id === selectedTaskId) ?? null;
  const totalTasks = blocks.reduce((s, b) => s + b.tasks.length, 0);

  // ── Block CRUD ──────────────────────────────────────────────────────────────

  const addBlock = () => {
    const b = newBlock(blocks.length);
    setBlocks([...blocks, b]);
    setSelectedBlockId(b.id);
    setSelectedTaskId(null);
  };

  const duplicateBlock = (blockId: string) => {
    const src = blocks.find(b => b.id === blockId);
    if (!src) return;
    const dup: CourseBlock = {
      ...src,
      id: `block-${Date.now()}`,
      order: src.order + 0.5,
      tasks: src.tasks.map(t => ({ ...t, id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    const sorted = [...blocks, dup].sort((a, b) => a.order - b.order).map((b, i) => ({ ...b, order: i }));
    setBlocks(sorted);
    setSelectedBlockId(dup.id);
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length === 1) { toast.error('Нельзя удалить единственный блок'); return; }
    const filtered = blocks.filter(b => b.id !== blockId).map((b, i) => ({ ...b, order: i }));
    setBlocks(filtered);
    setSelectedBlockId(filtered[0]?.id ?? '');
    setSelectedTaskId(null);
  };

  const moveBlock = (blockId: string, dir: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === blockId);
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const arr = [...blocks];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setBlocks(arr.map((b, i) => ({ ...b, order: i })));
  };

  const updateBlock = useCallback((blockId: string, updates: Partial<CourseBlock>) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...updates } : b));
  }, []);

  const updateMaterial = useCallback((blockId: string, updates: Partial<CourseMaterial>) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, material: { ...b.material, ...updates } } : b
    ));
  }, []);

  // ── Task CRUD ───────────────────────────────────────────────────────────────

  const addTask = (type: StepType) => {
    if (!selectedBlock) return;
    const t = newTask(type);
    updateBlock(selectedBlock.id, { tasks: [...selectedBlock.tasks, t] });
    setSelectedTaskId(t.id);
    setShowTaskPicker(false);
  };

  const updateTask = useCallback((blockId: string, taskId: string, updates: Partial<BlockTask>) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId
        ? { ...b, tasks: b.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) }
        : b
    ));
  }, []);

  const deleteTask = (blockId: string, taskId: string) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, tasks: b.tasks.filter(t => t.id !== taskId) } : b
    ));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
  };

  const moveTask = (blockId: string, taskId: string, dir: 'up' | 'down') => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const arr = [...b.tasks];
      const idx = arr.findIndex(t => t.id === taskId);
      const newIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= arr.length) return b;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...b, tasks: arr };
    }));
  };

  // ── File upload ─────────────────────────────────────────────────────────────

  const handleFileUpload = async (file: File) => {
    if (!selectedBlock) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'bin';
      const matType: MaterialType = file.type.startsWith('image/') ? 'image'
        : file.name.endsWith('.pdf') ? 'pdf'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : 'pdf';
      const path = `course-materials/${courseId}/${selectedBlock.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('employee-docs').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('employee-docs').getPublicUrl(path);
      updateMaterial(selectedBlock.id, {
        type: matType,
        fileUrl: data.publicUrl,
        filePath: path,
        fileName: file.name,
      });
    } catch (err: unknown) {
      toast.error('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Укажите название курса');
      const sections = blocksToChecksheet(blocks);
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('courses')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          sections: sections as any,
          updated_at: now,
        })
        .eq('id', courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Курс сохранён');
      qc.invalidateQueries({ queryKey: ['course-builder', courseId] });
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-[calc(100vh-80px)]">

      {/* Top toolbar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <button onClick={onBack} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Название курса..."
            className="w-full text-base font-bold text-slate-800 bg-transparent border-none outline-none placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-slate-400">
            {blocks.length} {pl(blocks.length, 'блок', 'блока', 'блоков')} · {totalTasks} {pl(totalTasks, 'задание', 'задания', 'заданий')}
          </span>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm shadow-amber-200"
          >
            <Save size={14} /> {saveMut.isPending ? 'Сохраняю...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: Block list ─────────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Описание курса..."
              rows={2}
              className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {blocks.map((block, idx) => {
              const isActive = block.id === selectedBlockId;
              const MatIco = MATERIAL_TYPES.find(m => m.id === block.material.type)?.icon ?? FileText;
              return (
                <div
                  key={block.id}
                  onClick={() => { setSelectedBlockId(block.id); setSelectedTaskId(null); }}
                  className={`group flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors border-l-2 ${
                    isActive ? 'bg-amber-50 border-amber-500' : 'border-transparent hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    isActive ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-amber-700' : 'text-slate-700'}`}>
                      {block.title || `Блок ${idx + 1}`}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MatIco size={10} className="text-slate-400 shrink-0" />
                      {block.tasks.length > 0 && (
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1 rounded font-semibold ml-1">{block.tasks.length}</span>
                      )}
                    </div>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronUp size={11} /></button>
                    <button onClick={() => moveBlock(block.id, 'down')} disabled={idx === blocks.length - 1} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronDown size={11} /></button>
                    <button onClick={() => duplicateBlock(block.id)} className="p-0.5 text-slate-400 hover:text-blue-500"><Copy size={11} /></button>
                    <button onClick={() => deleteBlock(block.id)} className="p-0.5 text-slate-400 hover:text-red-500"><Trash2 size={11} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-100">
            <button
              onClick={addBlock}
              className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-amber-300 text-amber-600 rounded-lg text-xs font-semibold hover:border-amber-400 hover:bg-amber-50 transition-colors"
            >
              <Plus size={14} /> Добавить блок
            </button>
          </div>
        </aside>

        {/* ── RIGHT: Block editor ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {selectedBlock ? (
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Block title */}
              <div>
                <input
                  value={selectedBlock.title}
                  onChange={e => updateBlock(selectedBlock.id, { title: e.target.value })}
                  placeholder="Название главы / раздела (необязательно)"
                  className="w-full text-lg font-bold text-slate-800 bg-transparent border-none outline-none placeholder-slate-400 pb-1 border-b border-slate-200 focus:border-amber-400 transition-colors"
                />
              </div>

              {/* ── Material ──────────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BookOpen size={12} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Материал</span>
                  <span className="text-xs text-slate-400 ml-1">— что изучает студент</span>
                </div>

                <div className="px-4 pt-3 flex flex-wrap gap-1.5">
                  {MATERIAL_TYPES.map(mt => {
                    const Ico = mt.icon;
                    const active = selectedBlock.material.type === mt.id;
                    return (
                      <button
                        key={mt.id}
                        onClick={() => updateMaterial(selectedBlock.id, { type: mt.id })}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Ico size={11} /> {mt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4">
                  <MaterialEditor
                    block={selectedBlock}
                    onChange={updates => updateMaterial(selectedBlock.id, updates)}
                    onFileUpload={handleFileUpload}
                    uploading={uploading}
                    fileRef={fileRef}
                  />
                </div>
              </div>

              {/* ── Tasks ─────────────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-amber-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Задания</span>
                    <span className="text-xs text-slate-400">— что делает студент с этим материалом</span>
                  </div>
                  {selectedBlock.tasks.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{selectedBlock.tasks.length}</span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {selectedBlock.tasks.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">
                      Добавьте задания к этому разделу материала
                    </p>
                  ) : (
                    selectedBlock.tasks.map((task, tIdx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={tIdx}
                        total={selectedBlock.tasks.length}
                        expanded={selectedTaskId === task.id}
                        onToggle={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                        onChange={updates => updateTask(selectedBlock.id, task.id, updates)}
                        onDelete={() => deleteTask(selectedBlock.id, task.id)}
                        onMove={dir => moveTask(selectedBlock.id, task.id, dir)}
                      />
                    ))
                  )}

                  {showTaskPicker ? (
                    <TaskTypePicker onSelect={addTask} onClose={() => setShowTaskPicker(false)} />
                  ) : (
                    <button
                      onClick={() => setShowTaskPicker(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-amber-300 text-amber-600 rounded-xl text-sm font-semibold hover:border-amber-400 hover:bg-amber-50 transition-colors"
                    >
                      <Plus size={15} /> Добавить задание
                    </button>
                  )}
                </div>
              </div>

              {selectedBlock.tasks.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <AlertTriangle size={13} className="shrink-0" />
                  По ТО ЛРХ каждый раздел материала должен иметь хотя бы одно задание (минимум — чтение).
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <GraduationCap size={40} className="opacity-30" />
              <p className="text-sm">Выберите блок слева</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── MaterialEditor ────────────────────────────────────────────────────────────

function MaterialEditor({
  block,
  onChange,
  onFileUpload,
  uploading,
  fileRef,
}: {
  block: CourseBlock;
  onChange: (updates: Partial<CourseMaterial>) => void;
  onFileUpload: (f: File) => void;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
}) {
  const m = block.material;

  if (m.type === 'text') {
    return (
      <textarea
        value={m.content}
        onChange={e => onChange({ content: e.target.value })}
        placeholder="Введите текст материала..."
        rows={8}
        className="w-full px-3 py-2.5 text-sm text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 resize-none leading-relaxed"
      />
    );
  }

  if (m.type === 'html') {
    return (
      <div className="space-y-2">
        <textarea
          value={m.content}
          onChange={e => onChange({ content: e.target.value })}
          placeholder="<p>Введите HTML...</p>"
          rows={8}
          className="w-full px-3 py-2 text-xs font-mono text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 resize-none"
        />
        {m.content && (
          <div
            className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: m.content }}
          />
        )}
      </div>
    );
  }

  if (m.type === 'image') {
    return (
      <div className="space-y-2">
        {m.fileUrl ? (
          <div className="relative">
            <img src={m.fileUrl} alt="material" className="w-full max-h-64 object-contain rounded-xl border border-slate-200" />
            <button
              onClick={() => onChange({ fileUrl: undefined, fileName: undefined })}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-slate-500 hover:text-red-500"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <FileDropZone label="Загрузить изображение" onFile={onFileUpload} uploading={uploading} accept="image/*" fileRef={fileRef} />
        )}
        <input
          value={m.content}
          onChange={e => onChange({ content: e.target.value })}
          placeholder="Подпись к изображению..."
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
        />
      </div>
    );
  }

  if (m.type === 'video') {
    return (
      <div className="space-y-2">
        <input
          value={m.fileUrl ?? ''}
          onChange={e => onChange({ fileUrl: e.target.value })}
          placeholder="URL видео (YouTube, Vimeo, mp4)..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400"
        />
        {m.fileUrl && (
          <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden">
            {m.fileUrl.includes('youtube') || m.fileUrl.includes('youtu.be') ? (
              <iframe
                src={m.fileUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video src={m.fileUrl} controls className="w-full h-full" />
            )}
          </div>
        )}
      </div>
    );
  }

  if (m.type === 'audio') {
    return (
      <div className="space-y-2">
        <input
          value={m.fileUrl ?? ''}
          onChange={e => onChange({ fileUrl: e.target.value })}
          placeholder="URL аудио (mp3, wav)..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400"
        />
        {m.fileUrl && <audio src={m.fileUrl} controls className="w-full" />}
      </div>
    );
  }

  // pdf / docx
  return (
    <div className="space-y-2">
      {m.fileUrl ? (
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <FileText size={18} className="text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">{m.fileName}</p>
            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Открыть файл</a>
          </div>
          <button onClick={() => onChange({ fileUrl: undefined, fileName: undefined })} className="p-1 text-slate-400 hover:text-red-500">
            <X size={14} />
          </button>
        </div>
      ) : (
        <FileDropZone label={`Загрузить ${m.type.toUpperCase()}`} onFile={onFileUpload} uploading={uploading} accept=".pdf,.docx" fileRef={fileRef} />
      )}
    </div>
  );
}

// ─── FileDropZone ──────────────────────────────────────────────────────────────

function FileDropZone({
  label, onFile, uploading, accept, fileRef,
}: {
  label: string;
  onFile: (f: File) => void;
  uploading: boolean;
  accept?: string;
  fileRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
      >
        <Upload size={20} className={uploading ? 'text-blue-400 animate-bounce' : 'text-slate-400'} />
        <span className="text-sm text-slate-500">{uploading ? 'Загружаю...' : label}</span>
      </button>
    </div>
  );
}

// ─── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({
  task, index, total, expanded, onToggle, onChange, onDelete, onMove,
}: {
  task: BlockTask;
  index: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (updates: Partial<BlockTask>) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
}) {
  const meta = TASK_TYPES.find(t => t.id === task.type);
  const Icon = meta?.icon ?? HelpCircle;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors ${
      expanded ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'
    }`}>
      <div className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer" onClick={onToggle}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-slate-100">
          <Icon size={12} className="text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">{task.title || meta?.label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-semibold text-slate-500">{meta?.label}</span>
            {task.critical && <span className="text-[10px] text-red-500 font-bold">• Критический</span>}
            {task.needsCheckout && <span className="text-[10px] text-rose-500">• Чек-аут</span>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onMove('up')} disabled={index === 0} className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronUp size={12} /></button>
          <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20"><ChevronDown size={12} /></button>
          <button onClick={onDelete} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
          {expanded ? <ChevronUp size={13} className="text-slate-400 ml-1" /> : <ChevronRight size={13} className="text-slate-400 ml-1" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-amber-200">
          {/* Type selector */}
          <div className="pt-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Тип задания</label>
            <div className="flex flex-wrap gap-1">
              {TASK_TYPES.map(tt => {
                const TIco = tt.icon;
                const active = task.type === tt.id;
                return (
                  <button
                    key={tt.id}
                    onClick={() => onChange({ type: tt.id, title: TASK_DEFAULT_TITLES[tt.id] })}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                      active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <TIco size={10} /> {tt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Инструкция для студента</label>
            <textarea
              value={task.title}
              onChange={e => onChange({ title: e.target.value })}
              rows={2}
              placeholder="Что должен сделать студент..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Additional task description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Дополнительное задание (необязательно)</label>
            <textarea
              value={task.task ?? ''}
              onChange={e => onChange({ task: e.target.value || undefined })}
              rows={2}
              placeholder="Детали задания, вопросы для ответа..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Flags */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Правила выполнения</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.critical ?? false}
                  onChange={e => onChange({ critical: e.target.checked })}
                  className="accent-red-500"
                />
                Критический шаг
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.needsCheckout ?? false}
                  onChange={e => onChange({ needsCheckout: e.target.checked })}
                  className="accent-rose-500"
                />
                Требует чек-аут
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TaskTypePicker ───────────────────────────────────────────────────────────

function TaskTypePicker({ onSelect, onClose }: { onSelect: (type: StepType) => void; onClose: () => void }) {
  return (
    <div className="border border-amber-200 rounded-2xl p-3 bg-amber-50 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-amber-800">Выберите тип задания</p>
        <button onClick={onClose} className="p-0.5 text-amber-500 hover:text-amber-700"><X size={13} /></button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {TASK_TYPES.map(tt => {
          const Icon = tt.icon;
          return (
            <button
              key={tt.id}
              onClick={() => onSelect(tt.id)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition-colors text-left"
            >
              <Icon size={13} className="text-slate-500 shrink-0" />
              {tt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// re-export Save icon for internal use
function Save({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
