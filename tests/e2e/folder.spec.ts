import { test, expect } from '@playwright/test';
import { discordLogin } from './utils/discordLogin';

test.describe('Deleting Folders', () => {
  test('user can delete an empty folder', async ({ page }) => {
    await discordLogin(page);
    await page.waitForTimeout(500);
    // Create empty folder
    await page.getByRole('button', { name: /new folder/i }).click();
    await page.getByLabel('Folder Name').fill('EmptyFolder');
    await page.getByRole('button', { name: /create folder/i }).click();
    await expect(page.getByText('EmptyFolder')).toBeVisible();
    // Delete the folder
    await page.getByRole('button', { name: /delete/i, exact: false }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Delete/i }).last().click();
    await page.waitForTimeout(500);
    await expect(page.getByText('EmptyFolder')).not.toBeVisible();
  });
}); 