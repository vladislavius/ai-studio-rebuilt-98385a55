import { useState } from 'react';
import { Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Module {
  title: string;
  topics: string;
  complexity: string;
}

interface GeneratedItem {
  id: string;
  order: number;
  type: string;
  title: string;
  content: string;
}

interface Props {
  courseTitle: string;
  onGenerated: (items: GeneratedItem[]) => void;
  onClose: () => void;
}

export function GenerateChecksheetModal({ courseTitle, onGenerated, onClose }: Props) {
  const [audience, setAudience] = useState('');
  const [finalProduct, setFinalProduct] = useState('');
  const [weeks, setWeeks] = useState('4');
  const [modules, setModules] = useState<Module[]>([{ title: '', topics: '', complexity: 'начальный' }]);
  const [loading, setLoading] = useState(false);

  const addModule = () => setModules(prev => [...prev, { title: '', topics: '', complexity: 'средний' }]);
  const removeModule = (idx: number) => setModules(prev => prev.filter((_, i) => i !== idx));
  const updateModule = (idx: number, field: keyof Module, value: string) => {
    setModules(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const generate = async () => {
    if (!audience.trim() && !finalProduct.trim() && modules.every(m => !m.title.trim())) {
      toast.error('Заполните хотя бы одно поле');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-checksheet', {
        body: {
          course_title: courseTitle,
          target_audience: audience,
          final_product: finalProduct,
          time_frame_weeks: parseInt(weeks) || 4,
          modules: modules.filter(m => m.title.trim()).map(m => ({
            title: m.title,
            topics: m.topics.split(',').map(t => t.trim()).filter(Boolean),
            complexity: m.complexity,
          })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.items?.length) {
        onGenerated(data.items);
        toast.success(`Сгенерировано ${data.items.length} пунктов`);
        onClose();
      } else {
        toast.error('ИИ не вернул пункты');
      }
    } catch (e: any) {
      toast.error(e.message || 'Ошибка генерации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h3 className="font-display font-bold text-foreground">Сгенерировать чекшит с ИИ</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          ИИ-методист создаст контрольный лист по технологии обучения Хаббарда на основе параметров курса.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Целевая аудитория</label>
            <Textarea value={audience} onChange={e => setAudience(e.target.value)} rows={2} placeholder="Новые сотрудники отдела продаж, без опыта..." className="bg-background resize-none text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Конечный продукт / компетенция</label>
            <Textarea value={finalProduct} onChange={e => setFinalProduct(e.target.value)} rows={2} placeholder="Сотрудник, способный самостоятельно вести переговоры..." className="bg-background resize-none text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Длительность (недель)</label>
            <Input type="number" value={weeks} onChange={e => setWeeks(e.target.value)} min={1} max={52} className="bg-background w-24 text-sm" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase">Модули</label>
              <button onClick={addModule} className="text-xs text-primary flex items-center gap-1 hover:underline"><Plus size={12} /> Добавить</button>
            </div>
            {modules.map((mod, idx) => (
              <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-bold w-5">{idx + 1}.</span>
                  <Input value={mod.title} onChange={e => updateModule(idx, 'title', e.target.value)} placeholder="Название модуля" className="flex-1 h-8 text-xs bg-background" />
                  <Select value={mod.complexity} onValueChange={v => updateModule(idx, 'complexity', v)}>
                    <SelectTrigger className="w-28 h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="начальный">Начальный</SelectItem>
                      <SelectItem value="средний">Средний</SelectItem>
                      <SelectItem value="продвинутый">Продвинутый</SelectItem>
                    </SelectContent>
                  </Select>
                  {modules.length > 1 && (
                    <button onClick={() => removeModule(idx)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                  )}
                </div>
                <Input value={mod.topics} onChange={e => updateModule(idx, 'topics', e.target.value)} placeholder="Темы через запятую: Тема 1, Тема 2, ..." className="h-8 text-xs bg-background" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Отмена</Button>
          <Button size="sm" onClick={generate} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? 'Генерация...' : 'Сгенерировать'}
          </Button>
        </div>
      </div>
    </div>
  );
}
