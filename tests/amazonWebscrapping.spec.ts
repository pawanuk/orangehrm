// const { chromium } = require('playwright');

// (async () => {
//   const browser = await chromium.launch({ headless: false }); // Set headless: true for headless mode
//   const context = await browser.newContext();
//   const page = await context.newPage();

//   // Step 2: Navigate to Amazon
//   await page.goto('https://www.amazon.com');

//   // Step 3: Search for a product
//   await page.fill('input#twotabsearchtextbox', 'laptop');
//   await page.click('input#nav-search-submit-button');

//   // Step 4: Apply Filters
//   // Filter by Brand (e.g., "HP")
//   await page.waitForSelector('span.a-list-item');
//   await page.click('span.a-list-item:has-text("HP")');
//   await page.waitForNavigation();

//   // Filter by Customer Rating (e.g., "4 Stars & Up")
//   await page.waitForSelector('span.a-list-item');
//   await page.click('span.a-list-item:has-text("4 Stars & Up")');
//   await page.waitForNavigation();

//   // Step 5: Extract Product Details
//   const productDetails = await page.evaluate(() => {
//     const products = [];
//     const productElements = document.querySelectorAll('div.s-main-slot div.s-result-item');

//     productElements.forEach(product => {
//       const title = product.querySelector('span.a-text-normal')?.innerText;
//       const priceWhole = product.querySelector('span.a-price-whole')?.innerText;
//       const priceFraction = product.querySelector('span.a-price-fraction')?.innerText;
//       const price = priceWhole ? `$${priceWhole}${priceFraction}` : 'N/A';
//       const rating = product.querySelector('span.a-icon-alt')?.innerText;
//       const link = product.querySelector('a.a-link-normal')?.href;

//       if (title && price && rating && link) {
//         products.push({
//           title,
//           price,
//           rating,
//           link
//         });
//       }
//     });

//     return products.slice(0, 5); // Get the first 5 products
//   });

//   // Step 6: Output the Extracted Data
//   console.log('Extracted Product Details:', productDetails);

//   await browser.close();
// })();