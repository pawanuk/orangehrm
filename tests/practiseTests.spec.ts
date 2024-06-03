import { test, expect } from '@playwright/test';

test.describe('Amazon Link Search', () => {
  test('should find links containing "Amazon"', async ({ page }) => {
    // Navigate to Amazon website
    await page.goto('https://www.amazon.com');

    // Find all anchor elements with text containing "Amazon"
    const amazonLinks = await page.$$('a:has-text("Amazon")');

    // Check if any links were found
    expect(amazonLinks.length).toBeGreaterThan(0); // Use expect for assertions

    console.log('Found Amazon links and its length is:',amazonLinks.length);
    console.log(amazonLinks.length);
    // Loop through each link and print its href attribute
    for (const link of amazonLinks) {
      const href = await link.getAttribute('href');
      console.log(href);
    }
  });
});
