import { Settings, Database, Bell, Shield, Download, Upload } from 'lucide-react';

export function SettingsPage() {
  const sections = [
    { icon: Database, title: 'База данных', desc: 'Настройки подключения к Lovable Cloud' },
    { icon: Bell, title: 'Уведомления', desc: 'Telegram-бот и push-уведомления' },
    { icon: Shield, title: 'Безопасность', desc: 'Управление доступом и ролями' },
    { icon: Download, title: 'Импорт данных', desc: 'Загрузка сотрудников из файла' },
    { icon: Upload, title: 'Экспорт данных', desc: 'Выгрузка данных в Excel/CSV' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Настройки</h1>
        <p className="text-sm text-muted-foreground font-body">Конфигурация системы и интеграции</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(section => (
          <button
            key={section.title}
            className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/20 transition-all group"
          >
            <section.icon size={20} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-display font-semibold text-foreground mb-1">{section.title}</h3>
            <p className="text-xs text-muted-foreground font-body">{section.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
