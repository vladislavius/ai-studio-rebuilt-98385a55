import { test, expect } from '@playwright/test';
import { setupApp } from './helpers/mock';

test.describe('URL-навигация', () => {
  test('начальная страница загружается без параметров — показывает command_center', async ({ page }) => {
    await setupApp(page);

    await page.waitForLoadState('networkidle');
    // Либо нет view-параметра, либо он равен command_center
    const url = new URL(page.url());
    const view = url.searchParams.get('view');
    expect(view === null || view === 'command_center').toBeTruthy();
  });

  test('прямой URL с view=academy открывает академию', async ({ page }) => {
    await setupApp(page, '/?view=academy');

    await page.waitForLoadState('networkidle');
    // Должен появиться заголовок академии
    await expect(page.locator('h1, [class*="display"]').filter({ hasText: /академи|academy|курс/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('прямой URL с view=employees требует admin и показывает раздел сотрудников', async ({ page }) => {
    await setupApp(page, '/?view=employees&sub=list');

    await page.waitForLoadState('networkidle');
    // Секция сотрудников или скелетон загрузки
    await expect(
      page.locator('text=Всего').or(page.locator('[class*="skeleton"]')).or(page.locator('text=Сотрудников')).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('URL обновляется при смене раздела через сайдбар', async ({ page }) => {
    await setupApp(page);
    await page.waitForLoadState('networkidle');

    // Ищем ссылки навигации — sidebar или bottom nav
    const academyLink = page.locator('a, button').filter({ hasText: /академи|academy/i }).first();
    await expect(academyLink).toBeVisible({ timeout: 10_000 });
    await academyLink.click();

    await page.waitForLoadState('networkidle');
    const url = new URL(page.url());
    expect(url.searchParams.get('view')).toBe('academy');
  });

  test('кнопка Назад браузера восстанавливает предыдущий раздел', async ({ page }) => {
    await setupApp(page);
    await page.waitForLoadState('networkidle');

    const initialUrl = page.url();

    // Переходим в академию
    const academyLink = page.locator('a, button').filter({ hasText: /академи|academy/i }).first();
    await expect(academyLink).toBeVisible({ timeout: 10_000 });
    await academyLink.click();
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).searchParams.get('view')).toBe('academy');

    // Жмём Назад
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // URL должен вернуться к исходному
    expect(page.url()).toBe(initialUrl);
  });

  test('обновление страницы сохраняет выбранный раздел', async ({ page }) => {
    await setupApp(page, '/?view=academy');
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).searchParams.get('view')).toBe('academy');
  });

  test('параметр sub сохраняется при переходе в подраздел сотрудников', async ({ page }) => {
    await setupApp(page, '/?view=employees&sub=birthdays');
    await page.waitForLoadState('networkidle');

    const url = new URL(page.url());
    expect(url.searchParams.get('view')).toBe('employees');
    expect(url.searchParams.get('sub')).toBe('birthdays');
  });
});
