import { test, expect } from '@playwright/test';
import { setupApp } from './helpers/mock';

test.describe('Уведомления', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.waitForLoadState('networkidle');
    // Ждём пока приложение полностью загрузится (появится кнопка поиска)
    await expect(page.getByRole('button', { name: /поиск/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('колокольчик уведомлений присутствует в хедере', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Уведомления' })).toBeVisible();
  });

  test('красная точка отображается при наличии уведомлений (ДР через 3 дня)', async ({ page }) => {
    // Индикатор — маленький кружок рядом с колокольчиком
    // Он рендерится внутри кнопки как `absolute` элемент
    const bell = page.getByRole('button', { name: 'Уведомления' });
    await expect(bell).toBeVisible();

    // Проверяем что внутри кнопки есть элемент-индикатор (w-2 h-2 bg-primary rounded-full)
    const dot = bell.locator('[class*="absolute"][class*="rounded-full"]');
    await expect(dot).toBeVisible({ timeout: 10_000 });
  });

  test('клик на колокольчик открывает панель уведомлений', async ({ page }) => {
    await page.getByRole('button', { name: 'Уведомления' }).click();
    // Заголовок панели — paragraph внутри панели
    await expect(page.locator('div[class*="border-b"] p').filter({ hasText: 'Уведомления' })).toBeVisible({ timeout: 5_000 });
  });

  test('панель показывает день рождения Иванова', async ({ page }) => {
    await page.getByRole('button', { name: 'Уведомления' }).click();

    // Иванов Иван Иванович с ДР через 3 дня должен быть в списке уведомлений
    const notifList = page.locator('ul').filter({ has: page.locator('li') });
    await expect(notifList.getByText('Иванов Иван Иванович')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/день рождения через 3/i)).toBeVisible({ timeout: 5_000 });
  });

  test('панель закрывается при клике на X', async ({ page }) => {
    await page.getByRole('button', { name: 'Уведомления' }).click();
    await expect(page.locator('div[class*="border-b"] p').filter({ hasText: 'Уведомления' })).toBeVisible({ timeout: 5_000 });

    // Кнопка закрытия X — aria-label добавлен в NotificationsPanel.tsx
    await page.getByRole('button', { name: 'Закрыть уведомления' }).click();

    // Панель должна закрыться
    await expect(page.locator('div[class*="border-b"] p').filter({ hasText: 'Уведомления' })).not.toBeVisible({ timeout: 3_000 });
  });

  test('панель закрывается при клике на backdrop', async ({ page }) => {
    await page.getByRole('button', { name: 'Уведомления' }).click();
    await expect(page.locator('div[class*="border-b"] p').filter({ hasText: 'Уведомления' })).toBeVisible({ timeout: 5_000 });

    // Нажимаем на backdrop напрямую (fixed inset-0 z-30)
    await page.evaluate(() => {
      const backdrop = document.querySelector<HTMLElement>('.fixed.inset-0');
      backdrop?.click();
    });

    await expect(page.locator('div[class*="border-b"] p').filter({ hasText: 'Уведомления' })).not.toBeVisible({ timeout: 3_000 });
  });
});
