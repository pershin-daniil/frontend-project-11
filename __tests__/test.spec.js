// @ts-check
const { test, expect } = require('@playwright/test');

test('page exist and has elements', async ({ page }) => {
  await expect(page).toHaveTitle(/RSS Reader/);
  expect(await page.screenshot()).toMatchSnapshot('../__fixture__/rss_empty_home_page.png', {
    maxDiffPixelRatio: 0.05,
    threshold: 0.3,
  });
});

test.beforeEach(async ({ page }) => {
  await page.goto('https://frontend-project-11-roan.vercel.app/');
  await page.getByLabel('Ссылка RSS').fill('http://lorem-rss.herokuapp.com/feed');
  await page.getByRole('button', { name: 'add' }).click();
});

test('validation check', async ({ page }) => {
  const input = await page.getByLabel('Ссылка RSS');
  const button = await page.getByRole('button', { name: 'add' });
  await expect(page.getByText('RSS успешно загружен')).toBeVisible();
  await input.fill('qwerty');
  await button.click();
  await expect(page.getByText('Ссылка должна быть валидным URL')).toBeVisible();
  await input.clear();
  await input.fill('http://lorem-rss.herokuapp.com/feed');
  await button.click();
  await expect(page.getByText('RSS уже существует')).toBeVisible();
  await input.clear();
  await input.fill('https://playwright.dev/docs/api/class-test#test-before-each');
  await button.click();
  await expect(page.getByText('Ресурс не содержит валидный RSS')).toBeVisible();
});

test('RSS feeds appears', async ({ page }) => {
  await expect(page.getByText('Посты')).toBeVisible();
  await expect(page.getByText('Фиды')).toBeVisible();
});

test('Modal working', async ({ page }) => {
  await expect(page.getByLabel('modal')).toBeHidden();
  await page.getByRole('button', { name: 'Просмотр' }).first().click();
  await expect(page.locator('.modal')).toHaveClass('modal fade show');
});
// await page.getByLabel('User Name').fill('John');

// await page.getByLabel('Password').fill('secret-password');

// await page.getByRole('button', { name: 'Sign in' }).click();

// await expect(page.getByText('Welcome, John!')).toBeVisible();
