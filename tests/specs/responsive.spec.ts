import { test, expect } from '@playwright/test';

const targetRoutes = [
  '/dashboard',
  '/inventory/products',
  '/sales',
  '/purchases',
  '/crm/customers',
  '/crm/suppliers',
  '/invoices',
  '/work-orders',
  '/workers',
  '/inventory/low-stock',
  '/inventory/out-of-stock',
  '/inventory/movements',
];

const viewports = [
  { name: 'Small Mobile (320x568)', width: 320, height: 568 },
  { name: 'Standard Mobile (375x812)', width: 375, height: 812 },
  { name: 'Large Mobile (430x932)', width: 430, height: 932 },
  { name: 'Tablet (768x1024)', width: 768, height: 1024 },
  { name: 'Desktop (1280x720)', width: 1280, height: 720 },
  { name: 'Large Desktop (1440x900)', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test.describe(`UI Responsiveness — ${viewport.name}`, () => {
    for (const route of targetRoutes) {
      test(`page ${route} has zero page-level horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        
        // Assert body element scrollWidth does not exceed viewport width
        const bodyWidth = await page.locator('body').evaluate((el: HTMLElement) => el.scrollWidth);
        const windowWidth = await page.evaluate(() => window.innerWidth);
        
        expect(bodyWidth).toBeLessThanOrEqual(windowWidth);
      });
    }
  });
}
