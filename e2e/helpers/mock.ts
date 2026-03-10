import { Page } from '@playwright/test';

// ─── Mock data ───────────────────────────────────────────────────────────────

export const MOCK_USER = {
  id: 'mock-user-id',
  email: 'admin@test.com',
  role: 'authenticated',
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

export const MOCK_SESSION = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token',
  user: MOCK_USER,
};

// Birthday 3 days from now (month/day only — year set to current for notification logic)
function birthdayInDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `1990-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const MOCK_EMPLOYEES = [
  {
    id: 'emp-1',
    full_name: 'Иванов Иван Иванович',
    position: 'Менеджер',
    email: 'ivanov@test.com',
    phone: '+7 900 000 0001',
    telegram_username: 'ivanov',
    department_ids: ['dept-1'],
    subdepartment_ids: [],
    birth_date: birthdayInDays(3),
    join_date: '2022-03-01',
    photo_url: null,
    nickname: 'Ваня',
    emergency_contacts: [],
    custom_fields: [],
    attachments: [],
    created_at: '2022-03-01T00:00:00Z',
    updated_at: '2022-03-01T00:00:00Z',
  },
  {
    id: 'emp-2',
    full_name: 'Петрова Мария Сергеевна',
    position: 'Разработчик',
    email: 'petrova@test.com',
    phone: '+7 900 000 0002',
    telegram_username: 'petrova',
    department_ids: ['dept-2'],
    subdepartment_ids: [],
    birth_date: '1995-06-15',
    join_date: '2023-01-15',
    photo_url: null,
    nickname: null,
    emergency_contacts: [],
    custom_fields: [],
    attachments: [],
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z',
  },
];

export const MOCK_DEPARTMENTS = [
  { id: 'dept-1', code: 'D1', name: 'Продажи', full_name: 'Отдел продаж', color: '#6366f1', icon: null, description: null, long_description: null, manager_name: null, goal: null, vfp: null, main_stat: null, sort_order: 1, parent_id: null },
  { id: 'dept-2', code: 'D2', name: 'Разработка', full_name: 'Отдел разработки', color: '#10b981', icon: null, description: null, long_description: null, manager_name: null, goal: null, vfp: null, main_stat: null, sort_order: 2, parent_id: null },
];

export const MOCK_COURSES = [
  { id: 'course-1', title: 'Введение в продажи', description: 'Базовый курс', duration_hours: 8, is_published: true, is_hst_course: false, sections: [], created_at: '2024-01-01T00:00:00Z' },
  { id: 'course-2', title: 'HST Технический курс', description: 'Технические навыки', duration_hours: 16, is_published: true, is_hst_course: true, sections: [{}, {}], created_at: '2024-02-01T00:00:00Z' },
  { id: 'course-3', title: 'Черновик онбординга', description: null, duration_hours: null, is_published: false, is_hst_course: false, sections: [], created_at: '2024-03-01T00:00:00Z' },
];

// ─── Setup helpers ───────────────────────────────────────────────────────────

const SUPABASE_PROJECT = 'lubekziwlzjvyzatphgi';
const SUPABASE_URL = `https://${SUPABASE_PROJECT}.supabase.co`;

/**
 * Inject mock Supabase session into localStorage before page load.
 * Supabase v2 stores the raw session object directly (not wrapped).
 */
export async function mockAuth(page: Page) {
  await page.addInitScript(({ key, session }) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, {
    key: `sb-${SUPABASE_PROJECT}-auth-token`,
    session: MOCK_SESSION,
  });
}

/**
 * Intercept Supabase REST & Auth endpoints.
 *
 * IMPORTANT: Playwright matches routes in LIFO order (last registered = first matched).
 * Register the catch-all FIRST, specific handlers LAST so specifics take precedence.
 */
export async function mockAPI(page: Page) {
  // 1. Catch-all: register FIRST (runs LAST due to LIFO)
  await page.route(`${SUPABASE_URL}/rest/v1/**`, route => {
    // Default: return empty array for any unmatched REST table
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // 2. Specific routes: register AFTER (run FIRST due to LIFO)

  // company_settings (for labels)
  await page.route(`${SUPABASE_URL}/rest/v1/company_settings*`, route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // departments
  await page.route(`${SUPABASE_URL}/rest/v1/departments*`, route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DEPARTMENTS) });
  });

  // courses
  await page.route(`${SUPABASE_URL}/rest/v1/courses*`, route => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COURSES) });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COURSES[0]) });
    }
  });

  // employees
  await page.route(`${SUPABASE_URL}/rest/v1/employees*`, route => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EMPLOYEES) });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EMPLOYEES[0]) });
    }
  });

  // user_roles — must return admin role for isAdmin=true
  await page.route(`${SUPABASE_URL}/rest/v1/user_roles*`, route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ role: 'admin' }]) });
  });

  // Auth endpoints — register last (highest LIFO priority)
  await page.route(`${SUPABASE_URL}/auth/v1/**`, route => {
    const url = route.request().url();
    if (url.includes('/user')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) });
    }
  });
}

/**
 * Full setup: mock auth + API, then navigate to page.
 */
export async function setupApp(page: Page, path = '/') {
  await mockAuth(page);
  await mockAPI(page);
  await page.goto(path);
}
