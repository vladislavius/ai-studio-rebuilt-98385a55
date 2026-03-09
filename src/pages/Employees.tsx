import { Users, Plus, UserPlus, Cake, UserCheck, FileText, BarChart3, Filter } from 'lucide-react';
import { EmployeeSubView, DocumentsSubView, ListSubView } from '@/types';
import { EMPLOYEE_TABS, DOCUMENTS_TABS, LIST_TABS } from '@/constants/navigation';

interface EmployeesPageProps {
  employeeSubView: EmployeeSubView;
  setEmployeeSubView: (v: EmployeeSubView) => void;
  listSubView: ListSubView;
  setListSubView: (v: ListSubView) => void;
  documentsSubView: DocumentsSubView;
  setDocumentsSubView: (v: DocumentsSubView) => void;
}

export function EmployeesPage({
  employeeSubView,
  setEmployeeSubView,
  listSubView,
  setListSubView,
  documentsSubView,
  setDocumentsSubView,
}: EmployeesPageProps) {
  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="bg-card p-4 md:p-5 rounded-xl border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-accent p-1.5 rounded-lg self-start sm:self-auto flex-wrap gap-1.5">
            {EMPLOYEE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setEmployeeSubView(tab.id)}
                className={`px-4 py-2.5 text-sm font-display font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  employeeSubView === tab.id
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {employeeSubView === 'list' && (
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 text-sm">
                {listSubView === 'employees' ? <><Plus size={16} /> <span className="hidden sm:inline">Сотрудник</span></> : <><UserPlus size={16} /> <span className="hidden sm:inline">Кандидат</span></>}
              </button>
            </div>
          )}
        </div>

        {/* List sub-tabs */}
        {employeeSubView === 'list' && (
          <div className="flex bg-accent p-1.5 rounded-lg gap-1.5">
            {LIST_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setListSubView(tab.id)}
                className={`flex-1 px-4 py-2.5 text-sm font-display font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  listSubView === tab.id
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Document sub-tabs */}
        {employeeSubView === 'documents' && (
          <div className="flex bg-accent p-1.5 rounded-lg gap-1.5">
            {DOCUMENTS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setDocumentsSubView(tab.id)}
                className={`flex-1 px-4 py-2.5 text-sm font-display font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  documentsSubView === tab.id
                    ? 'bg-card text-secondary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="bg-card border border-border rounded-xl p-8 text-center min-h-[300px] flex items-center justify-center">
        <div>
          <p className="text-muted-foreground font-body text-sm mb-2">
            {employeeSubView === 'list' && listSubView === 'employees' && 'Список сотрудников будет отображаться после подключения БД'}
            {employeeSubView === 'list' && listSubView === 'candidates' && 'Список кандидатов будет отображаться после подключения БД'}
            {employeeSubView === 'reports' && 'Отчёты будут отображаться после подключения БД'}
            {employeeSubView === 'birthdays' && 'Дни рождения будут отображаться после подключения БД'}
            {employeeSubView === 'onboarding' && 'Планы онбординга будут отображаться после подключения БД'}
            {employeeSubView === 'documents' && 'Документы будут отображаться после подключения БД'}
          </p>
          <p className="text-xs text-muted-foreground/60 font-body">Подключите Lovable Cloud для работы с данными</p>
        </div>
      </div>
    </div>
  );
}
