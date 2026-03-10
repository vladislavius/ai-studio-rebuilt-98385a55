import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EmployeeSubView, DocumentsSubView, ListSubView } from '@/types';
import { EMPLOYEE_TABS, DOCUMENTS_TABS, LIST_TABS } from '@/constants/navigation';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { AddEmployeeWizard } from '@/components/employees/AddEmployeeWizard';
import { BirthdayList } from '@/components/employees/BirthdayList';
import { CandidatesList } from '@/components/employees/CandidatesList';
import { OnboardingList } from '@/components/employees/OnboardingList';
import { ReportsList } from '@/components/employees/ReportsList';
import { DocumentsList } from '@/components/employees/DocumentsList';
import { useEmployees } from '@/hooks/useEmployees';
import { TubelightTabs } from '@/components/ui/tubelight-tabs';

interface EmployeesPageProps {
  employeeSubView: EmployeeSubView;
  setEmployeeSubView: (v: EmployeeSubView) => void;
  listSubView: ListSubView;
  setListSubView: (v: ListSubView) => void;
  documentsSubView: DocumentsSubView;
  setDocumentsSubView: (v: DocumentsSubView) => void;
  initialEditId?: string | null;
  showWizardOnMount?: boolean;
}

export function EmployeesPage({
  employeeSubView,
  setEmployeeSubView,
  listSubView,
  setListSubView,
  documentsSubView,
  setDocumentsSubView,
  initialEditId,
  showWizardOnMount,
}: EmployeesPageProps) {
  const [showForm, setShowForm] = useState(!!initialEditId);
  const [showWizard, setShowWizard] = useState(!!showWizardOnMount);
  const [editId, setEditId] = useState<string | null>(initialEditId ?? null);
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
          <TubelightTabs
            items={EMPLOYEE_TABS}
            activeId={employeeSubView}
            onSelect={(id) => setEmployeeSubView(id as EmployeeSubView)}
            variant="compact"
          />

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

        {employeeSubView === 'list' && (
          <TubelightTabs
            items={LIST_TABS}
            activeId={listSubView}
            onSelect={(id) => setListSubView(id as ListSubView)}
            variant="pill"
          />
        )}

        {employeeSubView === 'documents' && (
          <TubelightTabs
            items={DOCUMENTS_TABS}
            activeId={documentsSubView}
            onSelect={(id) => setDocumentsSubView(id as DocumentsSubView)}
            variant="pill"
          />
        )}
      </div>

      {/* Content area */}
      <div className="bg-card border border-border rounded-xl p-5">
        {employeeSubView === 'list' && listSubView === 'employees' && (
          <EmployeeList onEdit={openEdit} />
        )}
        {employeeSubView === 'list' && listSubView === 'candidates' && (
          <CandidatesList />
        )}
        {employeeSubView === 'birthdays' && <BirthdayList />}
        {employeeSubView === 'reports' && <ReportsList />}
        {employeeSubView === 'onboarding' && <OnboardingList />}
        {employeeSubView === 'documents' && <DocumentsList subView={documentsSubView} />}
      </div>
    </div>
  );
}
