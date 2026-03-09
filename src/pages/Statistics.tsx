import { TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { ORGANIZATION_STRUCTURE } from '@/constants';

interface StatisticsPageProps {
  selectedDeptId: string | null;
}

export function StatisticsPage({ selectedDeptId }: StatisticsPageProps) {
  const dept = selectedDeptId ? ORGANIZATION_STRUCTURE[selectedDeptId] : null;

  const demoStats = [
    { name: 'Доход', value: '1,250,000', trend: 'up', change: '+12%' },
    { name: 'Производство', value: '847', trend: 'up', change: '+5%' },
    { name: 'Качество', value: '94%', trend: 'same', change: '0%' },
    { name: 'Обращения', value: '156', trend: 'down', change: '-8%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
          {dept ? `Статистики — ${dept.name}` : 'Дашборд статистик ОС'}
        </h1>
        <p className="text-sm text-muted-foreground font-body">
          {dept ? dept.fullName : 'Сводка по всем отделениям организации'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {demoStats.map(stat => (
          <div key={stat.name} className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-2">{stat.name}</p>
            <p className="text-2xl font-display font-bold text-foreground mb-1">{stat.value}</p>
            <div className={`flex items-center gap-1 text-xs font-display font-semibold ${
              stat.trend === 'up' ? 'text-primary' : stat.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {stat.trend === 'up' && <ArrowUp size={12} />}
              {stat.trend === 'down' && <ArrowDown size={12} />}
              {stat.trend === 'same' && <Minus size={12} />}
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-card border border-border rounded-xl p-8 min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <TrendingUp size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">Графики статистик будут отображаться после подключения БД</p>
        </div>
      </div>
    </div>
  );
}
