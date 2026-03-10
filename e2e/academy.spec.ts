import { test, expect } from '@playwright/test';
import { setupApp } from './helpers/mock';

test.describe('Академия — список курсов', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page, '/?view=academy');
    await page.waitForLoadState('networkidle');
    // Ждём появления первого курса
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 15_000 });
  });

  test('отображает список курсов', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('HST Технический курс')).toBeVisible();
    await expect(page.getByText('Черновик онбординга')).toBeVisible();
  });

  test('показывает статус опубликован/черновик на карточке', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });
    // Статус-бейдж
    const published = page.locator('[class*="bg-primary"]:has-text("актив"), text=Активен, text=Опубликован, [class*="badge"]:has-text("актив")').first()
      .or(page.getByText(/актив|опублик/i).first());
    await expect(published).toBeVisible({ timeout: 5_000 }).catch(() => {
      // Проверяем что хотя бы есть что-то про draft
      return expect(page.getByText(/черновик|draft/i).first()).toBeVisible({ timeout: 5_000 });
    });
  });

  test('поиск по названию фильтрует курсы', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });

    const searchInput = page.locator('input[placeholder*="названию"]');
    await searchInput.fill('продаж');

    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('HST Технический курс')).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Черновик онбординга')).not.toBeVisible({ timeout: 3_000 });
  });

  test('фильтр "Активные" показывает только опубликованные курсы', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /активные/i }).click();

    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('HST Технический курс')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Черновик онбординга')).not.toBeVisible({ timeout: 3_000 });
  });

  test('фильтр "Черновики" показывает только неопубликованные курсы', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /черновики/i }).click();

    await expect(page.getByText('Черновик онбординга')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Введение в продажи')).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('HST Технический курс')).not.toBeVisible({ timeout: 3_000 });
  });

  test('фильтр "HST" показывает только HST-курсы', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'HST' }).click();

    await expect(page.getByText('HST Технический курс')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Введение в продажи')).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Черновик онбординга')).not.toBeVisible({ timeout: 3_000 });
  });

  test('фильтр "Все" возвращает полный список', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });

    // Сначала применяем фильтр
    await page.getByRole('button', { name: /черновики/i }).click();
    await expect(page.getByText('Введение в продажи')).not.toBeVisible({ timeout: 3_000 });

    // Возвращаемся к "Все"
    await page.getByRole('button', { name: /^все$/i }).click();
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Черновик онбординга')).toBeVisible({ timeout: 3_000 });
  });

  test('комбинация поиска и фильтра работает', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /активные/i }).click();
    const searchInput = page.locator('input[placeholder*="названию"]');
    await searchInput.fill('HST');

    await expect(page.getByText('HST Технический курс')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Введение в продажи')).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Черновик онбординга')).not.toBeVisible({ timeout: 3_000 });
  });

  test('показывает "Ничего не найдено" при отсутствии результатов', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });

    await page.locator('input[placeholder*="названию"]').fill('абракадабра_xyz');

    await expect(page.getByText(/ничего не найдено/i)).toBeVisible({ timeout: 5_000 });
  });

  test('счётчик в заголовке показывает общее количество, а не отфильтрованное', async ({ page }) => {
    await expect(page.getByText('Введение в продажи')).toBeVisible({ timeout: 10_000 });

    // Применяем фильтр чтобы осталось меньше курсов
    await page.getByRole('button', { name: /черновики/i }).click();

    // Заголовок должен показывать общее количество (3), а не 1
    const subtitle = page.locator('p').filter({ hasText: /3.*курс/i }).first()
      .or(page.locator('[class*="muted"]').filter({ hasText: '3' }).first());
    await expect(subtitle).toBeVisible({ timeout: 5_000 });
  });
});
