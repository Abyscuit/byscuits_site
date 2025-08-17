import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { discordLogin } from './utils/discordLogin';

const TEST_FOLDER = 'E2ETestFolder';
const TEST_FILE = 'e2e-delete-me.txt';
const TEST_FILE_CONTENT = 'delete me e2e';

test.describe('File Sharing', () => {
  test('user can make a file public and access it via share link', async ({ page, context }) => {
    await discordLogin(page);
    await page.waitForTimeout(500);
    if (!await page.getByText(TEST_FOLDER).isVisible()) {
      await page.getByRole('button', { name: /new folder/i }).click();
      await page.getByLabel('Folder Name').fill(TEST_FOLDER);
      await page.getByRole('button', { name: /create folder/i }).click();
      await expect(page.getByText(TEST_FOLDER)).toBeVisible();
    }
    await page.getByText(TEST_FOLDER).click();
    await page.getByRole('button', { name: /upload/i }).click();
    const filePath = path.join(process.cwd(), TEST_FILE);
    fs.writeFileSync(filePath, TEST_FILE_CONTENT);
    await page.setInputFiles('input[type="file"]', filePath);
    await page.getByRole('button', { name: /^upload$/i }).click();
    await expect(page.getByText(TEST_FILE)).toBeVisible();
    // Make file public/shareable
    await page.getByRole('button', { name: /share/i, exact: false }).click();
    await page.getByLabel('Make file public').check();
    // Copy share URL
    const shareUrl = await page.getByLabel('Share URL:').inputValue();
    // Open in new context (incognito)
    const incognito = await context.browser().newContext();
    const incognitoPage = await incognito.newPage();
    await incognitoPage.goto(shareUrl);
    await expect(incognitoPage.getByText(TEST_FILE)).toBeVisible();
    await incognito.close();
    fs.unlinkSync(filePath);
  });
}); 