import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, BookOpen, Search, Sparkles, Globe, Loader2, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  course_id: string | null;
  created_at: string;
}

interface Props {
  courseId?: string;
}

export function GlossaryManager({ courseId }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ term: '', definition: '', example: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<'ai' | 'url'>('ai');
  const [importTopic, setImportTopic] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importCount, setImportCount] = useState('20');
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{ term: string; definition: string; example: string | null }[]>([]);
  const [selectedImport, setSelectedImport] = useState<Set<number>>(new Set());

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title');
      if (error) throw error;
      return data;
    },
  });

  const courseName = courses?.find(c => c.id === courseId)?.title || '';

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ['glossary-terms', courseId],
    queryFn: async () => {
      let q = supabase.from('glossary_terms').select('*').order('term');
      if (courseId) q = q.or(`course_id.eq.${courseId},course_id.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      return data as GlossaryTerm[];
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('glossary_terms').insert({
        term: form.term, definition: form.definition,
        example: form.example || null, course_id: courseId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['glossary-terms'] });
      setForm({ term: '', definition: '', example: '' });
      setShowAdd(false);
      toast.success('Термин добавлен');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('glossary_terms').update({
        term: form.term, definition: form.definition, example: form.example || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['glossary-terms'] });
      setEditingId(null);
      toast.success('Термин обновлён');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('glossary_terms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['glossary-terms'] });
      toast.success('Термин удалён');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkInsertMut = useMutation({
    mutationFn: async (termsToInsert: { term: string; definition: string; example: string | null }[]) => {
      const rows = termsToInsert.map(t => ({
        term: t.term, definition: t.definition, example: t.example, course_id: courseId || null,
      }));
      const { error } = await supabase.from('glossary_terms').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['glossary-terms'] });
      toast.success('Термины добавлены в глоссарий');
      setImportPreview([]);
      setSelectedImport(new Set());
      setShowImport(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (t: GlossaryTerm) => {
    setEditingId(t.id);
    setForm({ term: t.term, definition: t.definition, example: t.example || '' });
  };

  const handleImport = async () => {
    if (importMode === 'ai' && !importTopic.trim()) { toast.error('Введите тему'); return; }
    if (importMode === 'url' && !importUrl.trim()) { toast.error('Введите URL'); return; }
    setImporting(true);
    setImportPreview([]);
    try {
      const { data, error } = await supabase.functions.invoke('glossary-import', {
        body: {
          mode: importMode === 'ai' ? 'ai_generate' : 'parse_url',
          topic: importTopic,
          url: importUrl,
          course_title: courseName,
          count: parseInt(importCount) || 20,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.terms?.length) {
        setImportPreview(data.terms);
        setSelectedImport(new Set(data.terms.map((_: any, i: number) => i)));
        toast.success(`Найдено ${data.terms.length} терминов`);
      } else {
        toast.error('Термины не найдены');
      }
    } catch (e: any) {
      toast.error(e.message || 'Ошибка импорта');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveImported = () => {
    const toInsert = importPreview.filter((_, i) => selectedImport.has(i));
    if (toInsert.length === 0) { toast.error('Выберите хотя бы один термин'); return; }
    bulkInsertMut.mutate(toInsert);
  };

  const toggleImportItem = (idx: number) => {
    setSelectedImport(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const filtered = terms.filter(t =>
    t.term.toLowerCase().includes(search.toLowerCase()) ||
    t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <h2 className="font-display font-bold text-foreground text-sm">Глоссарий</h2>
          <span className="text-xs text-muted-foreground">({terms.length} терминов)</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(true); setImportPreview([]); }}
            className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-accent/80">
            <Upload size={14} /> Массовая загрузка
          </button>
          <button onClick={() => { setShowAdd(true); setForm({ term: '', definition: '', example: '' }); }}
            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-primary/20">
            <Plus size={14} /> Добавить термин
          </button>
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-foreground text-sm">Массовая загрузка терминов</h3>
            <button onClick={() => { setShowImport(false); setImportPreview([]); }} className="p-1 rounded hover:bg-accent text-muted-foreground"><X size={16} /></button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setImportMode('ai')}
              className={`px-4 py-2 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 transition-colors ${importMode === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            >
              <Sparkles size={14} /> AI-генерация по теме
            </button>
            <button
              onClick={() => setImportMode('url')}
              className={`px-4 py-2 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 transition-colors ${importMode === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            >
              <Globe size={14} /> Парсинг веб-страницы
            </button>
          </div>

          {importMode === 'ai' ? (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Тема / предмет</label>
                <Input value={importTopic} onChange={e => setImportTopic(e.target.value)} placeholder="Например: управление проектами, маркетинг, бухгалтерский учёт..." className="bg-background" />
              </div>
              <div>
                <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Количество терминов</label>
                <Input type="number" value={importCount} onChange={e => setImportCount(e.target.value)} min={5} max={50} className="bg-background w-24" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">URL страницы со словарём/глоссарием</label>
                <Input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://example.com/glossary" className="bg-background" />
              </div>
              <p className="text-[10px] text-muted-foreground font-body">Система извлечёт термины и определения со страницы с помощью ИИ</p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {importing ? 'Загрузка...' : importMode === 'ai' ? 'Сгенерировать' : 'Извлечь термины'}
          </button>

          {/* Preview */}
          {importPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">
                  Найдено {importPreview.length} терминов • Выбрано {selectedImport.size}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedImport(new Set(importPreview.map((_, i) => i)))} className="text-[10px] text-primary hover:underline font-display">Выбрать все</button>
                  <button onClick={() => setSelectedImport(new Set())} className="text-[10px] text-muted-foreground hover:underline font-display">Снять все</button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1.5 border border-border rounded-lg p-2">
                {importPreview.map((t, idx) => (
                  <label key={idx} className={`flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${selectedImport.has(idx) ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30 border border-transparent hover:bg-accent/50'}`}>
                    <input type="checkbox" checked={selectedImport.has(idx)} onChange={() => toggleImportItem(idx)} className="rounded mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display font-bold text-foreground">{t.term}</p>
                      <p className="text-[10px] text-muted-foreground font-body mt-0.5">{t.definition}</p>
                      {t.example && <p className="text-[10px] text-primary/70 font-body mt-0.5 italic">Пример: {t.example}</p>}
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={handleSaveImported}
                disabled={selectedImport.size === 0 || bulkInsertMut.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {bulkInsertMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Добавить {selectedImport.size} терминов в глоссарий
              </button>
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск термина..." className="pl-9 bg-background h-9 text-sm" />
      </div>

      {showAdd && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <Input value={form.term} onChange={e => setForm(p => ({ ...p, term: e.target.value }))} placeholder="Термин *" className="bg-background h-9 text-sm" />
          <Textarea value={form.definition} onChange={e => setForm(p => ({ ...p, definition: e.target.value }))} placeholder="Определение *" rows={2} className="bg-background resize-none text-sm" />
          <Input value={form.example} onChange={e => setForm(p => ({ ...p, example: e.target.value }))} placeholder="Пример использования (необязательно)" className="bg-background h-9 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => addMut.mutate()} disabled={!form.term || !form.definition} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50 flex items-center gap-1">
              <Save size={12} /> Сохранить
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground">Отмена</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {search ? 'Ничего не найдено' : 'Глоссарий пуст. Добавьте первый термин или загрузите массово.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-3 group">
              {editingId === t.id ? (
                <div className="space-y-2">
                  <Input value={form.term} onChange={e => setForm(p => ({ ...p, term: e.target.value }))} className="bg-background h-8 text-sm" />
                  <Textarea value={form.definition} onChange={e => setForm(p => ({ ...p, definition: e.target.value }))} rows={2} className="bg-background resize-none text-sm" />
                  <Input value={form.example} onChange={e => setForm(p => ({ ...p, example: e.target.value }))} placeholder="Пример" className="bg-background h-8 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => updateMut.mutate(t.id)} className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold flex items-center gap-1"><Save size={12} /> Сохранить</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 border border-border rounded-lg text-xs text-muted-foreground"><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-foreground text-sm">{t.term}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{t.definition}</p>
                    {t.example && <p className="text-xs text-primary/70 font-body mt-1 italic">Пример: {t.example}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(t)} className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Edit2 size={12} /></button>
                    <button onClick={() => { if (confirm('Удалить термин?')) deleteMut.mutate(t.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
