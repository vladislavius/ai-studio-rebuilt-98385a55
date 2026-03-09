import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CommandCenterPage } from '@/pages/CommandCenter';
import { OrgChartPage } from '@/pages/OrgChart';
import { EmployeesPage } from '@/pages/Employees';
import { AcademyPage } from '@/pages/Academy';
import { StatisticsPage } from '@/pages/Statistics';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminScalePage } from '@/pages/AdminScale';
import { AuthPage } from '@/pages/AuthPage';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { session, user, loading, isAdmin, signOut } = useAuth();
  const nav = useNavigation();

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
    <div className="min-h-screen flex bg-background relative">
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
          onAddEmployee={() => {}}
          onStatisticsView={() => nav.handleStatisticsView(null)}
        />

        <div className="flex-1 p-4 md:p-8">
          {nav.currentView === 'command_center' && (
            <CommandCenterPage isAdmin={isAdmin} />
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
            />
          )}
          {nav.currentView === 'academy' && <AcademyPage />}
          {nav.currentView === 'statistics' && (
            <StatisticsPage selectedDeptId={nav.selectedDept} />
          )}
          {nav.currentView === 'settings' && isAdmin && <SettingsPage />}
          {nav.currentView === 'admin_scale' && <AdminScalePage />}
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
