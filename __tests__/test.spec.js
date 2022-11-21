// @ts-check
const { test, expect } = require('@playwright/test');

test('page exist and has elements', async ({ page }) => {
  await page.goto('http://localhost:8080/');
  await expect(page).toHaveTitle(/RSS Reader/);
  expect(await page.screenshot()).toMatchSnapshot('../__fixture__/rss_empty_home_page.png', {
    maxDiffPixelRatio: 0.01,
    threshold: 0.25,
  });
});

