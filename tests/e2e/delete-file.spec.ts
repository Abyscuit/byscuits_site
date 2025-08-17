import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { discordLogin } from './utils/discordLogin';

const TEST_FOLDER = 'E2ETestFolder';
const TEST_FILE = 'e2e-delete-me.txt';
const TEST_FILE_CONTENT = 'delete me e2e';

// Helper to clean up uploads and metadata
function cleanup() {
  const testEmail = process.env.NEXT_PUBLIC_DISCORD_TEST_EMAIL;
  if (!testEmail) return;
  const uploadDir = path.join(process.cwd(), 'uploads', testEmail);
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }
  const metaDir = path.join(process.cwd(), 'data', 'file-metadata');
  if (fs.existsSync(metaDir)) {
    fs.readdirSync(metaDir).forEach(f => {
      if (f.endsWith('.json')) {
        const content = fs.readFileSync(path.join(metaDir, f), 'utf-8');
        if (content.includes(testEmail)) fs.unlinkSync(path.join(metaDir, f));
      }
    });
  }
}

test.describe('Cloud Dashboard File Deletion E2E (Discord OAuth)', () => {
  test.beforeEach(async () => {
    cleanup();
  });
  test.afterEach(async () => {
    cleanup();
  });

  test('user can login with Discord, upload, and delete a file in a subfolder', async ({ page }) => {
    await discordLogin(page);
    // 2. Create a new folder
    await page.waitForTimeout(500);
    if (!await page.getByText(TEST_FOLDER).isVisible()) {
      await page.getByRole('button', { name: /new folder/i }).click();
      await page.getByLabel('Folder Name').fill(TEST_FOLDER);
      await page.getByRole('button', { name: /create folder/i }).click();
      await expect(page.getByText(TEST_FOLDER)).toBeVisible();
    }
    // 3. Enter the folder
    await page.getByText(TEST_FOLDER).click();
    await expect(page.getByRole('heading', { name: /cloud storage/i })).toBeVisible();
    // 4. Upload a file
    await page.getByRole('button', { name: /upload/i }).click();
    const filePath = path.join(process.cwd(), TEST_FILE);
    fs.writeFileSync(filePath, TEST_FILE_CONTENT);
    await page.setInputFiles('input[type="file"]', filePath);
    await page.getByRole('button', { name: /^upload$/i }).click();
    await expect(page.getByText(TEST_FILE)).toBeVisible();
    fs.unlinkSync(filePath);
    // 5. Delete the file
    await page.getByRole('button', { name: /delete/i, exact: false }).click();
    await page.getByRole('button', { name: /delete/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(TEST_FILE)).not.toBeVisible();
  });

  test('user can delete a folder with a file inside', async ({ page }) => {
    await discordLogin(page);
    // 2. Create a new folder
    await page.waitForTimeout(500);
    if (!await page.getByText(TEST_FOLDER).isVisible()) {
      await page.getByRole('button', { name: /new folder/i }).click();
      await page.getByLabel('Folder Name').fill(TEST_FOLDER);
      await page.getByRole('button', { name: /create folder/i }).click();
      await expect(page.getByText(TEST_FOLDER)).toBeVisible();
    }
    // 3. Enter the folder
    await page.getByText(TEST_FOLDER).click();
    await expect(page.getByRole('heading', { name: /cloud storage/i })).toBeVisible();
    // 4. Upload a file
    await page.getByRole('button', { name: /upload/i }).click();
    const filePath = path.join(process.cwd(), TEST_FILE);
    fs.writeFileSync(filePath, TEST_FILE_CONTENT);
    await page.setInputFiles('input[type="file"]', filePath);
    await page.getByRole('button', { name: /^upload$/i }).click();
    await expect(page.getByText(TEST_FILE)).toBeVisible();
    fs.unlinkSync(filePath);
    // 5. Go back to root and delete the folder
    await page.getByRole('button', { name: /←/i }).click();
    await expect(page.getByText(TEST_FOLDER)).toBeVisible();
    await page.getByRole('button', { name: /delete/i, exact: false }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Delete/i }).last().click();
    await page.waitForTimeout(500);
    await expect(page.getByText(TEST_FOLDER)).not.toBeVisible();
  });
}); 