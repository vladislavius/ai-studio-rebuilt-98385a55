import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, BookOpen, Search } from 'lucide-react';
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
  courseId?: string; // filter by course, or show all
}

export function GlossaryManager({ courseId }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ term: '', definition: '', example: '' });
  const [showAdd, setShowAdd] = useState(false);

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

  const startEdit = (t: GlossaryTerm) => {
    setEditingId(t.id);
    setForm({ term: t.term, definition: t.definition, example: t.example || '' });
  };

  const filtered = terms.filter(t =>
    t.term.toLowerCase().includes(search.toLowerCase()) ||
    t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <BookOpen size={18} className="text-primary" />
          <h2 className="font-display font-bold text-foreground text-sm">Глоссарий</h2>
          <span className="text-xs text-muted-foreground">({terms.length} терминов)</span>
        </div>
        <button onClick={() => { setShowAdd(true); setForm({ term: '', definition: '', example: '' }); }}
          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-primary/20">
          <Plus size={14} /> Добавить термин
        </button>
      </div>

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
          {search ? 'Ничего не найдено' : 'Глоссарий пуст. Добавьте первый термин.'}
        </div>
      ) : (
        <div className="space-y-1.5">
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
