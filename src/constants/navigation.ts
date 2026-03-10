import { Home, Network, LayoutGrid, GraduationCap, TrendingUp, Settings, Cake, UserCheck, FileText, BarChart3, Users, UserPlus, Upload, FileDown, Scale } from 'lucide-react';
import { ViewMode, EmployeeSubView, DocumentsSubView, ListSubView } from '@/types';

interface NavItem {
  id: ViewMode;
  labelKey: string;
  icon: typeof Home;
  adminOnly?: boolean;
}

export const MAIN_NAV: NavItem[] = [
  { id: 'command_center', labelKey: 'nav.command_center', icon: Home },
  { id: 'org_chart', labelKey: 'nav.org_chart', icon: Network },
  { id: 'employees', labelKey: 'nav.employees', icon: LayoutGrid, adminOnly: true },
  { id: 'academy', labelKey: 'nav.academy', icon: GraduationCap },
];

export const STATS_NAV = {
  id: 'statistics' as ViewMode,
  labelKey: 'nav.stats_dashboard',
  icon: TrendingUp,
};

export const TOOLS_NAV: NavItem[] = [
  { id: 'admin_scale', labelKey: 'nav.admin_scale', icon: Scale },
];

export const SETTINGS_NAV = {
  id: 'settings' as ViewMode,
  labelKey: 'nav.settings',
  icon: Settings,
  adminOnly: true,
};

export interface EmployeeTab {
  id: EmployeeSubView;
  labelKey: string;
  icon: typeof Users;
}

export const EMPLOYEE_TABS: EmployeeTab[] = [
  { id: 'list', labelKey: 'emp.tab.personnel', icon: Users },
  { id: 'reports', labelKey: 'emp.tab.reports', icon: BarChart3 },
  { id: 'birthdays', labelKey: 'emp.tab.birthdays', icon: Cake },
  { id: 'onboarding', labelKey: 'emp.tab.onboarding', icon: UserCheck },
  { id: 'documents', labelKey: 'emp.tab.documents', icon: FileText },
];

export const DOCUMENTS_TABS: { id: DocumentsSubView; labelKey: string; icon: typeof FileText }[] = [
  { id: 'sent', labelKey: 'emp.docs.sent', icon: FileText },
  { id: 'received', labelKey: 'emp.docs.received', icon: Upload },
  { id: 'closing', labelKey: 'emp.docs.closing', icon: FileDown },
];

export const LIST_TABS: { id: ListSubView; labelKey: string; icon: typeof Users }[] = [
  { id: 'employees', labelKey: 'emp.tab.employees', icon: Users },
  { id: 'candidates', labelKey: 'emp.tab.candidates', icon: UserPlus },
];
