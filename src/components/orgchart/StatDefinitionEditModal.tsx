import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import { useCreateStatDefinition, useUpdateStatDefinition, useDeleteStatDefinition } from '@/hooks/useOrgChartMutations';

interface StatDef {
  id: string;
  title: string;
  description: string | null;
  is_double: boolean | null;
  inverted: boolean | null;
  calculation_method: string | null;
  purpose: string | null;
  owner_type: string;
  owner_id: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  stat: StatDef | null; // null = create mode
  ownerId: string;
  ownerType?: string;
}

export function StatDefinitionEditModal({ open, onClose, stat, ownerId, ownerType = 'department' }: Props) {
  const createStat = useCreateStatDefinition();
  const updateStat = useUpdateStatDefinition();
  const deleteStat = useDeleteStatDefinition();

  const [form, setForm] = useState({
    title: '', description: '', calculation_method: '', purpose: '',
    is_double: false, inverted: false,
  });

  useEffect(() => {
    if (stat) {
      setForm({
        title: stat.title ?? '', description: stat.description ?? '',
        calculation_method: stat.calculation_method ?? '', purpose: stat.purpose ?? '',
        is_double: stat.is_double ?? false, inverted: stat.inverted ?? false,
      });
    } else {
      setForm({ title: '', description: '', calculation_method: '', purpose: '', is_double: false, inverted: false });
    }
  }, [stat]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (stat) {
      await updateStat.mutateAsync({ id: stat.id, ...form });
    } else {
      await createStat.mutateAsync({ ...form, owner_type: ownerType, owner_id: ownerId });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (stat && confirm('Удалить эту статистику и все её значения?')) {
      await deleteStat.mutateAsync(stat.id);
      onClose();
    }
  };

  const updateField = (f: string, v: any) => setForm(prev => ({ ...prev, [f]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{stat ? 'Редактировать статистику' : 'Новая статистика'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Название *</Label>
            <Input value={form.title} onChange={e => updateField('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Метод расчёта</Label>
            <Textarea value={form.calculation_method} onChange={e => updateField('calculation_method', e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Назначение (тег, напр. «ГСД»)</Label>
            <Input value={form.purpose} onChange={e => updateField('purpose', e.target.value)} />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_double} onCheckedChange={v => updateField('is_double', v)} />
              <Label>Двойная статистика</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.inverted} onCheckedChange={v => updateField('inverted', v)} />
              <Label>Обратная (рост = ухудшение)</Label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          {stat ? (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 size={14} className="mr-1" /> Удалить
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>Сохранить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
