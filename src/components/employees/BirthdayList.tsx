import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { Cake, Mail, Download, PartyPopper } from 'lucide-react';
import { CyberneticCard } from '@/components/ui/cybernetic-card';

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTH_NAMES_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const SEASON_COLORS: Record<string, string> = {
  winter: 'hsl(var(--secondary))',
  spring: 'hsl(120, 60%, 45%)',
  summer: 'hsl(var(--primary))',
  autumn: 'hsl(25, 90%, 55%)',
};

function getSeason(month: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  if (month <= 1 || month === 11) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'autumn';
}

export function BirthdayList() {
  const { data: employees, isLoading } = useEmployees();
  const { data: departments } = useDepartments();

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  const deptMap = new Map(departments?.map(d => [d.id, d]) ?? []);
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
      const nextBd = new Date(today.getFullYear(), month, day);
      if (nextBd < today) nextBd.setFullYear(nextBd.getFullYear() + 1);
      const daysUntil = Math.ceil((nextBd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...e, isToday, daysUntil, bdMonth: month, bdDay: day };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const todayCount = withBirthdays.filter(e => e.isToday).length;
  const upcomingCount = withBirthdays.filter(e => e.daysUntil > 0 && e.daysUntil <= 14).length;
  const totalCount = withBirthdays.length;

  // Group by month
  const byMonth: Record<number, typeof withBirthdays> = {};
  for (let i = 0; i < 12; i++) byMonth[i] = [];
  withBirthdays.forEach(e => byMonth[e.bdMonth].push(e));

  // Upcoming (next 14 days, max 5)
  const upcoming = withBirthdays.filter(e => e.daysUntil > 0 && e.daysUntil <= 30).slice(0, 5);

  const exportCSV = () => {
    const header = 'ФИО,Должность,Дата рождения\n';
    const rows = withBirthdays.map(e => {
      const bd = new Date(e.birth_date!);
      return `"${e.full_name}","${e.position}","${bd.toLocaleDateString('ru-RU')}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'birthdays.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Cake, value: todayCount, label: 'СЕГОДНЯ', color: 'hsl(var(--destructive))' },
          { icon: PartyPopper, value: upcomingCount, label: 'БЛИЖАЙШИЕ', color: 'hsl(var(--secondary))' },
          { icon: Cake, value: totalCount, label: 'ВСЕГО', color: 'hsl(var(--destructive))' },
        ].map((stat, i) => (
          <CyberneticCard key={i} glowColor={stat.color} className="p-5 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.color }}>
                <stat.icon size={14} className="text-primary-foreground" />
              </div>
              <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
          </CyberneticCard>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl hover:bg-primary/90 transition-all">
          <Mail size={16} /> Email
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-2 bg-accent text-foreground font-display font-bold text-sm py-3 rounded-xl border border-border hover:border-primary/30 transition-all"
        >
          <Download size={16} /> CSV
        </button>
      </div>

      {/* Upcoming birthdays */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
            <span className="text-lg">🎉</span> Скоро празднуем
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {upcoming.map(emp => {
              const mainDept = (emp.department_ids ?? []).map(id => deptMap.get(id)).filter(Boolean)[0];
              const initials = emp.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const bdDate = new Date(emp.birth_date!);
              return (
                <div key={emp.id} className="flex items-center gap-3 min-w-[220px] bg-accent/50 rounded-xl p-3 border border-border/50">
                  {emp.photo_url ? (
                    <img src={emp.photo_url} alt={emp.full_name} className="w-10 h-10 rounded-full object-cover border-2 border-border flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-border flex-shrink-0">
                      <span className="text-xs font-display font-bold text-foreground">{initials}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-display font-bold text-foreground truncate">{emp.full_name}</p>
                    <p className="text-[10px] text-muted-foreground font-body truncate">
                      {mainDept?.name ?? emp.position}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-display font-bold text-foreground">
                      {bdDate.getDate()} {MONTH_NAMES_RU[bdDate.getMonth()]}
                    </p>
                    <p className="text-[10px] font-display text-muted-foreground">
                      через {emp.daysUntil} дн.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-display font-bold text-foreground">Календарь</h2>
          <div className="flex items-center gap-3 text-[10px] font-display text-muted-foreground">
            {Object.entries(SEASON_COLORS).map(([season, color]) => (
              <span key={season} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {season === 'winter' ? 'Зима' : season === 'spring' ? 'Весна' : season === 'summer' ? 'Лето' : 'Осень'}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }, (_, month) => {
            const monthEmps = byMonth[month];
            const season = getSeason(month);
            const seasonColor = SEASON_COLORS[season];
            const isCurrent = month === currentMonth;

            return (
              <CyberneticCard
                key={month}
                glowColor={seasonColor}
                className={`p-4 ${isCurrent ? 'border-primary' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-display font-bold uppercase tracking-wider" style={{ color: seasonColor }}>
                    {MONTH_NAMES[month]}
                  </h3>
                  {monthEmps.length > 0 && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-display font-bold text-primary-foreground"
                      style={{ backgroundColor: seasonColor }}
                    >
                      {monthEmps.length}
                    </span>
                  )}
                </div>

                {monthEmps.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/40 font-body italic">—</p>
                ) : (
                  <div className="space-y-1.5">
                    {monthEmps
                      .sort((a, b) => a.bdDay - b.bdDay)
                      .map(emp => (
                        <div key={emp.id} className="flex items-center gap-2">
                          <span className="text-[11px] font-display font-bold text-muted-foreground w-5 text-right">{emp.bdDay}</span>
                          <span className={`text-[11px] font-body truncate ${emp.isToday ? 'text-primary font-bold' : 'text-foreground/80'}`}>
                            {emp.full_name}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CyberneticCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
