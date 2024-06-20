import { test, chromium } from '@playwright/test';
import * as pw from 'playwright';

// Search for a Product:
// Apply Filters:
// Extract Product Details:
// Output the Extracted Data:

// arrang, act, assert
test('Amazon webscrapping', async ({ }) => {
    const browser = await chromium.launch({ headless: false }); // Set headless: true for headless mode
    const context = await browser.newContext();
    const page = await context.newPage();

    // Step 2: Navigate to Amazon
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

    await pw.selectors.register('mySelector', () => ({
        queryAll(root: Node, placeholderValue: string) {
            return Array.from(
                root.querySelectorAll(`[placeholder="${placeholderValue}"]`)
            );
        },
    }));


    await page.locator('mySelector=Username').fill('Admin');
    await page.locator('mySelector=Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();

   
    // await page.locator(`mySelector=Search Amazon`).fill('laptop');
    // await page.locator(`mySelector=Email`).fill('laptop');

    // // await page.getByPlaceholder("Search Amazon").fill('laptop')
    // await page.keyboard.press("Enter");

    // // Apply Filters:
    // await page.getByRole('link', { name: 'HP', exact: true }).click();
    // await page.getByRole('link', { name: '4 Stars & Up' }).click();
    await page.waitForTimeout(5000)

    // Extract Product Details:
    // const productDetails = await page.evaluate(() => {
    //     const products: any[] = [];
    //     const productElements = document.querySelectorAll('div.s-main-slot div.s-result-item');

    //     productElements.forEach(product => {
    //         const title = product.querySelector('span.a-text-normal')?.innerText;
    //         const priceWhole = product.querySelector('span.a-price-whole')?.innerText;
    //         const priceFraction = product.querySelector('span.a-price-fraction')?.innerText;
    //         const price = priceWhole ? `$${priceWhole}${priceFraction}` : 'N/A';
    //         const rating = product.querySelector('span.a-icon-alt')?.innerText;
    //         const link = product.querySelector('a.a-link-normal')?.href;

    //         if (title && price && rating && link) {
    //             products.push({
    //                 title,
    //                 price,
    //                 rating,
    //                 link
    //             });
    //         }
    //     });

    //     return products.slice(0, 5); // Get the first 5 products
    // });

    // // Output the Extracted Data:
    // console.log(products);

});

