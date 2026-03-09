import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCompanySettings, useUpdateCompanySetting } from '@/hooks/useOrgChartMutations';

interface Props {
  open: boolean;
  onClose: () => void;
}

const FIELDS = [
  { key: 'founder_title', label: 'Заголовок блока «Основатель»', multiline: false },
  { key: 'founder_subtitle', label: 'Подзаголовок блока «Основатель»', multiline: false },
  { key: 'ceo_title', label: 'Заголовок блока «Директор»', multiline: false },
  { key: 'ceo_subtitle', label: 'Подзаголовок блока «Директор»', multiline: false },
  { key: 'company_goal', label: 'Цель компании', multiline: true },
  { key: 'company_vfp', label: 'ЦКП компании', multiline: true },
];

export function CompanySettingsModal({ open, onClose }: Props) {
  const { data: settings } = useCompanySettings();
  const updateSetting = useUpdateCompanySetting();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const handleSave = async () => {
    for (const field of FIELDS) {
      if (form[field.key] !== settings?.[field.key]) {
        await updateSetting.mutateAsync({ key: field.key, value: form[field.key] ?? '' });
      }
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки компании</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {FIELDS.map(f => (
            <div key={f.key} className="space-y-2">
              <Label>{f.label}</Label>
              {f.multiline ? (
                <Textarea
                  value={form[f.key] ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  rows={4}
                />
              ) : (
                <Input
                  value={form[f.key] ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave} disabled={updateSetting.isPending}>
            {updateSetting.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
