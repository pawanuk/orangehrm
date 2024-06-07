import { test, expect, chromium, Page } from '@playwright/test';

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
test('web scraping with error handling and null value checks', async () => {
  const startUrl = "https://www.bhphotovideo.com/c/buy/rebates-promotions/ci/22144/N/4019732813/Lenses/ci/15492";
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    const page = await context.newPage();
    await page.goto(startUrl);

    while (true) {
      const links = await page.$$eval(
        "a[data-selenium='miniProductPageDetailsGridViewNameLink']",
        (anchors) => anchors.slice(0, 1).map((anchor) => anchor.getAttribute('href'))
      );
      for (const url of links) {
        const validUrl = getValidUrl(url);
        if (validUrl) { // Process only valid URLs
          const newPage = await context.newPage();
          await newPage.goto(`https://www.bhphotovideo.com${validUrl}`);
          // ... rest of the processing ...
          await newPage.close();
        }
      }
      const pageNumbers = await page.$$eval(
        'span.paginationText',
        (spans) => spans.map((span) => {
          const text = span.textContent;
          return text ? text.split('-')[1]?.split(' ') : undefined;
        })
      );

      if (pageNumbers.length > 0 && pageNumbers[0] && pageNumbers[0][0] !== undefined && pageNumbers[0][2] !== undefined) {
        const currentPage = parseInt(pageNumbers[0][0]);
        const lastPage = parseInt(pageNumbers[0][2]);

        if (currentPage === lastPage) {
          console.log('No more pages');
          break;
        } else {
          await page.click("a[data-selenium='listingPagingPageNext']");
        }
      } else {
        console.log('Error parsing page numbers or no pagination available');
        break;
      }

    }
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
});
