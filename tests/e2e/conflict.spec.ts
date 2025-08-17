import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { discordLogin } from './utils/discordLogin';

const TEST_FOLDER = 'E2ETestFolder';
const TEST_FILE = 'e2e-delete-me.txt';
const TEST_FILE_CONTENT = 'delete me e2e';

test.describe('Conflict Testing', () => {
  test('shows error when uploading a duplicate file', async ({ page }) => {
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
    // Try uploading the same file again
    await page.getByRole('button', { name: /upload/i }).click();
    await page.setInputFiles('input[type="file"]', filePath);
    await page.getByRole('button', { name: /^upload$/i }).click();
    await expect(page.locator('text=/already exists|conflict|error/i')).toBeVisible();
    fs.unlinkSync(filePath);
  });

  test('shows error when creating a duplicate folder', async ({ page }) => {
    await discordLogin(page);
    await page.waitForTimeout(500);
    // Create folder first
    await page.getByRole('button', { name: /new folder/i }).click();
    await page.getByLabel('Folder Name').fill('DuplicateFolder');
    await page.getByRole('button', { name: /create folder/i }).click();
    await expect(page.getByText('DuplicateFolder')).toBeVisible();
    // Try to create the same folder again
    await page.getByRole('button', { name: /new folder/i }).click();
    await page.getByLabel('Folder Name').fill('DuplicateFolder');
    await page.getByRole('button', { name: /create folder/i }).click();
    await expect(page.locator('text=/already exists|conflict|error/i')).toBeVisible();
  });
}); 