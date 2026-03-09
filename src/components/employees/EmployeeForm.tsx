import { useState, useEffect, useRef } from 'react';
import { useCreateEmployee, useUpdateEmployee, useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  X, Save, User, Phone, FileText, Wallet, FolderOpen, TrendingUp,
  MessageSquare, Target, Shield, FolderArchive, Clock, Plus, Trash2, Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeFormProps {
  employeeId?: string | null;
  onClose: () => void;
}

type SectionId = 'general' | 'contacts' | 'documents' | 'finance' | 'files' | 'statistics' | 'telegram' | 'development' | 'ethics' | 'dp';

interface SectionDef {
  id: SectionId;
  label: string;
  icon: typeof User;
}

const SECTIONS: SectionDef[] = [
  { id: 'general', label: 'Основное', icon: User },
  { id: 'contacts', label: 'Контакты', icon: Phone },
  { id: 'documents', label: 'Документы', icon: FileText },
  { id: 'finance', label: 'Финансы', icon: Wallet },
  { id: 'files', label: 'Файлы', icon: FolderOpen },
  { id: 'statistics', label: 'Статистика', icon: TrendingUp },
  { id: 'telegram', label: 'Telegram-боты', icon: MessageSquare },
  { id: 'development', label: 'Карта развития', icon: Target },
  { id: 'ethics', label: 'Этическая папка', icon: Shield },
  { id: 'dp', label: 'Собрать ДП', icon: FolderArchive },
];

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

interface FormState {
  full_name: string;
  position: string;
  nickname: string;
  birth_date: string;
  join_date: string;
  telegram_username: string;
  telegram: string;
  department_ids: string[];
  subdepartment_ids: string[];
  // contacts
  phone: string;
  whatsapp: string;
  email: string;
  email2: string;
  actual_address: string;
  registration_address: string;
  emergency_contacts: EmergencyContact[];
  // documents
  inn: string;
  passport_number: string;
  passport_date: string;
  passport_issuer: string;
  foreign_passport: string;
  foreign_passport_date: string;
  foreign_passport_issuer: string;
  // finance
  bank_name: string;
  bank_details: string;
  crypto_wallet: string;
  crypto_network: string;
  crypto_currency: string;
  // misc
  additional_info: string;
  photo_url: string;
}

const emptyForm: FormState = {
  full_name: '', position: 'Сотрудник', nickname: '', birth_date: '', join_date: '',
  telegram_username: '', telegram: '', department_ids: [], subdepartment_ids: [],
  phone: '', whatsapp: '', email: '', email2: '', actual_address: '', registration_address: '',
  emergency_contacts: [],
  inn: '', passport_number: '', passport_date: '', passport_issuer: '',
  foreign_passport: '', foreign_passport_date: '', foreign_passport_issuer: '',
  bank_name: '', bank_details: '', crypto_wallet: '', crypto_network: '', crypto_currency: '',
  additional_info: '', photo_url: '',
};

export function EmployeeForm({ employeeId, onClose }: EmployeeFormProps) {
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();

  const existing = employeeId ? employees?.find(e => e.id === employeeId) : null;
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const [form, setForm] = useState<FormState>({ ...emptyForm });

  const topDepts = departments?.filter(d => !d.parent_id) ?? [];
  const subDepts = departments?.filter(d => d.parent_id) ?? [];

  useEffect(() => {
    if (existing) {
      const ec = (existing.emergency_contacts as EmergencyContact[] | null) ?? [];
      setForm({
        full_name: existing.full_name ?? '',
        position: existing.position ?? '',
        nickname: existing.nickname ?? '',
        birth_date: existing.birth_date ?? '',
        join_date: existing.join_date ?? '',
        telegram_username: existing.telegram_username ?? '',
        telegram: existing.telegram ?? '',
        department_ids: existing.department_ids ?? [],
        subdepartment_ids: existing.subdepartment_ids ?? [],
        phone: existing.phone ?? '',
        whatsapp: existing.whatsapp ?? '',
        email: existing.email ?? '',
        email2: existing.email2 ?? '',
        actual_address: existing.actual_address ?? '',
        registration_address: existing.registration_address ?? '',
        emergency_contacts: ec,
        inn: existing.inn ?? '',
        passport_number: existing.passport_number ?? '',
        passport_date: existing.passport_date ?? '',
        passport_issuer: existing.passport_issuer ?? '',
        foreign_passport: existing.foreign_passport ?? '',
        foreign_passport_date: existing.foreign_passport_date ?? '',
        foreign_passport_issuer: existing.foreign_passport_issuer ?? '',
        bank_name: existing.bank_name ?? '',
        bank_details: existing.bank_details ?? '',
        crypto_wallet: existing.crypto_wallet ?? '',
        crypto_network: existing.crypto_network ?? '',
        crypto_currency: existing.crypto_currency ?? '',
        additional_info: existing.additional_info ?? '',
        photo_url: existing.photo_url ?? '',
      });
    }
  }, [existing]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error('Укажите ФИО'); return; }
    const payload: Record<string, unknown> = {
      full_name: form.full_name,
      position: form.position || 'Сотрудник',
      nickname: form.nickname || null,
      birth_date: form.birth_date || null,
      join_date: form.join_date || null,
      telegram_username: form.telegram_username || null,
      telegram: form.telegram || null,
      department_ids: form.department_ids.length ? form.department_ids : null,
      subdepartment_ids: form.subdepartment_ids.length ? form.subdepartment_ids : null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      email2: form.email2 || null,
      actual_address: form.actual_address || null,
      registration_address: form.registration_address || null,
      emergency_contacts: form.emergency_contacts.length ? form.emergency_contacts : null,
      inn: form.inn || null,
      passport_number: form.passport_number || null,
      passport_date: form.passport_date || null,
      passport_issuer: form.passport_issuer || null,
      foreign_passport: form.foreign_passport || null,
      foreign_passport_date: form.foreign_passport_date || null,
      foreign_passport_issuer: form.foreign_passport_issuer || null,
      bank_name: form.bank_name || null,
      bank_details: form.bank_details || null,
      crypto_wallet: form.crypto_wallet || null,
      crypto_network: form.crypto_network || null,
      crypto_currency: form.crypto_currency || null,
      additional_info: form.additional_info || null,
      photo_url: form.photo_url || null,
    };

    try {
      if (employeeId && existing) {
        await updateMut.mutateAsync({ id: employeeId, updates: payload });
      } else {
        await createMut.mutateAsync(payload as any);
      }
      onClose();
    } catch {}
  };

  const isLoading = createMut.isPending || updateMut.isPending;
  const shortId = existing?.id?.slice(0, 8) ?? 'Новый';

  const toggleDept = (id: string) =>
    set('department_ids', form.department_ids.includes(id) ? form.department_ids.filter(x => x !== id) : [...form.department_ids, id]);

  const toggleSubDept = (id: string) =>
    set('subdepartment_ids', form.subdepartment_ids.includes(id) ? form.subdepartment_ids.filter(x => x !== id) : [...form.subdepartment_ids, id]);

  const addEmergencyContact = () =>
    set('emergency_contacts', [...form.emergency_contacts, { name: '', relation: '', phone: '' }]);

  const removeEmergencyContact = (i: number) =>
    set('emergency_contacts', form.emergency_contacts.filter((_, idx) => idx !== i));

  const updateEmergencyContact = (i: number, field: keyof EmergencyContact, val: string) =>
    set('emergency_contacts', form.emergency_contacts.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">Редактирование</h2>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              <span className="bg-accent px-2 py-0.5 rounded text-[10px] font-mono">{shortId}</span>
              <span className="ml-2">• Личное дело</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-sm font-display font-medium text-muted-foreground hover:text-foreground transition-colors">
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 transition-all text-sm disabled:opacity-50"
            >
              <Save size={16} />
              Сохранить
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar nav */}
          <nav className="w-52 border-r border-border overflow-y-auto flex-shrink-0 py-3 hidden md:block">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-display font-medium transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-primary/15 text-primary border-l-3 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <s.icon size={16} />
                <span>{`${i + 1}. ${s.label}`}</span>
              </button>
            ))}
          </nav>

          {/* Mobile section tabs */}
          <div className="md:hidden border-b border-border overflow-x-auto flex-shrink-0">
            <div className="flex gap-1 p-2">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`whitespace-nowrap px-3 py-2 text-xs font-display font-medium rounded-lg transition-all ${
                    activeSection === s.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {i + 1}. {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === 'general' && (
              <SectionGeneral form={form} set={set} topDepts={topDepts} subDepts={subDepts}
                toggleDept={toggleDept} toggleSubDept={toggleSubDept} employees={employees ?? []} />
            )}
            {activeSection === 'contacts' && (
              <SectionContacts form={form} set={set}
                addEmergencyContact={addEmergencyContact} removeEmergencyContact={removeEmergencyContact}
                updateEmergencyContact={updateEmergencyContact} />
            )}
            {activeSection === 'documents' && <SectionDocuments form={form} set={set} />}
            {activeSection === 'finance' && <SectionFinance form={form} set={set} />}
            {activeSection === 'files' && <SectionFiles employeeId={employeeId} />}
            {activeSection === 'statistics' && <SectionPlaceholder icon={TrendingUp} title="Личная Статистика и KPI" />}
            {activeSection === 'telegram' && <SectionPlaceholder icon={MessageSquare} title="Telegram-боты" />}
            {activeSection === 'development' && <SectionPlaceholder icon={Target} title="Карта развития" />}
            {activeSection === 'ethics' && <SectionPlaceholder icon={Shield} title="Этическая папка" />}
            {activeSection === 'dp' && <SectionPlaceholder icon={FolderArchive} title="Собрать ДП" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Field helpers ─── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-display font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{children}</label>;
}

function SectionTitle({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-lg font-display font-bold text-foreground mb-5">
      <span className="w-1 h-6 bg-primary rounded-full" />
      <Icon size={20} className="text-muted-foreground" />
      {children}
    </h3>
  );
}

function FieldCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-border rounded-xl p-4 space-y-4 ${className}`}>{children}</div>;
}

/* ─── Section: General ─── */
function SectionGeneral({ form, set, topDepts, subDepts, toggleDept, toggleSubDept, employees }: {
  form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  topDepts: any[]; subDepts: any[]; toggleDept: (id: string) => void; toggleSubDept: (id: string) => void;
  employees: any[];
}) {
  return (
    <div className="space-y-6">
      <SectionTitle icon={User}>Личные Данные</SectionTitle>

      <FieldCard>
        {/* Photo placeholder */}
        {form.photo_url && (
          <div className="flex justify-center">
            <img src={form.photo_url} alt="Фото" className="w-24 h-24 rounded-full object-cover border-2 border-border" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>ФИО (полностью)</FieldLabel>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} className="bg-accent" />
          </div>
          <div>
            <FieldLabel>Должность</FieldLabel>
            <Input value={form.position} onChange={e => set('position', e.target.value)} className="bg-accent" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Дата рождения</FieldLabel>
            <Input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} className="bg-accent" />
          </div>
          <div>
            <FieldLabel>Дата приёма</FieldLabel>
            <Input type="date" value={form.join_date} onChange={e => set('join_date', e.target.value)} className="bg-accent" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Системный NIK</FieldLabel>
            <Input value={form.nickname} onChange={e => set('nickname', e.target.value)} placeholder="Никнейм" className="bg-accent" />
          </div>
          <div>
            <FieldLabel>Telegram Username</FieldLabel>
            <Input value={form.telegram_username} onChange={e => set('telegram_username', e.target.value)} className="bg-accent" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Telegram ID</FieldLabel>
            <Input value={form.telegram} onChange={e => set('telegram', e.target.value)} placeholder="Привязка через бота" className="bg-accent" />
          </div>
        </div>
      </FieldCard>

      {/* Org structure */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-base font-display font-bold text-foreground">
          <span className="w-1 h-5 bg-primary rounded-full" />
          Организационная Структура
        </h4>

        <FieldCard>
          <FieldLabel>Департамент (владелец)</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {topDepts.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDept(d.id)}
                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-display font-medium transition-all border ${
                  form.department_ids.includes(d.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground" style={{ backgroundColor: d.color ?? 'hsl(var(--muted))' }}>
                  {d.code?.replace(/[^\d]/g, '') || d.name[0]}
                </span>
                {d.name}
              </button>
            ))}
          </div>
        </FieldCard>

        {subDepts.length > 0 && (
          <FieldCard>
            <FieldLabel>Отдел / Секция (функциональная роль)</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {subDepts.filter(sd => form.department_ids.includes(sd.parent_id!)).map(sd => (
                <button
                  key={sd.id}
                  type="button"
                  onClick={() => toggleSubDept(sd.id)}
                  className={`text-xs px-3 py-2 rounded-lg font-display font-medium transition-all border ${
                    form.subdepartment_ids.includes(sd.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <span className="font-semibold">{sd.name}</span>
                  <span className="text-muted-foreground ml-1 text-[10px]">{sd.code}</span>
                </button>
              ))}
            </div>
          </FieldCard>
        )}
      </div>

      {/* Manager (read-only placeholder) */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-base font-display font-bold text-foreground">
          <span className="w-1 h-5 bg-primary rounded-full" />
          Руководитель
        </h4>
        <FieldCard>
          <FieldLabel>Непосредственный руководитель</FieldLabel>
          <div className="text-sm text-muted-foreground font-body">— Не назначен —</div>
          <p className="text-xs text-muted-foreground/60">При отправке SOS-сообщения, оно будет направлено этому руководителю</p>
        </FieldCard>
      </div>
    </div>
  );
}

/* ─── Section: Contacts ─── */
function SectionContacts({ form, set, addEmergencyContact, removeEmergencyContact, updateEmergencyContact }: {
  form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  addEmergencyContact: () => void; removeEmergencyContact: (i: number) => void;
  updateEmergencyContact: (i: number, f: keyof EmergencyContact, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Phone}>Контактная Информация</SectionTitle>

      <FieldCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Мобильный телефон</FieldLabel>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} className="bg-accent" />
          </div>
          <div>
            <FieldLabel>WhatsApp</FieldLabel>
            <Input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+1 234 567 8900" className="bg-accent" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Telegram Username</FieldLabel>
            <Input value={form.telegram_username} onChange={e => set('telegram_username', e.target.value)} className="bg-accent" />
          </div>
          <div>
            <FieldLabel>Telegram ID</FieldLabel>
            <Input value={form.telegram} onChange={e => set('telegram', e.target.value)} placeholder="Привязка через бота" className="bg-accent" />
          </div>
        </div>

        <div>
          <FieldLabel>Email (личный)</FieldLabel>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="bg-accent md:w-1/2" />
        </div>

        <div>
          <FieldLabel>Фактический адрес</FieldLabel>
          <Input value={form.actual_address} onChange={e => set('actual_address', e.target.value)} className="bg-accent" />
        </div>

        <div>
          <FieldLabel>Адрес регистрации</FieldLabel>
          <Input value={form.registration_address} onChange={e => set('registration_address', e.target.value)} className="bg-accent" />
        </div>
      </FieldCard>

      {/* Emergency contacts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-base font-display font-bold text-foreground">
            <span className="text-destructive">❤</span> Экстренные Контакты
          </h4>
          <button onClick={addEmergencyContact} className="text-xs font-display font-semibold text-primary hover:underline flex items-center gap-1">
            <Plus size={14} /> Добавить
          </button>
        </div>

        {form.emergency_contacts.length > 0 && (
          <FieldCard>
            {form.emergency_contacts.map((ec, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                <div>
                  <FieldLabel>Имя</FieldLabel>
                  <Input value={ec.name} onChange={e => updateEmergencyContact(i, 'name', e.target.value)} className="bg-accent" />
                </div>
                <div>
                  <FieldLabel>Кем приходится</FieldLabel>
                  <Input value={ec.relation} onChange={e => updateEmergencyContact(i, 'relation', e.target.value)} className="bg-accent" />
                </div>
                <div>
                  <FieldLabel>Телефон</FieldLabel>
                  <Input value={ec.phone} onChange={e => updateEmergencyContact(i, 'phone', e.target.value)} className="bg-accent" />
                </div>
                <button onClick={() => removeEmergencyContact(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg mb-0.5">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </FieldCard>
        )}
      </div>
    </div>
  );
}

/* ─── Section: Documents ─── */
function SectionDocuments({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="space-y-6">
      <SectionTitle icon={FileText}>Паспортные Данные</SectionTitle>

      <FieldCard>
        <div>
          <FieldLabel>ИНН</FieldLabel>
          <Input value={form.inn} onChange={e => set('inn', e.target.value)} className="bg-accent" />
        </div>

        <h4 className="font-display font-bold text-sm text-foreground pt-2">ВНУТРЕННИЙ ПАСПОРТ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Серия и номер</FieldLabel>
            <Input value={form.passport_number} onChange={e => set('passport_number', e.target.value)} className="bg-accent" />
          </div>
          <div>
            <FieldLabel>Дата выдачи</FieldLabel>
            <Input type="date" value={form.passport_date} onChange={e => set('passport_date', e.target.value)} className="bg-accent" />
          </div>
        </div>
        <div>
          <FieldLabel>Кем выдан</FieldLabel>
          <Input value={form.passport_issuer} onChange={e => set('passport_issuer', e.target.value)} className="bg-accent" />
        </div>

        <h4 className="font-display font-bold text-sm text-foreground pt-2">ЗАГРАНИЧНЫЙ ПАСПОРТ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Номер</FieldLabel>
            <Input value={form.foreign_passport} onChange={e => set('foreign_passport', e.target.value)} className="bg-accent" />
          </div>
          <div>
            <FieldLabel>Срок действия</FieldLabel>
            <Input type="date" value={form.foreign_passport_date} onChange={e => set('foreign_passport_date', e.target.value)} className="bg-accent" />
          </div>
        </div>
        <div>
          <FieldLabel>Кем выдан / Орган</FieldLabel>
          <Input value={form.foreign_passport_issuer} onChange={e => set('foreign_passport_issuer', e.target.value)} className="bg-accent" />
        </div>
      </FieldCard>
    </div>
  );
}

/* ─── Section: Finance ─── */
function SectionFinance({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Wallet}>Финансовые Реквизиты</SectionTitle>

      <FieldCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Банк</FieldLabel>
            <Input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} className="bg-accent" />
          </div>
          <div>
            <FieldLabel>Номер счета / карты</FieldLabel>
            <Input value={form.bank_details} onChange={e => set('bank_details', e.target.value)} className="bg-accent" />
          </div>
        </div>
      </FieldCard>

      <FieldCard className="bg-accent/30">
        <h4 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
          🌐 Крипто-кошелек
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Адрес кошелька</FieldLabel>
            <Input value={form.crypto_wallet} onChange={e => set('crypto_wallet', e.target.value)} placeholder="0x..." className="bg-accent" />
          </div>
          <div>
            <FieldLabel>Сеть (Network)</FieldLabel>
            <Input value={form.crypto_network} onChange={e => set('crypto_network', e.target.value)} placeholder="TRC20, BEP20..." className="bg-accent" />
          </div>
        </div>
        <div className="md:w-1/2">
          <FieldLabel>Валюта</FieldLabel>
          <Input value={form.crypto_currency} onChange={e => set('crypto_currency', e.target.value)} placeholder="USDT" className="bg-accent" />
        </div>
      </FieldCard>
    </div>
  );
}

/* ─── Section: Files ─── */
function SectionFiles({ employeeId }: { employeeId?: string | null }) {
  const docCategories = [
    { key: 'contract_nda', label: 'Договор/NDA' },
    { key: 'passport_scan', label: 'Скан паспорта' },
    { key: 'inn_snils', label: 'ИНН/СНИЛС' },
    { key: 'zrs', label: 'ЗРС' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle icon={FolderOpen}>Файлы и Документы</SectionTitle>
        <button className="flex items-center gap-1.5 text-xs font-display font-semibold text-primary hover:underline">
          <Upload size={14} /> Загрузить
        </button>
      </div>

      <FieldCard>
        <FieldLabel>Статус документов</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          {docCategories.map(cat => (
            <div key={cat.key} className="flex items-center gap-2 p-3 border border-border rounded-lg">
              <FileText size={16} className="text-muted-foreground" />
              <span className="text-sm font-body text-foreground">{cat.label}</span>
            </div>
          ))}
        </div>
      </FieldCard>

      <FieldCard>
        <p className="text-center text-sm text-muted-foreground py-6">Нет загруженных файлов</p>
      </FieldCard>
    </div>
  );
}

/* ─── Placeholder section ─── */
function SectionPlaceholder({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Icon}>{title}</SectionTitle>
      <div className="border border-dashed border-border rounded-xl p-12 text-center">
        <Icon size={32} className="mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground font-body">Раздел в разработке</p>
      </div>
    </div>
  );
}
