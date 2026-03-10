import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ViewMode, EmployeeSubView, DocumentsSubView, ListSubView } from '@/types';

const DEFAULT_VIEW: ViewMode = 'command_center';
const DEFAULT_EMP_SUB: EmployeeSubView = 'list';
const DEFAULT_LIST_SUB: ListSubView = 'employees';
const DEFAULT_DOCS_SUB: DocumentsSubView = 'sent';

export function useNavigation() {
  const [params, setParams] = useSearchParams();

  const currentView = (params.get('view') as ViewMode) ?? DEFAULT_VIEW;
  const employeeSubView = (params.get('sub') as EmployeeSubView) ?? DEFAULT_EMP_SUB;
  const listSubView = (params.get('list_sub') as ListSubView) ?? DEFAULT_LIST_SUB;
  const documentsSubView = (params.get('docs_sub') as DocumentsSubView) ?? DEFAULT_DOCS_SUB;
  const selectedDept = params.get('dept') ?? null;
  const isSidebarCollapsed = params.get('sidebar') === '1';
  const isMobileMenuOpen = params.get('mobile_menu') === '1';

  const set = useCallback((updates: Record<string, string | null>) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      return next;
    });
  }, [setParams]);

  const handleViewChange = useCallback((view: ViewMode) => {
    set({ view, mobile_menu: null });
  }, [set]);

  const handleStatisticsView = useCallback((deptId: string | null = null) => {
    set({ view: 'statistics', dept: deptId, mobile_menu: null });
  }, [set]);

  const setEmployeeSubView = useCallback((sub: EmployeeSubView) => {
    set({ sub });
  }, [set]);

  const setListSubView = useCallback((list_sub: ListSubView) => {
    set({ list_sub });
  }, [set]);

  const setDocumentsSubView = useCallback((docs_sub: DocumentsSubView) => {
    set({ docs_sub });
  }, [set]);

  const toggleSidebar = useCallback(() => {
    set({ sidebar: isSidebarCollapsed ? null : '1' });
  }, [set, isSidebarCollapsed]);

  const toggleMobileMenu = useCallback(() => {
    set({ mobile_menu: isMobileMenuOpen ? null : '1' });
  }, [set, isMobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    set({ mobile_menu: null });
  }, [set]);

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
