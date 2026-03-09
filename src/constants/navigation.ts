import { Home, Network, LayoutGrid, GraduationCap, TrendingUp, Settings, Cake, UserCheck, FileText, BarChart3, Users, UserPlus, Upload, FileDown, Scale } from 'lucide-react';
import { ViewMode, EmployeeSubView, DocumentsSubView, ListSubView } from '@/types';

interface NavItem {
  id: ViewMode;
  label: string;
  icon: typeof Home;
  adminOnly?: boolean;
}

export const MAIN_NAV: NavItem[] = [
  { id: 'command_center', label: 'Пункт управления', icon: Home },
  { id: 'org_chart', label: 'Оргсхема', icon: Network },
  { id: 'employees', label: 'Сотрудники', icon: LayoutGrid, adminOnly: true },
  { id: 'academy', label: 'Академия', icon: GraduationCap },
];

export const STATS_NAV = {
  id: 'statistics' as ViewMode,
  label: 'Дашборд ОС',
  icon: TrendingUp,
};

export const TOOLS_NAV: NavItem[] = [
  { id: 'admin_scale', label: 'Админ Шкала', icon: Scale },
];

export const SETTINGS_NAV = {
  id: 'settings' as ViewMode,
  label: 'Настройки',
  icon: Settings,
  adminOnly: true,
};

export interface EmployeeTab {
  id: EmployeeSubView;
  label: string;
  icon: typeof Users;
}

export const EMPLOYEE_TABS: EmployeeTab[] = [
  { id: 'list', label: 'Персонал', icon: Users },
  { id: 'reports', label: 'Отчёты', icon: BarChart3 },
  { id: 'birthdays', label: 'Дни Рождения', icon: Cake },
  { id: 'onboarding', label: 'Онбординг', icon: UserCheck },
  { id: 'documents', label: 'Документы', icon: FileText },
];

export const DOCUMENTS_TABS: { id: DocumentsSubView; label: string; icon: typeof FileText }[] = [
  { id: 'sent', label: 'Отправленные', icon: FileText },
  { id: 'received', label: 'Полученные', icon: Upload },
  { id: 'closing', label: 'Закрывающие', icon: FileDown },
];

export const LIST_TABS: { id: ListSubView; label: string; icon: typeof Users }[] = [
  { id: 'employees', label: 'Сотрудники', icon: Users },
  { id: 'candidates', label: 'Кандидаты', icon: UserPlus },
];
