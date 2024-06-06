import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.amazon.com/');
  await page.getByPlaceholder('Type characters').click();
  await page.getByPlaceholder('Type characters').press('CapsLock');
  await page.getByPlaceholder('Type characters').fill('RHBAKR');
  await page.getByRole('button', { name: 'Continue shopping' }).click();
  await page.getByRole('button', { name: 'Submit' }).first().click();
  await page.getByRole('link', { name: 'Sell', exact: true }).click();
  await page.getByRole('link', { name: 'Gift Cards' }).click();
  await page.getByRole('link', { name: 'Registry', exact: true }).click();
  await page.getByRole('link', { name: 'Customer Service' }).click();
  await page.getByRole('link', { name: 'Today\'s Deals' }).click();
  await page.getByRole('link', { name: 'Returns & Orders' }).click();
  
});