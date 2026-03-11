import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
  multiSelect?: boolean;
}

interface Props {
  questions: QuizQuestion[];
  onPassed: () => void;
  passingScore?: number; // percentage, default 80
}

export function QuizStep({ questions, onPassed, passingScore = 80 }: Props) {
  // single: Record<qIdx, optIdx>
  const [singleAnswers, setSingleAnswers] = useState<Record<number, number>>({});
  // multi: Record<qIdx, Set<optIdx>>
  const [multiAnswers, setMultiAnswers] = useState<Record<number, number[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelectSingle = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setSingleAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleToggleMulti = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setMultiAnswers(prev => {
      const cur = prev[qIdx] ?? [];
      const next = cur.includes(optIdx) ? cur.filter(i => i !== optIdx) : [...cur, optIdx];
      return { ...prev, [qIdx]: next };
    });
  };

  const isAnswered = (qIdx: number, q: QuizQuestion) => {
    if (q.multiSelect) return (multiAnswers[qIdx] ?? []).length > 0;
    return singleAnswers[qIdx] !== undefined;
  };

  const allAnswered = questions.every((q, i) => isAnswered(i, q));

  const isQuestionCorrect = (qIdx: number, q: QuizQuestion): boolean => {
    if (q.multiSelect) {
      const selected = new Set(multiAnswers[qIdx] ?? []);
      const correct = new Set(q.correctIndices ?? [q.correctIndex]);
      if (selected.size !== correct.size) return false;
      for (const v of correct) if (!selected.has(v)) return false;
      return true;
    }
    return singleAnswers[qIdx] === q.correctIndex;
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  const correctCount = submitted ? questions.filter((q, i) => isQuestionCorrect(i, q)).length : 0;
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const passed = score >= passingScore;

  const reset = () => {
    setSingleAnswers({});
    setMultiAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="bg-muted/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-display font-semibold text-foreground flex-1">{qIdx + 1}. {q.question}</p>
            {q.multiSelect && (
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full font-display font-bold border border-indigo-500/20 shrink-0">
                Несколько ответов
              </span>
            )}
          </div>
          <div className="space-y-1">
            {q.options.map((opt, optIdx) => {
              const isSelected = q.multiSelect
                ? (multiAnswers[qIdx] ?? []).includes(optIdx)
                : singleAnswers[qIdx] === optIdx;
              const isCorrect = q.multiSelect
                ? (q.correctIndices ?? [q.correctIndex]).includes(optIdx)
                : q.correctIndex === optIdx;

              let style = 'border-border hover:bg-accent/50';
              if (submitted && isSelected && isCorrect) style = 'border-primary bg-primary/10';
              else if (submitted && isSelected && !isCorrect) style = 'border-destructive bg-destructive/10';
              else if (submitted && isCorrect) style = 'border-primary/50 bg-primary/5';
              else if (isSelected) style = 'border-primary bg-primary/5';

              return (
                <button
                  key={optIdx}
                  onClick={() => q.multiSelect ? handleToggleMulti(qIdx, optIdx) : handleSelectSingle(qIdx, optIdx)}
                  className={`w-full text-left p-3 border rounded-lg text-xs font-body transition-colors flex items-center gap-2 ${style}`}
                >
                  {/* Shape: circle for single, square for multi */}
                  <span className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-display font-bold transition-colors ${
                    q.multiSelect ? 'rounded' : 'rounded-full'
                  } ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'}`}>
                    {isSelected ? '✓' : String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {submitted && isSelected && isCorrect && <CheckCircle2 size={14} className="text-primary" />}
                  {submitted && isSelected && !isCorrect && <XCircle size={14} className="text-destructive" />}
                  {submitted && !isSelected && isCorrect && <CheckCircle2 size={14} className="text-primary/50" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          Проверить ответы
        </button>
      ) : (
        <div className="space-y-3">
          <div className={`p-4 rounded-xl border ${passed ? 'border-primary bg-primary/5' : 'border-destructive bg-destructive/5'}`}>
            <div className="flex items-center gap-2 mb-1">
              {passed ? <CheckCircle2 size={18} className="text-primary" /> : <XCircle size={18} className="text-destructive" />}
              <p className="text-sm font-display font-bold text-foreground">
                {passed ? 'Тест пройден!' : 'Тест не пройден'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              Результат: {correctCount} из {questions.length} ({score}%). Проходной балл: {passingScore}%.
            </p>
          </div>
          {passed ? (
            <button onClick={onPassed} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> Продолжить
            </button>
          ) : (
            <button onClick={reset} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground flex items-center gap-1.5">
              <RotateCcw size={14} /> Попробовать снова
            </button>
          )}
        </div>
      )}
    </div>
  );
}
