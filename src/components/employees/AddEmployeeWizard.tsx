import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, AlertCircle, User, Briefcase, Phone as PhoneIcon, FileText, DollarSign, Heart, Monitor, Keyboard, Headphones, Smartphone, PenTool, CreditCard, BadgeCheck, MapPin, Globe, CheckCircle2, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useDepartments } from '@/hooks/useDepartments';
import { useEmployees, useCreateEmployee } from '@/hooks/useEmployees';
import { toast } from 'sonner';

interface AddEmployeeWizardProps {
  onClose: () => void;
}

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

interface WizardData {
  // Step 1 — org position
  department_id: string;
  subdepartment_id: string;
  // Step 2 — personal data
  full_name: string;
  nickname: string;
  birth_date: string;
  position: string;
  phone: string;
  whatsapp: string;
  email: string;
  telegram_username: string;
  actual_address: string;
  registration_address: string;
  passport_number: string;
  passport_date: string;
  passport_issuer: string;
  inn: string;
  foreign_passport: string;
  foreign_passport_date: string;
  foreign_passport_issuer: string;
  bank_name: string;
  bank_details: string;
  crypto_wallet: string;
  crypto_network: string;
  crypto_currency: string;
  emergency_contacts: EmergencyContact[];
  // Step 3 — employment terms
  join_date: string;
  employee_status: 'intern' | 'employee';
  salary: string;
  // Step 4 — responsible people
  manager_id: string;
  buddy_id: string;
  hr_manager_id: string;
  // Step 5 — resources
  equipment: string[];
  equipment_notes: string;
  additional_software: string[];
  workplace_office: string;
  workplace_floor: string;
  workplace_room: string;
  workplace_desk: string;
  work_format: 'office' | 'remote' | 'hybrid';
  // Step 6 — onboarding plan
  onboarding_plan: 'standard_3m' | 'fast_1m' | 'none' | 'custom';
  // Step 7 — confirmation
  confirmed: boolean;
}

const INITIAL_DATA: WizardData = {
  department_id: '', subdepartment_id: '',
  full_name: '', nickname: '', birth_date: '', position: '',
  phone: '', whatsapp: '', email: '', telegram_username: '',
  actual_address: '', registration_address: '',
  passport_number: '', passport_date: '', passport_issuer: '', inn: '',
  foreign_passport: '', foreign_passport_date: '', foreign_passport_issuer: '',
  bank_name: '', bank_details: '',
  crypto_wallet: '', crypto_network: '', crypto_currency: '',
  emergency_contacts: [],
  join_date: '', employee_status: 'intern', salary: '',
  manager_id: '', buddy_id: '', hr_manager_id: '',
  equipment: [], equipment_notes: '',
  additional_software: [], workplace_office: '', workplace_floor: '1',
  workplace_room: '', workplace_desk: '', work_format: 'office',
  onboarding_plan: 'standard_3m',
  confirmed: false,
};

const EQUIPMENT_LIST = [
  'Компьютер (ноутбук/ПК)', 'Монитор', 'Клавиатура и мышь',
  'Гарнитура/наушники', 'Телефон (рабочий)', 'Канцелярия', 'Визитки', 'Бейдж/пропуск'
];

const SOFTWARE_LIST = [
  'Email (создать корпоративный)', 'CRM система (доступ)', 'Внутренний портал (доступ)',
  'Мессенджеры (Slack/Telegram корп)', 'Облачное хранилище (Google Drive/OneDrive)'
];

const STEP_TITLES = [
  'Выбор поста на оргсхеме',
  'Личные данные сотрудника',
  'Условия найма и трудоустройства',
  'Ответственные за онбординг',
  'Необходимые доступы и ресурсы',
  'План онбординга',
  'Проверка данных и подтверждение',
];

type PersonalTab = 'personal' | 'contacts' | 'passport' | 'finance' | 'emergency';

export function AddEmployeeWizard({ onClose }: AddEmployeeWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({ ...INITIAL_DATA });
  const [personalTab, setPersonalTab] = useState<PersonalTab>('personal');
  const { data: departments } = useDepartments();
  const { data: employees } = useEmployees();
  const createMut = useCreateEmployee();

  const topDepts = departments?.filter(d => !d.parent_id)?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? [];
  const subDepts = departments?.filter(d => d.parent_id === data.department_id)?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? [];
  const selectedDept = departments?.find(d => d.id === data.department_id);
  const selectedSubDept = departments?.find(d => d.id === data.subdepartment_id);

  const set = <K extends keyof WizardData>(key: K, val: WizardData[K]) =>
    setData(p => ({ ...p, [key]: val }));

  const toggleEquipment = (item: string) =>
    set('equipment', data.equipment.includes(item) ? data.equipment.filter(e => e !== item) : [...data.equipment, item]);

  const canNext = (): boolean => {
    switch (step) {
      case 0: return !!data.department_id && !!data.subdepartment_id;
      case 1: return !!data.full_name.trim();
      case 6: return data.confirmed;
      default: return true;
    }
  };

  const handleSave = async () => {
    if (!data.full_name.trim()) { toast.error('Укажите ФИО'); return; }
    const payload: Record<string, unknown> = {
      full_name: data.full_name,
      position: data.position || selectedSubDept?.manager_name || 'Сотрудник',
      nickname: data.nickname || null,
      birth_date: data.birth_date || null,
      join_date: data.join_date || null,
      phone: data.phone || null,
      email: data.email || null,
      telegram_username: data.telegram_username || null,
      whatsapp: data.whatsapp || null,
      actual_address: data.actual_address || null,
      registration_address: data.registration_address || null,
      department_ids: [data.department_id],
      subdepartment_ids: data.subdepartment_id ? [data.subdepartment_id] : null,
      passport_number: data.passport_number || null,
      passport_date: data.passport_date || null,
      passport_issuer: data.passport_issuer || null,
      inn: data.inn || null,
      foreign_passport: data.foreign_passport || null,
      foreign_passport_date: data.foreign_passport_date || null,
      foreign_passport_issuer: data.foreign_passport_issuer || null,
      bank_name: data.bank_name || null,
      bank_details: data.bank_details || null,
      crypto_wallet: data.crypto_wallet || null,
      crypto_network: data.crypto_network || null,
      crypto_currency: data.crypto_currency || null,
      emergency_contacts: data.emergency_contacts.length ? data.emergency_contacts : null,
      custom_fields: {
        employee_status: data.employee_status,
        salary: data.salary,
        manager_id: data.manager_id,
        buddy_id: data.buddy_id,
        hr_manager_id: data.hr_manager_id,
        equipment: data.equipment,
        equipment_notes: data.equipment_notes,
        work_format: data.work_format,
        workplace: { office: data.workplace_office, floor: data.workplace_floor, room: data.workplace_room, desk: data.workplace_desk },
        onboarding_plan: data.onboarding_plan,
      },
    };

    try {
      await createMut.mutateAsync(payload as any);
      onClose();
    } catch {}
  };

  const addEmergencyContact = () =>
    set('emergency_contacts', [...data.emergency_contacts, { name: '', relation: '', phone: '' }]);
  const removeEmergencyContact = (i: number) =>
    set('emergency_contacts', data.emergency_contacts.filter((_, idx) => idx !== i));
  const updateEC = (i: number, field: keyof EmergencyContact, val: string) =>
    set('emergency_contacts', data.emergency_contacts.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">Добавление нового сотрудника</h2>
              <p className="text-sm text-muted-foreground font-body">Шаг {step + 1} из 7</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 mt-3">
            {STEP_TITLES.map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0 transition-all ${
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? 'bg-primary text-primary-foreground' :
                  'bg-accent text-muted-foreground'
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                {i < STEP_TITLES.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded transition-colors ${i < step ? 'bg-green-500' : 'bg-accent'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 0 && <Step1OrgPosition data={data} set={set} topDepts={topDepts} subDepts={subDepts} selectedDept={selectedDept} selectedSubDept={selectedSubDept} />}
          {step === 1 && <Step2PersonalData data={data} set={set} personalTab={personalTab} setPersonalTab={setPersonalTab} addEC={addEmergencyContact} removeEC={removeEmergencyContact} updateEC={updateEC} />}
          {step === 2 && <Step3Employment data={data} set={set} />}
          {step === 3 && <Step4Responsible data={data} set={set} employees={employees ?? []} />}
          {step === 4 && <Step5Resources data={data} set={set} toggleEquipment={toggleEquipment} />}
          {step === 5 && <Step6Onboarding data={data} set={set} />}
          {step === 6 && <Step7Review data={data} set={set} selectedDept={selectedDept} selectedSubDept={selectedSubDept} employees={employees ?? []} />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-accent transition-all"
          >
            <ChevronLeft size={16} />
            Назад
          </button>
          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-display font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Продолжить
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!data.confirmed || createMut.isPending}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-display font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              Сохранить и создать сотрудника
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-display font-semibold text-foreground mb-1.5">{children}</label>;
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-border rounded-xl p-4 space-y-4 ${className}`}>{children}</div>;
}

/* ─── Step 1: Org Position ─── */
function Step1OrgPosition({ data, set, topDepts, subDepts, selectedDept, selectedSubDept }: any) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-bold text-foreground">Выбор поста на оргсхеме</h3>
        <p className="text-sm text-muted-foreground font-body mt-1">Для какого поста нанимается сотрудник?</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-display font-bold text-sm text-primary">Важно!</p>
          <p className="text-xs text-muted-foreground font-body mt-1">
            Согласно административной технологии, нельзя нанимать на неподготовленный пост. Убедитесь, что пост имеет описание (шляпу), определен продукт (VFP) и статистики.
          </p>
        </div>
      </div>

      <SectionCard>
        <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Департамент (владелец)</p>
        <div className="flex flex-wrap gap-2">
          {topDepts.map((d: any) => (
            <button
              key={d.id}
              onClick={() => { set('department_id', d.id); set('subdepartment_id', ''); }}
              className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl font-display font-semibold transition-all border ${
                data.department_id === d.id
                  ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: d.color ?? '#666' }}>
                {d.code?.replace(/[^\d]/g, '') || d.name[0]}
              </span>
              {d.name}
            </button>
          ))}
        </div>
      </SectionCard>

      {data.department_id && subDepts.length > 0 && (
        <SectionCard>
          <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Отдел / Секция (Функциональная роль)</p>
          <div className="flex flex-wrap gap-3">
            {subDepts.map((sd: any) => (
              <button
                key={sd.id}
                onClick={() => set('subdepartment_id', sd.id)}
                className={`text-left border rounded-xl p-3 transition-all min-w-[180px] relative ${
                  data.subdepartment_id === sd.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {data.subdepartment_id === sd.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={18} className="text-green-500" />
                  </div>
                )}
                <p className="font-display font-bold text-sm text-foreground">{sd.name}</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{sd.code} • {sd.manager_name || '—'}</p>
                {sd.vfp && <p className="text-xs text-muted-foreground/70 mt-1">Продукт: {sd.vfp}</p>}
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {selectedSubDept && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <p className="text-xs font-display font-semibold text-primary uppercase">Информация о выбранном посте:</p>
          <div className="text-sm font-body text-foreground space-y-1">
            <p><span className="text-muted-foreground">Пост:</span> {selectedSubDept.name}</p>
            <p><span className="text-muted-foreground">Отдел:</span> {selectedDept?.name}</p>
            {selectedSubDept.manager_name && <p><span className="text-muted-foreground">Руководитель:</span> {selectedSubDept.manager_name}</p>}
            {selectedSubDept.vfp && <p><span className="text-muted-foreground">Продукт поста (VFP):</span> {selectedSubDept.vfp}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: Personal Data ─── */
function Step2PersonalData({ data, set, personalTab, setPersonalTab, addEC, removeEC, updateEC }: any) {
  const TABS: { id: PersonalTab; label: string; icon: any }[] = [
    { id: 'personal', label: 'Личные данные', icon: User },
    { id: 'contacts', label: 'Контакты', icon: PhoneIcon },
    { id: 'passport', label: 'Паспорт', icon: FileText },
    { id: 'finance', label: 'Финансы', icon: DollarSign },
    { id: 'emergency', label: 'Экстренные', icon: Heart },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-bold text-foreground">Личные данные сотрудника</h3>
        <p className="text-sm text-muted-foreground font-body mt-1">Заполните информацию о сотруднике</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setPersonalTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-display font-medium whitespace-nowrap border-b-2 transition-all ${
              personalTab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {personalTab === 'personal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>ФИО (полностью) *</Label><Input value={data.full_name} onChange={(e: any) => set('full_name', e.target.value)} className="bg-accent" /></div>
            <div><Label>Системный NIK</Label><Input value={data.nickname} onChange={(e: any) => set('nickname', e.target.value)} className="bg-accent" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Должность</Label><Input value={data.position} onChange={(e: any) => set('position', e.target.value)} className="bg-accent" /></div>
            <div><Label>Дата рождения</Label><Input type="date" value={data.birth_date} onChange={(e: any) => set('birth_date', e.target.value)} className="bg-accent" /></div>
          </div>
        </div>
      )}

      {personalTab === 'contacts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Телефон</Label><Input value={data.phone} onChange={(e: any) => set('phone', e.target.value)} className="bg-accent" /></div>
            <div><Label>WhatsApp</Label><Input value={data.whatsapp} onChange={(e: any) => set('whatsapp', e.target.value)} className="bg-accent" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" value={data.email} onChange={(e: any) => set('email', e.target.value)} className="bg-accent" /></div>
            <div><Label>Telegram Username</Label><Input value={data.telegram_username} onChange={(e: any) => set('telegram_username', e.target.value)} className="bg-accent" /></div>
          </div>
          <div><Label>Фактический адрес</Label><Input value={data.actual_address} onChange={(e: any) => set('actual_address', e.target.value)} className="bg-accent" /></div>
          <div><Label>Адрес регистрации</Label><Input value={data.registration_address} onChange={(e: any) => set('registration_address', e.target.value)} className="bg-accent" /></div>
        </div>
      )}

      {personalTab === 'passport' && (
        <div className="space-y-4">
          <div><Label>ИНН</Label><Input value={data.inn} onChange={(e: any) => set('inn', e.target.value)} className="bg-accent" /></div>
          <h4 className="font-display font-bold text-sm text-foreground pt-2">Внутренний паспорт</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Серия и номер</Label><Input value={data.passport_number} onChange={(e: any) => set('passport_number', e.target.value)} className="bg-accent" /></div>
            <div><Label>Дата выдачи</Label><Input type="date" value={data.passport_date} onChange={(e: any) => set('passport_date', e.target.value)} className="bg-accent" /></div>
          </div>
          <div><Label>Кем выдан</Label><Input value={data.passport_issuer} onChange={(e: any) => set('passport_issuer', e.target.value)} className="bg-accent" /></div>
          <h4 className="font-display font-bold text-sm text-foreground pt-2">Заграничный паспорт</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Номер</Label><Input value={data.foreign_passport} onChange={(e: any) => set('foreign_passport', e.target.value)} className="bg-accent" /></div>
            <div><Label>Срок действия</Label><Input type="date" value={data.foreign_passport_date} onChange={(e: any) => set('foreign_passport_date', e.target.value)} className="bg-accent" /></div>
          </div>
          <div><Label>Кем выдан</Label><Input value={data.foreign_passport_issuer} onChange={(e: any) => set('foreign_passport_issuer', e.target.value)} className="bg-accent" /></div>
        </div>
      )}

      {personalTab === 'finance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Банк</Label><Input value={data.bank_name} onChange={(e: any) => set('bank_name', e.target.value)} placeholder="Kasikorn Bank" className="bg-accent" /></div>
            <div><Label>Номер счета / Карты</Label><Input value={data.bank_details} onChange={(e: any) => set('bank_details', e.target.value)} placeholder="1234 5678 9012 3456" className="bg-accent" /></div>
          </div>
          <SectionCard className="bg-accent/30">
            <h4 className="font-display font-semibold text-sm text-primary flex items-center gap-2">
              <Globe size={16} /> Крипто-кошелек
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Адрес кошелька</Label><Input value={data.crypto_wallet} onChange={(e: any) => set('crypto_wallet', e.target.value)} placeholder="0x..." className="bg-accent" /></div>
              <div><Label>Сеть (Network)</Label><Input value={data.crypto_network} onChange={(e: any) => set('crypto_network', e.target.value)} placeholder="TRC20, BEP20..." className="bg-accent" /></div>
            </div>
            <div className="md:w-1/2">
              <Label>Валюта</Label>
              <Input value={data.crypto_currency} onChange={(e: any) => set('crypto_currency', e.target.value)} placeholder="USDT" className="bg-accent" />
            </div>
          </SectionCard>
        </div>
      )}

      {personalTab === 'emergency' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-sm text-foreground">Экстренные контакты</h4>
            <button onClick={addEC} className="text-xs font-display font-semibold text-primary hover:underline flex items-center gap-1">
              + Добавить
            </button>
          </div>
          {data.emergency_contacts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Нет экстренных контактов</p>
          )}
          {data.emergency_contacts.map((ec: EmergencyContact, i: number) => (
            <SectionCard key={i}>
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                <div><Label>Имя</Label><Input value={ec.name} onChange={(e: any) => updateEC(i, 'name', e.target.value)} placeholder="Иван Иванов" className="bg-accent" /></div>
                <div><Label>Кем приходится</Label><Input value={ec.relation} onChange={(e: any) => updateEC(i, 'relation', e.target.value)} placeholder="Супруг/а, Родитель..." className="bg-accent" /></div>
                <div><Label>Телефон</Label><Input value={ec.phone} onChange={(e: any) => updateEC(i, 'phone', e.target.value)} placeholder="+7 (999) 123-45-67" className="bg-accent" /></div>
                <button onClick={() => removeEC(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><X size={16} /></button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: Employment Terms ─── */
function Step3Employment({ data, set }: any) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-bold text-foreground">Условия найма и трудоустройства</h3>
        <p className="text-sm text-muted-foreground font-body mt-1">Укажите условия работы сотрудника</p>
      </div>
      <div>
        <Label>Дата начала работы</Label>
        <Input type="date" value={data.join_date} onChange={(e: any) => set('join_date', e.target.value)} className="bg-accent" />
      </div>
      <div>
        <Label>Статус сотрудника</Label>
        <div className="space-y-2 mt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" checked={data.employee_status === 'intern'} onChange={() => set('employee_status', 'intern')} className="accent-primary w-4 h-4" />
            <span className="text-sm font-body text-foreground">Стажер (испытательный срок 3 месяца)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" checked={data.employee_status === 'employee'} onChange={() => set('employee_status', 'employee')} className="accent-primary w-4 h-4" />
            <span className="text-sm font-body text-foreground">Сотрудник (принят сразу, без испытательного срока)</span>
          </label>
        </div>
      </div>
      <div>
        <Label>Оклад/ставка (руб/мес)</Label>
        <Input type="text" value={data.salary} onChange={(e: any) => set('salary', e.target.value)} placeholder="80000" className="bg-accent" />
      </div>
    </div>
  );
}

/* ─── Step 4: Responsible People ─── */
function Step4Responsible({ data, set, employees }: any) {
  const empOptions = employees.map((e: any) => ({ value: e.id, label: e.full_name }));
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-bold text-foreground">Ответственные за онбординг</h3>
        <p className="text-sm text-muted-foreground font-body mt-1">Назначьте людей, которые будут помогать новому сотруднику</p>
      </div>
      <div>
        <Label>Непосредственный руководитель</Label>
        <select value={data.manager_id} onChange={(e: any) => set('manager_id', e.target.value)} className="w-full px-3 py-2.5 bg-accent border border-border rounded-xl text-sm font-body text-foreground">
          <option value="">Выберите руководителя (необязательно)</option>
          {empOptions.map((e: any) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>
      <div>
        <Label>Наставник (Buddy)</Label>
        <select value={data.buddy_id} onChange={(e: any) => set('buddy_id', e.target.value)} className="w-full px-3 py-2.5 bg-accent border border-border rounded-xl text-sm font-body text-foreground">
          <option value="">Выберите наставника</option>
          {empOptions.map((e: any) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <p className="text-xs text-muted-foreground mt-1 font-body">Наставник - это коллега с того же или близкого поста, который будет помогать новичку в первые 3 месяца</p>
      </div>
      <div>
        <Label>HR-менеджер</Label>
        <select value={data.hr_manager_id} onChange={(e: any) => set('hr_manager_id', e.target.value)} className="w-full px-3 py-2.5 bg-accent border border-border rounded-xl text-sm font-body text-foreground">
          <option value="">Выберите HR-менеджера (необязательно)</option>
          {empOptions.map((e: any) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>
    </div>
  );
}

/* ─── Step 5: Resources ─── */
function Step5Resources({ data, set, toggleEquipment }: any) {
  const [newSoftware, setNewSoftware] = useState('');
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-bold text-foreground">Необходимые доступы и ресурсы</h3>
        <p className="text-sm text-muted-foreground font-body mt-1">Что нужно подготовить к первому дню работы</p>
      </div>

      <SectionCard>
        <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2"><Monitor size={16} /> Оборудование</h4>
        <p className="text-xs text-muted-foreground font-body">Что нужно подготовить к первому дню:</p>
        <div className="space-y-2">
          {EQUIPMENT_LIST.map(item => (
            <label key={item} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <Checkbox checked={data.equipment.includes(item)} onCheckedChange={() => toggleEquipment(item)} />
              <span className="text-sm font-body text-foreground">{item}</span>
            </label>
          ))}
        </div>
        <div>
          <Label>Примечания:</Label>
          <Textarea value={data.equipment_notes} onChange={(e: any) => set('equipment_notes', e.target.value)} placeholder="Дополнительные требования к оборудованию..." className="bg-accent" />
        </div>
      </SectionCard>

      <SectionCard>
        <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2"><Globe size={16} className="text-primary" /> Программное обеспечение и доступы</h4>
        <p className="text-xs text-muted-foreground font-body">Автоматически на основе поста система запросит:</p>
        <div className="space-y-2">
          {SOFTWARE_LIST.map(item => (
            <div key={item} className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-sm font-body text-foreground">{item}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={newSoftware} onChange={(e: any) => setNewSoftware(e.target.value)} placeholder="Название программы" className="bg-accent flex-1" />
          <button
            onClick={() => {
              if (newSoftware.trim()) {
                set('additional_software', [...data.additional_software, newSoftware.trim()]);
                setNewSoftware('');
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground font-display font-bold rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center gap-1"
          >
            + Добавить
          </button>
        </div>
        {data.additional_software.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.additional_software.map((s: string, i: number) => (
              <span key={i} className="text-xs px-2 py-1 bg-accent rounded-lg font-body text-foreground flex items-center gap-1">
                {s}
                <button onClick={() => set('additional_software', data.additional_software.filter((_: any, idx: number) => idx !== i))} className="text-destructive"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard>
        <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2"><MapPin size={16} /> Рабочее место</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Офис:</Label>
            <select value={data.workplace_office} onChange={(e: any) => set('workplace_office', e.target.value)} className="w-full px-3 py-2.5 bg-accent border border-border rounded-xl text-sm">
              <option value="">Выбрать офис</option>
              <option value="main">Основной офис</option>
              <option value="branch">Филиал</option>
            </select>
          </div>
          <div><Label>Этаж:</Label><Input value={data.workplace_floor} onChange={(e: any) => set('workplace_floor', e.target.value)} className="bg-accent" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Комната:</Label><Input value={data.workplace_room} onChange={(e: any) => set('workplace_room', e.target.value)} placeholder="101" className="bg-accent" /></div>
          <div><Label>Рабочее место №:</Label><Input value={data.workplace_desk} onChange={(e: any) => set('workplace_desk', e.target.value)} placeholder="1" className="bg-accent" /></div>
        </div>
        <div>
          <Label>Формат работы:</Label>
          <div className="flex gap-3 mt-1">
            {(['office', 'remote', 'hybrid'] as const).map(f => (
              <label key={f} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={data.work_format === f} onChange={() => set('work_format', f)} className="accent-primary" />
                <span className="text-sm font-body">{f === 'office' ? 'Офис' : f === 'remote' ? 'Удалённо' : 'Гибрид'}</span>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Step 6: Onboarding Plan ─── */
function Step6Onboarding({ data, set }: any) {
  const plans = [
    { id: 'standard_3m', title: 'Стандартный онбординг для стажера (3 месяца)', desc: 'Полная программа адаптации с финальной аттестацией на 90-й день', recommended: true },
    { id: 'fast_1m', title: 'Ускоренный онбординг для опытного специалиста (1 месяц)', desc: 'Только знакомство с компанией и процессами, без полной программы' },
    { id: 'none', title: 'Без онбординга', desc: 'Сотрудник не требует программы адаптации' },
    { id: 'custom', title: 'Индивидуальный план', desc: 'Настроить программу онбординга вручную' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-bold text-foreground">План онбординга</h3>
        <p className="text-sm text-muted-foreground font-body mt-1">Выберите программу адаптации для нового сотрудника</p>
      </div>
      <div className="space-y-3">
        {plans.map(p => (
          <button
            key={p.id}
            onClick={() => set('onboarding_plan', p.id)}
            className={`w-full text-left border rounded-xl p-4 transition-all ${
              data.onboarding_plan === p.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                : 'border-border hover:border-primary/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                data.onboarding_plan === p.id ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {data.onboarding_plan === p.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
              </div>
              <div>
                <p className="font-display font-bold text-sm text-foreground">
                  {p.title}
                  {p.recommended && <span className="ml-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">Рекомендуется</span>}
                </p>
                <p className="text-xs text-muted-foreground font-body mt-1">{p.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 7: Review & Confirm ─── */
function Step7Review({ data, set, selectedDept, selectedSubDept, employees }: any) {
  const manager = employees.find((e: any) => e.id === data.manager_id);
  const buddy = employees.find((e: any) => e.id === data.buddy_id);
  const hrManager = employees.find((e: any) => e.id === data.hr_manager_id);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-bold text-foreground">Проверка данных и подтверждение</h3>
        <p className="text-sm text-muted-foreground font-body mt-1">Проверьте все данные перед сохранением</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard>
          <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2"><User size={16} /> Сотрудник</h4>
          <div className="space-y-1 text-sm font-body">
            <p><span className="font-semibold">ФИО:</span> {data.full_name || '—'}</p>
            <p><span className="font-semibold">Системный NIK:</span> {data.nickname || '—'}</p>
            <p><span className="font-semibold">Email:</span> {data.email || 'Не указан'}</p>
            <p><span className="font-semibold">Телефон:</span> {data.phone || 'Не указан'}</p>
          </div>
        </SectionCard>

        <SectionCard>
          <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2"><Briefcase size={16} /> Пост</h4>
          <div className="space-y-1 text-sm font-body">
            <p><span className="font-semibold">Название:</span> {selectedSubDept?.name || '—'}</p>
            <p><span className="font-semibold">Отдел:</span> {selectedDept?.name || '—'}</p>
            <p><span className="font-semibold">Продукт (VFP):</span> {selectedSubDept?.vfp || '—'}</p>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard>
          <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2"><DollarSign size={16} /> Условия найма</h4>
          <div className="space-y-1 text-sm font-body">
            <p><span className="font-semibold">Дата выхода:</span> {data.join_date || 'Не указана'}</p>
            <p>
              <span className="font-semibold">Статус:</span> {data.employee_status === 'intern' ? 'Стажер (3 месяца)' : 'Сотрудник'}
              {data.employee_status === 'intern' && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-display font-semibold">Испытательный срок</span>}
            </p>
            <p><span className="font-semibold">Формат работы:</span> {data.work_format === 'office' ? 'Офис' : data.work_format === 'remote' ? 'Удалённо' : 'Гибрид'}</p>
          </div>
        </SectionCard>

        <SectionCard>
          <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2"><User size={16} /> Ответственные</h4>
          <div className="space-y-1 text-sm font-body">
            <p><span className="font-semibold">Руководитель:</span> <span className={!manager ? 'text-primary' : ''}>{manager?.full_name || 'Не назначен'}</span></p>
            <p><span className="font-semibold">Наставник:</span> <span className={!buddy ? 'text-primary' : ''}>{buddy?.full_name || 'Не назначен'}</span></p>
            <p><span className="font-semibold">HR-менеджер:</span> <span className={!hrManager ? 'text-primary' : ''}>{hrManager?.full_name || 'Не назначен'}</span></p>
          </div>
        </SectionCard>
      </div>

      {/* What happens after saving */}
      <SectionCard className="bg-primary/5 border-primary/20">
        <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-500" /> Что произойдет после сохранения:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: CheckCircle2, title: 'Создана карточка сотрудника', desc: 'Со статусом "Ожидает выхода"' },
            { icon: FileText, title: 'Создана Шляпная папка поста', desc: '8 разделов, автозаполнение из шаблона' },
            { icon: Briefcase, title: 'Назначен план онбординга', desc: '90 дней с аттестацией' },
            { icon: AlertCircle, title: 'Отправлены уведомления', desc: 'Руководителю, наставнику, HR, IT' },
            { icon: Monitor, title: 'Создана заявка в IT', desc: 'Подготовка оборудования и доступов' },
            { icon: User, title: 'Запланированы встречи', desc: 'Чек-пойнты на дни 3, 7, 30, 60, 90' },
            { icon: PhoneIcon, title: 'Welcome-письмо', desc: 'Запланировано' },
            { icon: CheckCircle2, title: 'Регистрация на оргсхеме', desc: 'Пост отмечен как занятый' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <item.icon size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-display font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground font-body">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Confirmation */}
      <div className="border-2 border-primary/30 bg-primary/5 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={data.confirmed} onCheckedChange={(v: boolean) => set('confirmed', v)} className="mt-0.5" />
          <div>
            <p className="font-display font-bold text-sm text-foreground">Я проверил все данные и подтверждаю их корректность</p>
            <p className="text-xs text-primary mt-1 font-body">После сохранения будут выполнены автоматические действия, указанные выше</p>
          </div>
        </label>
      </div>
    </div>
  );
}
