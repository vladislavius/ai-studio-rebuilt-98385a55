import { Department } from '@/types';

export const ORGANIZATION_STRUCTURE: Record<string, Department> = {
  dept1: {
    id: 'dept1',
    name: 'Отд. 1 — Кадры',
    fullName: 'Отдел 1 — Кадры и коммуникации',
    color: '#4C5CFF',
    icon: 'Users',
    description: 'Управление персоналом',
    manager: 'HR Director',
  },
  dept2: {
    id: 'dept2',
    name: 'Отд. 2 — Маркетинг',
    fullName: 'Отдел 2 — Маркетинг и продвижение',
    color: '#F0FF6B',
    icon: 'Megaphone',
    description: 'Маркетинг и реклама',
    manager: 'Marketing Director',
  },
  dept3: {
    id: 'dept3',
    name: 'Отд. 3 — Финансы',
    fullName: 'Отдел 3 — Финансовый отдел',
    color: '#22C55E',
    icon: 'DollarSign',
    description: 'Финансы и бухгалтерия',
    manager: 'CFO',
  },
  dept4: {
    id: 'dept4',
    name: 'Отд. 4 — Продукт',
    fullName: 'Отдел 4 — Продукт и разработка',
    color: '#F97316',
    icon: 'Code',
    description: 'Разработка продуктов',
    manager: 'CTO',
  },
  dept5: {
    id: 'dept5',
    name: 'Отд. 5 — Качество',
    fullName: 'Отдел 5 — Качество и совершенствование',
    color: '#EC4899',
    icon: 'Shield',
    description: 'Контроль качества',
    manager: 'Quality Director',
  },
  dept6: {
    id: 'dept6',
    name: 'Отд. 6 — Связи',
    fullName: 'Отдел 6 — Связи с общественностью',
    color: '#8B5CF6',
    icon: 'Globe',
    description: 'PR и коммуникации',
    manager: 'PR Director',
  },
  dept7: {
    id: 'dept7',
    name: 'Отд. 7 — Управление',
    fullName: 'Отдел 7 — Управление и координация',
    color: '#EF4444',
    icon: 'Crown',
    description: 'Высшее руководство',
    manager: 'CEO',
  },
};

export const DEPT_SORT_ORDER = ['dept1', 'dept2', 'dept3', 'dept4', 'dept5', 'dept6', 'dept7'];
