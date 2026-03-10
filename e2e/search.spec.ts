import { test, expect } from '@playwright/test';
import { setupApp } from './helpers/mock';

test.describe('Глобальный поиск', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.waitForLoadState('networkidle');
  });

  test('открывается по Cmd+K (Ctrl+K)', async ({ page }) => {
    await page.keyboard.press('Meta+k');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator('input')).toBeFocused();
  });

  test('открывается по клику на поле поиска в хедере', async ({ page }) => {
    const searchTrigger = page.locator('header button').filter({ hasText: /поиск|⌘K/i }).first()
      .or(page.locator('header').locator('button:has(svg[data-lucide="search"])').first());

    await searchTrigger.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });

  test('закрывается по Escape', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3_000 });
  });

  test('показывает результаты при вводе имени сотрудника', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Ждём пока данные загрузятся — должна появиться хотя бы одна группа результатов
    const input = dialog.locator('input');
    await expect(dialog.getByText('Сотрудники').or(dialog.getByText('Иванов Иван Иванович')).first()).toBeVisible({ timeout: 10_000 });

    await input.fill('Иванов');
    await expect(dialog.getByText('Иванов Иван Иванович')).toBeVisible({ timeout: 5_000 });
  });

  test('показывает результаты при вводе названия курса', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Ждём загрузки данных
    await expect(dialog.getByText('Курсы').or(dialog.getByText('Введение в продажи')).first()).toBeVisible({ timeout: 10_000 });

    await dialog.locator('input').fill('продаж');
    await expect(dialog.getByText('Введение в продажи')).toBeVisible({ timeout: 5_000 });
  });

  test('показывает "Ничего не найдено" для несуществующего запроса', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Ждём загрузки данных прежде чем фильтровать
    await expect(dialog.getByText('Сотрудники').or(dialog.getByText('Иванов Иван Иванович')).first()).toBeVisible({ timeout: 10_000 });

    await dialog.locator('input').fill('xyzxyzxyz123');
    await expect(dialog.getByText(/ничего не найдено/i)).toBeVisible({ timeout: 5_000 });
  });

  test('при выборе сотрудника переходит в раздел сотрудников и закрывает поиск', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    await expect(dialog.getByText('Иванов Иван Иванович')).toBeVisible({ timeout: 10_000 });
    await dialog.locator('input').fill('Иванов');
    await expect(dialog.getByText('Иванов Иван Иванович')).toBeVisible({ timeout: 5_000 });
    await dialog.getByText('Иванов Иван Иванович').click();

    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
    expect(new URL(page.url()).searchParams.get('view')).toBe('employees');
  });

  test('при выборе курса переходит в академию', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    await expect(dialog.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });
    await dialog.locator('input').fill('продаж');
    await expect(dialog.getByText('Введение в продажи')).toBeVisible({ timeout: 5_000 });
    await dialog.getByText('Введение в продажи').click();

    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
    expect(new URL(page.url()).searchParams.get('view')).toBe('academy');
  });
});
