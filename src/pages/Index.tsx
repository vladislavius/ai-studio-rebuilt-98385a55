import { useNavigation } from '@/hooks/useNavigation';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CommandCenterPage } from '@/pages/CommandCenter';
import { OrgChartPage } from '@/pages/OrgChart';
import { EmployeesPage } from '@/pages/Employees';
import { AcademyPage } from '@/pages/Academy';
import { StatisticsPage } from '@/pages/Statistics';
import { SettingsPage } from '@/pages/SettingsPage';

const Index = () => {
  const isAdmin = true; // Will be replaced with auth logic
  const employeeCount = 0;

  const nav = useNavigation();

  return (
    <div className="min-h-screen flex bg-background relative">
      {/* Mobile overlay */}
      {nav.isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/60 z-30 md:hidden"
          onClick={nav.closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        currentView={nav.currentView}
        selectedDept={nav.selectedDept}
        isSidebarCollapsed={nav.isSidebarCollapsed}
        isMobileMenuOpen={nav.isMobileMenuOpen}
        isAdmin={isAdmin}
        employeeCount={employeeCount}
        onViewChange={nav.handleViewChange}
        onStatisticsView={nav.handleStatisticsView}
        onToggleSidebar={nav.toggleSidebar}
        onCloseMobileMenu={nav.closeMobileMenu}
        onLogout={() => {}}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <AppHeader
          isAdmin={isAdmin}
          onToggleMobileMenu={nav.toggleMobileMenu}
          onAddEmployee={() => {}}
          onStatisticsView={() => nav.handleStatisticsView(null)}
        />

        <div className="flex-1 p-4 md:p-8">
          {nav.currentView === 'command_center' && (
            <CommandCenterPage isAdmin={isAdmin} employeeCount={employeeCount} />
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
        </div>
      </main>

      {/* Mobile navigation */}
      <MobileBottomNav
        currentView={nav.currentView}
        onViewChange={nav.handleViewChange}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Index;
