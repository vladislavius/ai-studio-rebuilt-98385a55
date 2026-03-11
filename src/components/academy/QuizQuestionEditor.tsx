import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;        // used when multiSelect = false
  correctIndices?: number[];   // used when multiSelect = true
  multiSelect?: boolean;
}

interface Props {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export function QuizQuestionEditor({ questions, onChange }: Props) {
  const addQuestion = () => {
    onChange([...questions, { question: '', options: ['', ''], correctIndex: 0, correctIndices: [], multiSelect: false }]);
  };

  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...patch };
    onChange(updated);
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    onChange(updated);
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], options: [...updated[qIdx].options, ''] };
    onChange(updated);
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    const opts = updated[qIdx].options.filter((_, i) => i !== optIdx);
    const q = updated[qIdx];
    if (q.multiSelect) {
      const newIndices = (q.correctIndices ?? [])
        .filter(i => i !== optIdx)
        .map(i => (i > optIdx ? i - 1 : i));
      updated[qIdx] = { ...q, options: opts, correctIndices: newIndices };
    } else {
      let ci = q.correctIndex;
      if (optIdx === ci) ci = 0;
      else if (optIdx < ci) ci--;
      updated[qIdx] = { ...q, options: opts, correctIndex: ci };
    }
    onChange(updated);
  };

  const toggleSingleCorrect = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], correctIndex: optIdx };
    onChange(updated);
  };

  const toggleMultiCorrect = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    const indices = updated[qIdx].correctIndices ?? [];
    const next = indices.includes(optIdx)
      ? indices.filter(i => i !== optIdx)
      : [...indices, optIdx];
    updated[qIdx] = { ...updated[qIdx], correctIndices: next };
    onChange(updated);
  };

  const toggleMultiSelect = (qIdx: number, val: boolean) => {
    const updated = [...questions];
    const q = updated[qIdx];
    updated[qIdx] = {
      ...q,
      multiSelect: val,
      correctIndex: val ? 0 : (q.correctIndex ?? 0),
      correctIndices: val ? [] : [],
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Вопросы теста ({questions.length})</p>
        <button onClick={addQuestion} className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-display font-bold flex items-center gap-1 hover:bg-primary/20">
          <Plus size={12} /> Добавить вопрос
        </button>
      </div>

      {questions.length === 0 && (
        <p className="text-xs text-muted-foreground font-body text-center py-4">Нет вопросов. Нажмите «Добавить вопрос».</p>
      )}

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="border border-border rounded-lg p-3 space-y-2 bg-background">
          {/* Question header */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-display font-bold text-muted-foreground w-5">{qIdx + 1}.</span>
            <Input
              value={q.question}
              onChange={e => updateQuestion(qIdx, { question: e.target.value })}
              placeholder="Текст вопроса..."
              className="flex-1 h-8 text-xs"
            />
            <button onClick={() => removeQuestion(qIdx)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 size={14} />
            </button>
          </div>

          {/* Type toggle */}
          <div className="pl-7 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-display">Тип:</span>
            <button
              onClick={() => toggleMultiSelect(qIdx, false)}
              className={`px-2 py-0.5 rounded text-[10px] font-display font-bold transition-colors ${!q.multiSelect ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent'}`}
            >
              Один ответ
            </button>
            <button
              onClick={() => toggleMultiSelect(qIdx, true)}
              className={`px-2 py-0.5 rounded text-[10px] font-display font-bold transition-colors ${q.multiSelect ? 'bg-indigo-500 text-white' : 'border border-border text-muted-foreground hover:bg-accent'}`}
            >
              Несколько ответов
            </button>
          </div>

          {/* Options */}
          <div className="space-y-1 pl-7">
            {q.options.map((opt, optIdx) => {
              const isSingleCorrect = !q.multiSelect && q.correctIndex === optIdx;
              const isMultiCorrect = q.multiSelect && (q.correctIndices ?? []).includes(optIdx);
              return (
                <div key={optIdx} className="flex items-center gap-2">
                  {/* Correct marker */}
                  {q.multiSelect ? (
                    <button
                      onClick={() => toggleMultiCorrect(qIdx, optIdx)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isMultiCorrect ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border hover:border-indigo-400'
                      }`}
                      title="Отметить как правильный"
                    >
                      {isMultiCorrect && <span className="text-[8px]">✓</span>}
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleSingleCorrect(qIdx, optIdx)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSingleCorrect ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'
                      }`}
                      title="Отметить как правильный"
                    >
                      {isSingleCorrect && <span className="text-[8px]">✓</span>}
                    </button>
                  )}
                  <Input
                    value={opt}
                    onChange={e => updateOption(qIdx, optIdx, e.target.value)}
                    placeholder={`Вариант ${String.fromCharCode(65 + optIdx)}...`}
                    className="flex-1 h-7 text-xs"
                  />
                  {q.options.length > 2 && (
                    <button onClick={() => removeOption(qIdx, optIdx)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            {q.options.length < 6 && (
              <button onClick={() => addOption(qIdx)} className="text-[10px] text-primary font-display font-bold hover:underline pl-7">
                + Добавить вариант
              </button>
            )}
            {q.multiSelect && (q.correctIndices ?? []).length === 0 && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 pl-7">Отметьте один или несколько правильных вариантов</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
