import { test, expect, chromium, Page } from '@playwright/test';

// Helper function to extract JSON data from a script tag
async function extractJsonData(page: Page): Promise<any> {
    try {
        const script = await page.$('script[');
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
function getValidUrl(url: string | null): string | null {
    const trimmedUrl = url?.trim();
    if (trimmedUrl) {
        return trimmedUrl; // Only return valid URLs
    }
    // Define the regex pattern to match a digit in the string
    const regex = /\d/;
    // Execute the regex on the input string
    const match = url?.match(regex);
    // Return the matched digit if found, otherwise return null
    return match ? match[0] : null;
}

test('web scraping with error handling and null value checks', async () => {
    const startUrl = "https://www.saucedemo.com/";
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();

    try {
        const page = await context.newPage();
        await page.goto(startUrl);
        await page.locator("#user-name").fill("standard_user");
        await page.locator("#password").fill("secret_sauce");
        await page.locator("#login-button").click();

        while (true) {
            const links = await page.$$eval(
                "a[id*='item']",
                (anchors) => anchors.map((anchor) => anchor.getAttribute('id'))
            );

            for (const url of links) {
                const validUrl = getValidUrl(url);
                if (validUrl) { // Process only valid URLs
                    const newPage = await context.newPage();
                    await page.goto(`https://www.saucedemo.com/inventory-item.html?id=${validUrl}`);

                    // Use the extractJsonData function here
                    const jsonData = await extractJsonData(page);
                    console.log(jsonData);

                    // ... rest of the processing ...
                    await page.locator("#back-to-products").click();
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
