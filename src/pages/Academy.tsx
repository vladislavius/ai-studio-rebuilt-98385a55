import { GraduationCap, BookOpen, Award, Plus } from 'lucide-react';

export function AcademyPage() {
  const demoCourses = [
    { title: 'Введение в компанию', sections: 5, duration: '2 часа', status: 'active' },
    { title: 'Основы работы с CRM', sections: 8, duration: '4 часа', status: 'active' },
    { title: 'Стандарты обслуживания', sections: 12, duration: '6 часов', status: 'draft' },
    { title: 'Статистики и Условия', sections: 13, duration: '8 часов', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Академия</h1>
          <p className="text-sm text-muted-foreground font-body">Система обучения и развития сотрудников</p>
        </div>
        <button className="px-4 py-2.5 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 text-sm">
          <Plus size={16} /> Создать курс
        </button>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoCourses.map((course, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen size={20} className="text-primary" />
              </div>
              <span className={`text-[10px] font-display font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                course.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {course.status === 'active' ? 'Активен' : 'Черновик'}
              </span>
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
              <span>{course.sections} секций</span>
              <span>{course.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
