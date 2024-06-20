import { test, expect, chromium, Page } from '@playwright/test';

// Helper function to extract JSON data from a script tag
async function extractJsonData(page: Page): Promise<any> {
  try {
    const script = await page.$('script[type="application/ld+json"]');
    if (script) {
      const data = await script.textContent();
      return JSON.parse(data as string);
    }
  } catch (error) {
    console.error('Error extracting JSON data:', error);
  }
  return {};
}

// Helper function to handle potential null URLs gracefully
function getValidUrl(url: string | null): string | undefined {
  const trimmedUrl = url?.trim();
  if (trimmedUrl) {
    return trimmedUrl; // Only return valid URLs
  }
  return undefined;
}

test('web scraping with error handling and null value checks on saucedemo', async () => {
  const startUrl = "https://www.saucedemo.com/";
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    const page = await context.newPage();
    await page.goto(startUrl);

    // Perform login
    await page.fill('input[data-test="username"]', 'standard_user');
    await page.fill('input[data-test="password"]', 'secret_sauce');
    await page.click('input[data-test="login-button"]');

    // Wait for the inventory page to load
    await page.waitForSelector('.inventory_item');

    // Scrape product links
    const links = await page.$$eval('.inventory_item a[id^="item_"]', (anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href'))
    );

    for (const url of links) {
      const validUrl = getValidUrl(url);
      if (validUrl) {
        await page.goto(`https://www.saucedemo.com${validUrl}`);

        // Use the extractJsonData function here
        const jsonData = await extractJsonData(page);
        console.log(jsonData);

        // ... rest of the processing ...
        await page.locator("#back-to-products").click();
      }
    }

  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
});