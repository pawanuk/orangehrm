import { test, expect, chromium, Page } from '@playwright/test';

// Helper function to extract product details from the page
async function extractProductDetails(page: Page): Promise<any> {
    try {
        const title = await page.textContent('.inventory_details_name');
        const description = await page.textContent('.inventory_details_desc');
        const price = await page.textContent('.inventory_details_price');

        return {
            title: title?.trim(),
            description: description?.trim(),
            price: price?.trim(),
        };
    } catch (error) {
        console.error('Error extracting product details:', error);
    }
    return {};
}

// Helper function to handle potential null URLs gracefully
function getValidUrl(url: string | null): string | null {
    const trimmedUrl = url?.trim();
    // Define the regex pattern to match a digit in the string
    const regex = /\d+/;
    // Execute the regex on the input string
    const match = trimmedUrl?.match(regex);
    // Return the matched digit if found, otherwise return null
    return match ? match[0] : null;
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
        const links = await page.$$eval('.inventory_item a[id*="title_link"]', (anchors) =>
            anchors.map((anchor) => anchor.getAttribute('id'))
        );

        for (const url of links) {
            const validUrl = getValidUrl(url);
            if (validUrl) {
                await page.goto(`https://www.saucedemo.com/inventory-item.html?id=${validUrl}`);

                // Use the extractProductDetails function here
                const productDetails = await extractProductDetails(page);
                console.log(productDetails);

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