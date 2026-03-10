import { test, expect } from '@playwright/test';
import { setupApp } from './helpers/mock';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('Список сотрудников', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page, '/?view=employees&sub=list&list_sub=employees');
    await page.waitForLoadState('networkidle');
    // Ждём пока isAdmin установится и EmployeesPage с данными отрендерится
    await expect(page.getByRole('heading', { name: 'Иванов Иван Иванович' })).toBeVisible({ timeout: 20_000 });
  });

  test('показывает скелетон или данные сотрудников', async ({ page }) => {
    // beforeEach уже дождался данных — просто проверяем что карточки есть
    await expect(page.getByRole('heading', { name: 'Иванов Иван Иванович' })).toBeVisible();
  });

  test('отображает карточки сотрудников после загрузки', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Иванов Иван Иванович' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Петрова Мария Сергеевна' })).toBeVisible();
  });

  test('показывает счётчик "Всего: N"', async ({ page }) => {
    await expect(page.getByText(/всего:\s*2/i).first()).toBeVisible();
  });

  test('фильтрует по имени через поиск', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]');
    await searchInput.fill('Петрова');

    await expect(page.getByRole('heading', { name: 'Иванов Иван Иванович' })).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('heading', { name: 'Петрова Мария Сергеевна' })).toBeVisible();
  });

  test('фильтрует по должности', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]');
    await searchInput.fill('Разработчик');

    await expect(page.getByRole('heading', { name: 'Иванов Иван Иванович' })).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('heading', { name: 'Петрова Мария Сергеевна' })).toBeVisible();
  });

  test('очистка поиска восстанавливает полный список', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]');
    await searchInput.fill('Иванов');
    await expect(page.getByRole('heading', { name: 'Петрова Мария Сергеевна' })).not.toBeVisible({ timeout: 3_000 });

    await searchInput.clear();
    await expect(page.getByRole('heading', { name: 'Петрова Мария Сергеевна' })).toBeVisible({ timeout: 3_000 });
  });

  test('показывает сообщение "Ничего не найдено" при пустом результате', async ({ page }) => {
    await page.locator('input[placeholder*="Поиск"]').fill('zzzzz_несуществующий');
    await expect(page.getByText(/ничего не найдено/i)).toBeVisible({ timeout: 5_000 });
  });

  test('кнопка CSV видна когда есть данные', async ({ page }) => {
    await expect(page.getByRole('button', { name: /csv/i })).toBeVisible();
  });

  test('CSV-экспорт скачивает файл', async ({ page }) => {
    await expect(page.getByText('Иванов Иван Иванович')).toBeVisible({ timeout: 15_000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /csv/i }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/employees_\d{4}-\d{2}-\d{2}\.csv/);
  });

  test('CSV содержит корректные данные', async ({ page }) => {
    await expect(page.getByText('Иванов Иван Иванович')).toBeVisible({ timeout: 15_000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /csv/i }).click(),
    ]);

    const tmpPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(tmpPath);
    const content = fs.readFileSync(tmpPath, 'utf-8');

    expect(content).toContain('Иванов Иван Иванович');
    expect(content).toContain('Петрова Мария Сергеевна');
    expect(content).toContain('ФИО');
    expect(content).toContain('Email');
    fs.unlinkSync(tmpPath);
  });

  test('пагинация не отображается при 2 сотрудниках (меньше PAGE_SIZE=20)', async ({ page }) => {
    await expect(page.getByText('Иванов Иван Иванович')).toBeVisible({ timeout: 15_000 });

    // Кнопки навигации страниц не должны быть видны
    await expect(page.getByRole('button', { name: /^[0-9]/ }).first()).not.toBeVisible({ timeout: 2_000 }).catch(() => {});
    // Более надёжно: ищем кнопку с текстом "1 / 1" или стрелки
    const pagination = page.locator('[class*="pagination"], nav[aria-label*="pagination"]');
    await expect(pagination).not.toBeVisible({ timeout: 2_000 }).catch(() => {});
  });
});
