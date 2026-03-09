// Core types for the HR system "Остров Сокровищ"

export interface Employee {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  position: string;
  nickname?: string;
  birth_date?: string;
  join_date?: string;
  email?: string;
  email2?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  telegram_username?: string;
  actual_address?: string;
  registration_address?: string;
  bank_name?: string;
  bank_details?: string;
  crypto_wallet?: string;
  crypto_currency?: string;
  crypto_network?: string;
  inn?: string;
  passport_number?: string;
  passport_date?: string;
  passport_issuer?: string;
  foreign_passport?: string;
  foreign_passport_date?: string;
  foreign_passport_issuer?: string;
  photo_url?: string;
  additional_info?: string;
  department?: string[];
  subdepartment?: string[];
  emergency_contacts: EmergencyContact[];
  custom_fields: CustomField[];
  attachments: Attachment[];
  version?: number;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  telegram?: string;
}

export interface CustomField {
  label: string;
  value: string;
}

export interface Attachment {
  id: string;
  employee_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string;
  uploaded_at: string;
  document_category?: 'contract_nda' | 'passport_scan' | 'inn_snils' | 'zrs' | 'other';
}

export interface Department {
  id: string;
  name: string;
  fullName: string;
  color: string;
  icon: string;
  description: string;
  longDescription?: string;
  functions?: string[];
  mainStat?: string;
  manager: string;
  goal?: string;
  vfp?: string;
  departments?: Record<string, SubDepartment>;
}

export interface SubDepartment {
  id: string;
  name: string;
  code: string;
  manager: string;
  employeeName?: string;
  description?: string;
  goal?: string;
  vfp?: string;
  mainStat?: string;
}

// Statistics
export type StatOwnerType = 'company' | 'department' | 'employee';
export type WiseCondition = 'non_existence' | 'danger' | 'emergency' | 'normal' | 'affluence' | 'power' | 'power_change';

export interface StatisticDefinition {
  id: string;
  created_at?: string;
  title: string;
  description?: string;
  calculation_method?: string;
  purpose?: string;
  type: StatOwnerType;
  owner_id?: string;
  inverted?: boolean;
  is_favorite?: boolean;
  is_double?: boolean;
}

export interface StatisticValue {
  id: string;
  definition_id: string;
  date: string;
  value: number;
  value2?: number;
  condition?: WiseCondition;
  notes?: string;
}

// Navigation
export type ViewMode = 'command_center' | 'employees' | 'org_chart' | 'statistics' | 'settings' | 'academy';
export type EmployeeSubView = 'list' | 'birthdays' | 'onboarding' | 'documents' | 'candidates' | 'reports';
export type ListSubView = 'employees' | 'candidates';
export type DocumentsSubView = 'sent' | 'received' | 'closing';

// Onboarding
export type OnboardingStatus = 'in_progress' | 'completed' | 'cancelled';

export interface OnboardingInstance {
  id: string;
  employee_id: string;
  template_id?: string;
  start_date: string;
  target_completion_date?: string;
  status: OnboardingStatus;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

// Candidates
export type CandidateTraineeStatus = 'candidate' | 'trainee' | 'converted';

export interface CandidateTrainee {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name: string;
  position: string;
  department_id?: string;
  status: CandidateTraineeStatus;
  email?: string;
  phone?: string;
  telegram?: string;
  start_date?: string;
  created_at: string;
  updated_at: string;
}

// Reports
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  metrics: ReportMetric[];
  created_at: string;
  updated_at: string;
}

export interface ReportMetric {
  id: string;
  name: string;
  type: 'number' | 'text' | 'buttons';
  options?: string[];
}

export interface Report {
  id: string;
  template_id: string;
  employee_id: string;
  department_id?: string;
  period_start: string;
  period_end: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
