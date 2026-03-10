import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Props {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export function QuizQuestionEditor({ questions, onChange }: Props) {
  const addQuestion = () => {
    onChange([...questions, { question: '', options: ['', ''], correctIndex: 0 }]);
  };

  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
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
    let correctIdx = updated[qIdx].correctIndex;
    if (optIdx === correctIdx) correctIdx = 0;
    else if (optIdx < correctIdx) correctIdx--;
    updated[qIdx] = { ...updated[qIdx], options: opts, correctIndex: correctIdx };
    onChange(updated);
  };

  const setCorrect = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], correctIndex: optIdx };
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
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-display font-bold text-muted-foreground w-5">{qIdx + 1}.</span>
            <Input
              value={q.question}
              onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
              placeholder="Текст вопроса..."
              className="flex-1 h-8 text-xs"
            />
            <button onClick={() => removeQuestion(qIdx)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="space-y-1 pl-7">
            {q.options.map((opt, optIdx) => (
              <div key={optIdx} className="flex items-center gap-2">
                <button
                  onClick={() => setCorrect(qIdx, optIdx)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    q.correctIndex === optIdx ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'
                  }`}
                  title="Отметить как правильный"
                >
                  {q.correctIndex === optIdx && <span className="text-[8px]">✓</span>}
                </button>
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
            ))}
            {q.options.length < 6 && (
              <button onClick={() => addOption(qIdx)} className="text-[10px] text-primary font-display font-bold hover:underline pl-7">
                + Добавить вариант
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
