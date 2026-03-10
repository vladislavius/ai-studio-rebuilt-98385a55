import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Props {
  questions: QuizQuestion[];
  onPassed: () => void;
  passingScore?: number; // percentage, default 80
}

export function QuizStep({ questions, onPassed, passingScore = 80 }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) return;
    setSubmitted(true);
  };

  const correctCount = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= passingScore;

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="bg-muted/30 rounded-xl p-4 space-y-2">
          <p className="text-sm font-display font-semibold text-foreground">{qIdx + 1}. {q.question}</p>
          <div className="space-y-1">
            {q.options.map((opt, optIdx) => {
              const selected = answers[qIdx] === optIdx;
              const isCorrect = q.correctIndex === optIdx;
              let style = 'border-border hover:bg-accent/50';
              if (submitted && selected && isCorrect) style = 'border-primary bg-primary/10';
              else if (submitted && selected && !isCorrect) style = 'border-destructive bg-destructive/10';
              else if (submitted && isCorrect) style = 'border-primary/50 bg-primary/5';
              else if (selected) style = 'border-primary bg-primary/5';

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelect(qIdx, optIdx)}
                  className={`w-full text-left p-3 border rounded-lg text-xs font-body transition-colors flex items-center gap-2 ${style}`}
                >
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-display font-bold">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {submitted && selected && isCorrect && <CheckCircle2 size={14} className="text-primary" />}
                  {submitted && selected && !isCorrect && <XCircle size={14} className="text-destructive" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
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
