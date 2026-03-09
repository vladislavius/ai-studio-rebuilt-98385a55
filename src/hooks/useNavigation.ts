import { useState, useCallback } from 'react';
import { ViewMode, EmployeeSubView, DocumentsSubView, ListSubView } from '@/types';

export function useNavigation() {
  const [currentView, setCurrentView] = useState<ViewMode>('command_center');
  const [employeeSubView, setEmployeeSubView] = useState<EmployeeSubView>('list');
  const [listSubView, setListSubView] = useState<ListSubView>('employees');
  const [documentsSubView, setDocumentsSubView] = useState<DocumentsSubView>('sent');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleViewChange = useCallback((view: ViewMode) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  }, []);

  const handleStatisticsView = useCallback((deptId: string | null = null) => {
    setSelectedDept(deptId);
    setCurrentView('statistics');
    setIsMobileMenuOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen(prev => !prev), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  return {
    currentView,
    employeeSubView,
    setEmployeeSubView,
    listSubView,
    setListSubView,
    documentsSubView,
    setDocumentsSubView,
    selectedDept,
    isSidebarCollapsed,
    isMobileMenuOpen,
    handleViewChange,
    handleStatisticsView,
    toggleSidebar,
    toggleMobileMenu,
    closeMobileMenu,
  };
}
