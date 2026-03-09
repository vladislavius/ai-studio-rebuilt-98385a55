import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DBDepartment } from '@/hooks/useDepartments';
import {
  useUpdateDepartment,
  useDeleteDepartment,
  useDepartmentDiagnostics,
  useSaveDiagnostics,
} from '@/hooks/useOrgChartMutations';

interface Props {
  dept: DBDepartment | null;
  open: boolean;
  onClose: () => void;
}

export function DepartmentEditModal({ dept, open, onClose }: Props) {
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();
  const { data: diagnosticsData } = useDepartmentDiagnostics(dept?.id ?? null);
  const saveDiagnostics = useSaveDiagnostics();

  const [form, setForm] = useState({
    name: '', full_name: '', code: '', description: '', long_description: '',
    vfp: '', goal: '', manager_name: '', color: '#4C5CFF', main_stat: '',
    sort_order: 0,
  });

  const [problems, setProblems] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    if (dept) {
      setForm({
        name: dept.name ?? '', full_name: dept.full_name ?? '', code: dept.code ?? '',
        description: dept.description ?? '', long_description: dept.long_description ?? '',
        vfp: dept.vfp ?? '', goal: dept.goal ?? '', manager_name: dept.manager_name ?? '',
        color: dept.color ?? '#4C5CFF', main_stat: dept.main_stat ?? '',
        sort_order: dept.sort_order ?? 0,
      });
    }
  }, [dept]);

  useEffect(() => {
    if (diagnosticsData) {
      setProblems(diagnosticsData.filter(d => d.type === 'problem').map(d => d.text));
      setActions(diagnosticsData.filter(d => d.type === 'action').map(d => d.text));
    }
  }, [diagnosticsData]);

  if (!dept) return null;

  const handleSave = async () => {
    await updateDept.mutateAsync({ id: dept.id, ...form });
    await saveDiagnostics.mutateAsync({
      departmentId: dept.id,
      items: [
        ...problems.filter(Boolean).map((t, i) => ({ type: 'problem' as const, text: t, sort_order: i + 1 })),
        ...actions.filter(Boolean).map((t, i) => ({ type: 'action' as const, text: t, sort_order: i + 1 })),
      ],
    });
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('Удалить это подразделение? Все вложенные отделы и данные будут удалены.')) {
      await deleteDept.mutateAsync(dept.id);
      onClose();
    }
  };

  const updateField = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-card"
              style={{ backgroundColor: form.color }}
            >
              {form.sort_order}
            </span>
            Редактирование: {form.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="general">Основное</TabsTrigger>
            <TabsTrigger value="content">Описание и ЦКП</TabsTrigger>
            <TabsTrigger value="diagnostics">Диагностика</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input value={form.name} onChange={e => updateField('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Код</Label>
                <Input value={form.code} onChange={e => updateField('code', e.target.value)} />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Цвет</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={e => updateField('color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <Input value={form.color} onChange={e => updateField('color', e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ключевая статистика</Label>
                <Input value={form.main_stat} onChange={e => updateField('main_stat', e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Краткое описание</Label>
              <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Подробное описание</Label>
              <Textarea value={form.long_description} onChange={e => updateField('long_description', e.target.value)} rows={5} />
            </div>
            <div className="space-y-2">
              <Label>ЦКП (Ценный Конечный Продукт)</Label>
              <Textarea value={form.vfp} onChange={e => updateField('vfp', e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Цель</Label>
              <Textarea value={form.goal} onChange={e => updateField('goal', e.target.value)} rows={2} />
            </div>
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6 mt-4">
            {/* Problems */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-destructive font-bold">Признаки проблем</Label>
                <Button variant="ghost" size="sm" onClick={() => setProblems([...problems, ''])}>
                  <Plus size={14} className="mr-1" /> Добавить
                </Button>
              </div>
              {problems.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    value={p}
                    onChange={e => {
                      const next = [...problems];
                      next[i] = e.target.value;
                      setProblems(next);
                    }}
                    placeholder="Описание проблемы..."
                  />
                  <Button variant="ghost" size="icon" onClick={() => setProblems(problems.filter((_, j) => j !== i))}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-green-600 font-bold">Первоочередные действия</Label>
                <Button variant="ghost" size="sm" onClick={() => setActions([...actions, ''])}>
                  <Plus size={14} className="mr-1" /> Добавить
                </Button>
              </div>
              {actions.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    value={a}
                    onChange={e => {
                      const next = [...actions];
                      next[i] = e.target.value;
                      setActions(next);
                    }}
                    placeholder="Действие по развитию..."
                  />
                  <Button variant="ghost" size="icon" onClick={() => setActions(actions.filter((_, j) => j !== i))}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          {!dept.parent_id ? (
            <span className="text-xs text-muted-foreground">Корневой департамент</span>
          ) : (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 size={14} className="mr-1" /> Удалить
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave} disabled={updateDept.isPending}>
              {updateDept.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
