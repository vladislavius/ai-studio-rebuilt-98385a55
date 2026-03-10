import { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { AuthPage } from '@/pages/AuthPage';
import { Loader2 } from 'lucide-react';
import { GradientDots } from '@/components/ui/gradient-dots';

const CommandCenterPage = lazy(() => import('@/pages/CommandCenter').then(m => ({ default: m.CommandCenterPage })));
const OrgChartPage = lazy(() => import('@/pages/OrgChart').then(m => ({ default: m.OrgChartPage })));
const EmployeesPage = lazy(() => import('@/pages/Employees').then(m => ({ default: m.EmployeesPage })));
const AcademyPage = lazy(() => import('@/pages/Academy').then(m => ({ default: m.AcademyPage })));
const StatisticsPage = lazy(() => import('@/pages/Statistics').then(m => ({ default: m.StatisticsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminScalePage = lazy(() => import('@/pages/AdminScale').then(m => ({ default: m.AdminScalePage })));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}

const Index = () => {
  const { session, user, loading, isAdmin, signOut } = useAuth();
  const nav = useNavigation();
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);

  const handleCommandCenterNavigate = useCallback((target: string) => {
    if (target === 'employees') {
      nav.handleViewChange('employees');
    } else if (target === 'org_chart') {
      nav.handleViewChange('org_chart');
    } else if (target === 'statistics') {
      nav.handleStatisticsView(null);
    } else if (target === 'academy') {
      nav.handleViewChange('academy');
    } else if (target === 'employees_birthdays') {
      nav.handleViewChange('employees');
      nav.setEmployeeSubView('birthdays');
    } else if (target === 'employees_onboarding') {
      nav.handleViewChange('employees');
      nav.setEmployeeSubView('onboarding');
    } else if (target === 'employees_candidates') {
      nav.handleViewChange('employees');
      nav.setEmployeeSubView('list');
      nav.setListSubView('candidates');
    } else if (target === 'employees_add') {
      nav.handleViewChange('employees');
      setShowAddWizard(true);
    } else if (target.startsWith('employee_')) {
      const empId = target.replace('employee_', '');
      nav.handleViewChange('employees');
      setEditEmployeeId(empId);
    }
  }, [nav]);

  const handleAddEmployee = useCallback(() => {
    nav.handleViewChange('employees');
    setShowAddWizard(true);
  }, [nav]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      <GradientDots dotSize={2} spacing={22} duration={80} colorCycleDuration={20} className="opacity-[0.03] pointer-events-none z-0" />
      {nav.isMobileMenuOpen && (
        <div className="fixed inset-0 bg-background/60 z-30 md:hidden" onClick={nav.closeMobileMenu} />
      )}

      <AppSidebar
        currentView={nav.currentView}
        selectedDept={nav.selectedDept}
        isSidebarCollapsed={nav.isSidebarCollapsed}
        isMobileMenuOpen={nav.isMobileMenuOpen}
        isAdmin={isAdmin}
        onViewChange={nav.handleViewChange}
        onStatisticsView={nav.handleStatisticsView}
        onToggleSidebar={nav.toggleSidebar}
        onCloseMobileMenu={nav.closeMobileMenu}
        onLogout={signOut}
      />

      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <AppHeader
          isAdmin={isAdmin}
          userEmail={user?.email}
          onToggleMobileMenu={nav.toggleMobileMenu}
          onAddEmployee={handleAddEmployee}
          onStatisticsView={() => nav.handleStatisticsView(null)}
        />

        <div className="flex-1 p-4 md:p-8">
          <Suspense fallback={<PageLoader />}>
            {nav.currentView === 'command_center' && (
              <CommandCenterPage isAdmin={isAdmin} onNavigate={handleCommandCenterNavigate} />
            )}
            {nav.currentView === 'org_chart' && <OrgChartPage />}
            {nav.currentView === 'employees' && isAdmin && (
              <EmployeesPage
                employeeSubView={nav.employeeSubView}
                setEmployeeSubView={nav.setEmployeeSubView}
                listSubView={nav.listSubView}
                setListSubView={nav.setListSubView}
                documentsSubView={nav.documentsSubView}
                setDocumentsSubView={nav.setDocumentsSubView}
                initialEditId={editEmployeeId}
                showWizardOnMount={showAddWizard}
              />
            )}
            {nav.currentView === 'academy' && <AcademyPage />}
            {nav.currentView === 'statistics' && (
              <StatisticsPage selectedDeptId={nav.selectedDept} />
            )}
            {nav.currentView === 'settings' && isAdmin && <SettingsPage />}
            {nav.currentView === 'admin_scale' && <AdminScalePage />}
          </Suspense>
        </div>
      </main>

      <MobileBottomNav
        currentView={nav.currentView}
        onViewChange={nav.handleViewChange}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Index;
