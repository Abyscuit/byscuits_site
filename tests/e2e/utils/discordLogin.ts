import { expect, type Page } from '@playwright/test';

export async function discordLogin(page: Page) {
  await page.goto('http://localhost:3000/cloud-dashboard');
  
  await page.waitForTimeout(1000);
  if (await page.getByRole('button', { name: /login with discord/i }).isVisible()) {
    await page.getByRole('button', { name: /login with discord/i }).click();
    await page.waitForTimeout(3000);
    await page.fill('input[name="email"]', process.env.NEXT_PUBLIC_DISCORD_TEST_EMAIL!);
    await page.fill('input[name="password"]', process.env.NEXT_PUBLIC_DISCORD_TEST_PASSWORD!);
    await page.click('button[type="submit"]');
  }
  // Scroll the permissions container until the Authorize button is enabled
  const permissionsSelector = '[class*="scroller"]';
  await page.waitForSelector(permissionsSelector);
  let authorizeClicked = false;
  for (let i = 0; i < 10; i++) {
    await page.evaluate((selector: string) => {
      const el = document.querySelector(selector);
      if (el) el.scrollTop = el.scrollHeight;
    }, permissionsSelector);
    await page.waitForTimeout(500);
    const authorizeButton = await page.$('button:has-text("Authorize")');
    if (authorizeButton && await authorizeButton.isEnabled()) {
      await authorizeButton.click();
      authorizeClicked = true;
      break;
    }
  }
  if (!authorizeClicked) {
    throw new Error('Authorize button was not enabled after scrolling');
  }
  await expect(page).toHaveURL(/cloud-dashboard/);
} 