import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { EmployeeSubView, DocumentsSubView, ListSubView } from '@/types';
import { EMPLOYEE_TABS, DOCUMENTS_TABS, LIST_TABS } from '@/constants/navigation';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { AddEmployeeWizard } from '@/components/employees/AddEmployeeWizard';
import { BirthdayList } from '@/components/employees/BirthdayList';
import { useEmployees } from '@/hooks/useEmployees';

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
  const [showForm, setShowForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { data: employees } = useEmployees();

  const openCreate = () => { setShowWizard(true); };
  const openEdit = (id: string) => { setEditId(id); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditId(null); };
  const closeWizard = () => { setShowWizard(false); };

  return (
    <div className="space-y-4">
      {showForm && <EmployeeForm employeeId={editId} onClose={closeForm} />}
      {showWizard && <AddEmployeeWizard onClose={closeWizard} />}

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

          <div className="flex items-center gap-3">
            {employeeSubView === 'list' && employees && (
              <span className="text-xs font-display font-semibold text-muted-foreground bg-accent px-3 py-1.5 rounded-lg">
                ВСЕГО: {employees.length}
              </span>
            )}
            {employeeSubView === 'list' && (
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Сотрудник</span>
              </button>
            )}
          </div>
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
      <div className="bg-card border border-border rounded-xl p-5">
        {employeeSubView === 'list' && listSubView === 'employees' && (
          <EmployeeList onEdit={openEdit} />
        )}
        {employeeSubView === 'list' && listSubView === 'candidates' && (
          <div className="text-center py-12 text-muted-foreground font-body text-sm">Раздел кандидатов — в разработке</div>
        )}
        {employeeSubView === 'birthdays' && <BirthdayList />}
        {employeeSubView === 'reports' && (
          <div className="text-center py-12 text-muted-foreground font-body text-sm">Раздел отчётов — в разработке</div>
        )}
        {employeeSubView === 'onboarding' && (
          <div className="text-center py-12 text-muted-foreground font-body text-sm">Раздел онбординга — в разработке</div>
        )}
        {employeeSubView === 'documents' && (
          <div className="text-center py-12 text-muted-foreground font-body text-sm">Раздел документов — в разработке</div>
        )}
      </div>
    </div>
  );
}
