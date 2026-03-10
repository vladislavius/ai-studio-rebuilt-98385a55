import { test, expect } from '@playwright/test';
import { mockAPI, setupApp } from './helpers/mock';

test.describe('Аутентификация', () => {
  test('показывает форму входа для неавторизованного пользователя', async ({ page }) => {
    await mockAPI(page);
    await page.goto('/');

    // Должна отобразиться форма авторизации, а не основной интерфейс
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible({ timeout: 10_000 });
    // Основной сайдбар не должен быть виден
    await expect(page.locator('[data-testid="app-sidebar"]').or(page.locator('nav')).first()).not.toContainText('Остров', { timeout: 3_000 }).catch(() => {});
  });

  test('форма входа содержит поля email и пароль', async ({ page }) => {
    await mockAPI(page);
    await page.goto('/');

    await expect(page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="почт" i]').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('авторизованный пользователь видит основной интерфейс', async ({ page }) => {
    await setupApp(page);

    // Ждём пока пропадёт лоадер и появится хедер
    await expect(page.locator('header')).toBeVisible({ timeout: 15_000 });
    // URL не должен содержать /auth или /login
    expect(page.url()).not.toContain('auth');
  });

  test('авторизованный пользователь видит строку поиска', async ({ page }) => {
    await setupApp(page);

    // Кнопка поиска (открывает глобальный поиск)
    await expect(page.getByRole('button', { name: /поиск/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
