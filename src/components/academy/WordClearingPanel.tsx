import { useState } from 'react';
import { BookOpen, Search, Check, AlertCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  employeeId: string;
  stepId: string;
  onClose: () => void;
}

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  example: string | null;
}

interface ClearingLog {
  id: string;
  term: string;
  glossary_term_id: string | null;
  cleared: boolean;
  student_definition: string | null;
  student_example: string | null;
}

export function WordClearingPanel({ courseId, employeeId, stepId, onClose }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [customTerm, setCustomTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [studentDef, setStudentDef] = useState('');
  const [studentExample, setStudentExample] = useState('');

  // Glossary terms for this course
  const { data: glossary = [] } = useQuery({
    queryKey: ['glossary-terms', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('glossary_terms').select('*')
        .or(`course_id.eq.${courseId},course_id.is.null`).order('term');
      if (error) throw error;
      return data as GlossaryTerm[];
    },
  });

  // Student's clearing logs for this step
  const { data: logs = [] } = useQuery({
    queryKey: ['word-clearing-logs', courseId, employeeId, stepId],
    queryFn: async () => {
      const { data, error } = await supabase.from('word_clearing_logs').select('*')
        .eq('course_id', courseId).eq('employee_id', employeeId).eq('step_id', stepId);
      if (error) throw error;
      return data as ClearingLog[];
    },
  });

  // Mark a word as unclear
  const markUnclearMut = useMutation({
    mutationFn: async (term: string) => {
      const matchingGlossary = glossary.find(g => g.term.toLowerCase() === term.toLowerCase());
      const { error } = await supabase.from('word_clearing_logs').insert({
        employee_id: employeeId, course_id: courseId, step_id: stepId,
        term, glossary_term_id: matchingGlossary?.id || null, cleared: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['word-clearing-logs', courseId, employeeId, stepId] });
      setCustomTerm('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Clear a word (mark as understood)
  const clearWordMut = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase.from('word_clearing_logs').update({
        cleared: true, student_definition: studentDef || null,
        student_example: studentExample || null,
        cleared_at: new Date().toISOString(),
      }).eq('id', logId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['word-clearing-logs', courseId, employeeId, stepId] });
      setExpandedLog(null);
      setStudentDef('');
      setStudentExample('');
      toast.success('Слово прояснено ✓');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredGlossary = glossary.filter(g =>
    g.term.toLowerCase().includes(search.toLowerCase())
  );

  const unclearedCount = logs.filter(l => !l.cleared).length;
  const alreadyLogged = new Set(logs.map(l => l.term.toLowerCase()));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-primary" />
          <span className="text-xs font-display font-bold text-foreground">Прояснение слов</span>
          {unclearedCount > 0 && (
            <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded text-[10px] font-bold">{unclearedCount} неясных</span>
          )}
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Закрыть</button>
      </div>

      <div className="p-3 space-y-3">
        {/* Add unclear word */}
        <div className="flex gap-2">
          <Input value={customTerm} onChange={e => setCustomTerm(e.target.value)} placeholder="Введите неясное слово..." className="bg-background h-8 text-xs flex-1" />
          <button onClick={() => { if (customTerm.trim()) markUnclearMut.mutate(customTerm.trim()); }}
            disabled={!customTerm.trim()} className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1">
            <Plus size={12} /> Добавить
          </button>
        </div>

        {/* Student's unclear words for this step */}
        {logs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Мои неясные слова</p>
            {logs.map(log => {
              const glossaryMatch = glossary.find(g => g.id === log.glossary_term_id);
              const isExpanded = expandedLog === log.id;
              return (
                <div key={log.id} className={`rounded-lg border p-2.5 ${log.cleared ? 'border-primary/20 bg-primary/5' : 'border-destructive/20 bg-destructive/5'}`}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => {
                    if (!log.cleared) {
                      setExpandedLog(isExpanded ? null : log.id);
                      setStudentDef(log.student_definition || '');
                      setStudentExample(log.student_example || '');
                    }
                  }}>
                    <div className="flex items-center gap-2">
                      {log.cleared ? <Check size={12} className="text-primary" /> : <AlertCircle size={12} className="text-destructive" />}
                      <span className={`text-xs font-display font-bold ${log.cleared ? 'text-primary' : 'text-destructive'}`}>{log.term}</span>
                    </div>
                    {!log.cleared && (isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />)}
                  </div>

                  {glossaryMatch && (
                    <div className="mt-1.5 pl-5">
                      <p className="text-xs text-muted-foreground"><strong>Определение:</strong> {glossaryMatch.definition}</p>
                      {glossaryMatch.example && <p className="text-xs text-muted-foreground italic mt-0.5">Пример: {glossaryMatch.example}</p>}
                    </div>
                  )}

                  {log.cleared && log.student_definition && (
                    <div className="mt-1.5 pl-5">
                      <p className="text-xs text-foreground"><strong>Моё понимание:</strong> {log.student_definition}</p>
                      {log.student_example && <p className="text-xs text-foreground italic mt-0.5">Мой пример: {log.student_example}</p>}
                    </div>
                  )}

                  {isExpanded && !log.cleared && (
                    <div className="mt-2 pl-5 space-y-2">
                      <Textarea value={studentDef} onChange={e => setStudentDef(e.target.value)} placeholder="Напишите определение своими словами *" rows={2} className="bg-background resize-none text-xs" />
                      <Input value={studentExample} onChange={e => setStudentExample(e.target.value)} placeholder="Приведите пример из практики" className="bg-background h-8 text-xs" />
                      <button onClick={() => clearWordMut.mutate(log.id)} disabled={!studentDef.trim()}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1">
                        <Check size={12} /> Прояснено
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Glossary search */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Глоссарий курса</p>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск в глоссарии..." className="pl-8 bg-background h-8 text-xs" />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {(search ? filteredGlossary : glossary.slice(0, 10)).map(g => (
              <div key={g.id} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50">
                <p className="text-xs font-display font-bold text-foreground">{g.term}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{g.definition}</p>
              </div>
            ))}
            {!search && glossary.length > 10 && (
              <p className="text-[10px] text-muted-foreground text-center py-1">Используйте поиск для просмотра всех {glossary.length} терминов</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
