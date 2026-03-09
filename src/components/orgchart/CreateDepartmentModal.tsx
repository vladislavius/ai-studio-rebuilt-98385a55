import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateDepartment } from '@/hooks/useOrgChartMutations';
import { DBDepartment } from '@/hooks/useDepartments';

interface Props {
  open: boolean;
  onClose: () => void;
  parentDept?: DBDepartment | null;
  allDepts: DBDepartment[];
}

export function CreateDepartmentModal({ open, onClose, parentDept, allDepts }: Props) {
  const createDept = useCreateDepartment();
  const [form, setForm] = useState({
    name: '', full_name: '', code: '', description: '', vfp: '', goal: '',
    manager_name: '', color: parentDept?.color ?? '#4C5CFF', sort_order: 0,
  });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    await createDept.mutateAsync({
      ...form,
      parent_id: parentDept?.id ?? null,
    });
    onClose();
    setForm({ name: '', full_name: '', code: '', description: '', vfp: '', goal: '', manager_name: '', color: '#4C5CFF', sort_order: 0 });
  };

  const updateField = (f: string, v: string | number) => setForm(prev => ({ ...prev, [f]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {parentDept ? `Новый отдел в «${parentDept.name}»` : 'Новый департамент'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Департ X" />
            </div>
            <div className="space-y-2">
              <Label>Код *</Label>
              <Input value={form.code} onChange={e => updateField('code', e.target.value)} placeholder="deptX или divX" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Полное название</Label>
            <Input value={form.full_name} onChange={e => updateField('full_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Руководитель</Label>
              <Input value={form.manager_name} onChange={e => updateField('manager_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Порядок сортировки</Label>
              <Input type="number" value={form.sort_order} onChange={e => updateField('sort_order', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Цвет</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={e => updateField('color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
              <Input value={form.color} onChange={e => updateField('color', e.target.value)} className="flex-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>ЦКП</Label>
            <Textarea value={form.vfp} onChange={e => updateField('vfp', e.target.value)} rows={2} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleCreate} disabled={createDept.isPending || !form.name.trim() || !form.code.trim()}>
            {createDept.isPending ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
