import { useState } from 'react';
import { Database, Bell, Download, Users, FileText, Type } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLabels } from '@/hooks/useLabels';
import { EditableLabel } from '@/components/ui/editable-label';
import { TerminologyEditor } from '@/components/settings/TerminologyEditor';
import { UserRoleManager } from '@/components/settings/UserRoleManager';
import { toast } from 'sonner';

export function SettingsPage() {
  const { t } = useLabels();
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    },
  });

  const exportEmployeesCSV = () => {
    if (!employees?.length) { toast.error('Нет данных для экспорта'); return; }
    const headers = ['ФИО', 'Должность', 'Телефон', 'Email', 'Telegram', 'Дата рождения', 'Дата приёма'];
    const rows = employees.map(e => [
      e.full_name, e.position, e.phone ?? '', e.email ?? '',
      e.telegram_username ?? '', e.birth_date ?? '', e.join_date ?? ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `employees_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Экспортировано ${employees.length} сотрудников`);
  };

  const exportDepartmentsCSV = () => {
    if (!departments?.length) { toast.error('Нет данных'); return; }
    const headers = ['Код', 'Название', 'Полное название', 'Руководитель', 'ЦКП', 'Цель'];
    const rows = departments.map(d => [
      d.code, d.name, d.full_name ?? '', d.manager_name ?? '', d.vfp ?? '', d.goal ?? ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `departments_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Экспортировано ${departments.length} подразделений`);
  };

  const sections = [
    { id: 'terminology', icon: Type, title: t('settings.terminology'), desc: t('settings.terminology_desc') },
    { id: 'users', icon: Users, title: t('settings.users'), desc: `${profiles?.length ?? 0} пользователей в системе` },
    { id: 'export', icon: Download, title: t('settings.export'), desc: 'Выгрузка сотрудников и оргсхемы в CSV' },
    { id: 'database', icon: Database, title: t('settings.database'), desc: 'Информация о подключении к Lovable Cloud' },
    { id: 'notifications', icon: Bell, title: t('settings.notifications'), desc: 'Настройки уведомлений (в разработке)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <EditableLabel labelKey="settings.title" as="h1" className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1" />
        <EditableLabel labelKey="settings.subtitle" as="p" className="text-sm text-muted-foreground font-body" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
            className={`bg-card border rounded-xl p-5 text-left hover:border-primary/20 transition-all group ${activeSection === section.id ? 'border-primary' : 'border-border'}`}
          >
            <section.icon size={20} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-display font-semibold text-foreground mb-1">{section.title}</h3>
            <p className="text-xs text-muted-foreground font-body">{section.desc}</p>
          </button>
        ))}
      </div>

      {/* Terminology Editor */}
      {activeSection === 'terminology' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <TerminologyEditor />
        </div>
      )}

      {/* Users & Roles */}
      {activeSection === 'users' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="font-display font-bold text-foreground">Пользователи системы</h2>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Назначайте и снимайте роли. Кнопка «Роль» открывает список доступных ролей.
            </p>
          </div>
          <UserRoleManager />
        </div>
      )}

      {/* Export */}
      {activeSection === 'export' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">{t('settings.export')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={exportEmployeesCSV}
              className="flex items-center gap-3 p-4 border border-border rounded-xl hover:border-primary/30 hover:bg-accent/50 transition-all text-left"
            >
              <Users size={20} className="text-primary flex-shrink-0" />
              <div>
                <p className="font-display font-semibold text-foreground text-sm">Сотрудники (CSV)</p>
                <p className="text-xs text-muted-foreground">{employees?.length ?? 0} записей</p>
              </div>
            </button>
            <button
              onClick={exportDepartmentsCSV}
              className="flex items-center gap-3 p-4 border border-border rounded-xl hover:border-primary/30 hover:bg-accent/50 transition-all text-left"
            >
              <FileText size={20} className="text-primary flex-shrink-0" />
              <div>
                <p className="font-display font-semibold text-foreground text-sm">Оргсхема (CSV)</p>
                <p className="text-xs text-muted-foreground">{departments?.length ?? 0} подразделений</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Database info */}
      {activeSection === 'database' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-display font-bold text-foreground">Lovable Cloud</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] font-display font-bold text-muted-foreground uppercase mb-1">Статус</p>
              <p className="text-foreground font-display font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Подключено
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] font-display font-bold text-muted-foreground uppercase mb-1">Таблиц</p>
              <p className="text-foreground font-display font-semibold">16</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications placeholder */}
      {activeSection === 'notifications' && (
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <Bell size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-display font-semibold text-foreground mb-1">{t('settings.notifications')}</p>
          <p className="text-xs text-muted-foreground">Функция находится в разработке. Здесь будет настройка Telegram-бота и push-уведомлений.</p>
        </div>
      )}
    </div>
  );
}
