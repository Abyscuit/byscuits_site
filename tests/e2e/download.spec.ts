import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { discordLogin } from './utils/discordLogin';

const TEST_FOLDER = 'E2ETestFolder';
const TEST_FILE = 'e2e-delete-me.txt';
const TEST_FILE_CONTENT = 'delete me e2e';

test.describe('File Download', () => {
  test('user can download a file and it matches the uploaded content', async ({ page, context }) => {
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
    // Download the file
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download/i }).click(),
    ]);
    const downloadPath = path.join(process.cwd(), 'downloaded-' + TEST_FILE);
    await download.saveAs(downloadPath);
    const downloadedContent = fs.readFileSync(downloadPath, 'utf-8');
    expect(downloadedContent).toBe(TEST_FILE_CONTENT);
    fs.unlinkSync(filePath);
    fs.unlinkSync(downloadPath);
  });
}); 