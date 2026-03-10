import { useState } from 'react';
import { Settings, Database, Bell, Shield, Download, Upload, Users, FileText, Loader2, Type } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLabels } from '@/hooks/useLabels';
import { EditableLabel } from '@/components/ui/editable-label';
import { TerminologyEditor } from '@/components/settings/TerminologyEditor';
import { toast } from 'sonner';

export function SettingsPage() {
  const { user } = useAuth();
  const { t } = useLabels();
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const { data: userRoles } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data;
    },
  });

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
          <h2 className="font-display font-bold text-foreground">Пользователи системы</h2>
          {profiles?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет пользователей</p>
          ) : (
            <div className="space-y-2">
              {(profiles ?? []).map(p => {
                const roles = userRoles?.filter(r => r.user_id === p.user_id) ?? [];
                const isCurrentUser = p.user_id === user?.id;
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-muted/30 border border-border rounded-xl p-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-display font-bold text-primary">
                        {(p.display_name ?? p.email ?? '?').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-foreground text-sm truncate">
                        {p.display_name ?? p.email ?? '—'}
                        {isCurrentUser && <span className="text-primary text-[10px] ml-2">(вы)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-body truncate">{p.email}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {roles.map(r => (
                        <span key={r.id} className={`text-[10px] px-2 py-0.5 rounded font-display font-bold ${
                          r.role === 'admin' ? 'bg-primary/10 text-primary' :
                          r.role === 'moderator' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {r.role === 'admin' ? 'Админ' : r.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
