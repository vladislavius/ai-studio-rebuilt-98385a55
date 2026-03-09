import { useEmployees } from '@/hooks/useEmployees';
import { Cake } from 'lucide-react';

export function BirthdayList() {
  const { data: employees, isLoading } = useEmployees();

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const withBirthdays = (employees ?? [])
    .filter(e => e.birth_date)
    .map(e => {
      const bd = new Date(e.birth_date!);
      const month = bd.getMonth();
      const day = bd.getDate();
      const isToday = month === currentMonth && day === currentDay;
      const isThisMonth = month === currentMonth;
      const nextBd = new Date(today.getFullYear(), month, day);
      if (nextBd < today) nextBd.setFullYear(nextBd.getFullYear() + 1);
      const daysUntil = Math.ceil((nextBd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...e, isToday, isThisMonth, daysUntil, bdDate: bd };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-display font-medium">
        Сотрудников с днями рождения: {withBirthdays.length}
      </p>
      {withBirthdays.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm font-body">Нет данных о днях рождения</div>
      ) : (
        <div className="space-y-2">
          {withBirthdays.map(emp => (
            <div key={emp.id} className={`bg-card border rounded-xl p-4 flex items-center gap-4 ${emp.isToday ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${emp.isToday ? 'bg-primary/20' : 'bg-accent'}`}>
                <Cake size={18} className={emp.isToday ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-foreground text-sm">{emp.full_name}</p>
                <p className="text-xs text-muted-foreground font-body">{emp.position}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-display font-bold text-foreground">
                  {emp.bdDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </p>
                <p className={`text-xs font-display font-medium ${emp.isToday ? 'text-primary' : emp.daysUntil <= 7 ? 'text-secondary' : 'text-muted-foreground'}`}>
                  {emp.isToday ? '🎉 Сегодня!' : `через ${emp.daysUntil} дн.`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
