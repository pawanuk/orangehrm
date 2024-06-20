



import test, { chromium, expect, Page } from "playwright/test";


test("Webscrapping of sauce demo", async () => {
    const url = "https://www.saucedemo.com/"
    const browser = await chromium.launch();
    const ctxt = await browser.newContext();
    const page = await ctxt.newPage();

    // 1. navigate to sauce demo and login with creds 
    await page.goto(url);
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click("#login-button");

    await clickAddToCart(page, ...["Bolt", "15.99"])
    await clickAddToCart(page, ...["Fleece", "49.99"])

    // const budget = 8
    // let displayedPrices = []
    // const prices = await page.$$eval('[data-test="inventory-item-price"]', (elements) => elements.map((element) => element.textContent))
    // console.log(prices);

    // for (let price of prices) {
    //     const d = /\d+/
    //     const digit = price?.match(d);
    //     const n = digit ? Number(digit[0]) : 0
    //     digit ? displayedPrices.push(n < budget ? digit[0] : 0) : undefined
    // }

    // console.log(displayedPrices);
    // for(let p of displayedPrices)

    await page.waitForTimeout(5000);


    // 2. construct and navigate to url for each individual product page
    // const elementIds = await page.$$eval("a[id*='title']", (anchores) => anchores.map((anchor) => anchor.getAttribute("id"))) // ["item_4_title_link", ""]

    // for (let eleId of elementIds) {
    //     const productId = getDigital(eleId);
    //     const productUrl = `https://www.saucedemo.com/inventory-item.html?id=${productId}`
    //     await page.goto(productUrl);

    //     // 3. extract the product details i.e. title, description and price
    //     const productDetails = await extractProductDetails(page);
    //     console.log(productDetails);

    // }
})



async function clickAddToCart(page: Page, ...inputs: string[]): Promise<void> {
    let xpath = `(//*[contains(text(), 'INPUT1')]/following::div[text()[contains(., 'INPUT2')]]/following::button)[1]`
    let count = 1
    for(let input of inputs){ // productTitle, 
        let temp = "INPUT"+count
        xpath = xpath.replace(temp, input)
        count++;
    }
	const btnAddToCart = await page.locator(xpath);
	await btnAddToCart.click();
}


function getDigital(eleId: string | null): string | null {
    const trimmedId = eleId?.trim();
    const regex = /\d+/
    const match = trimmedId?.match(regex);
    return match ? match[0] : null
}

async function extractProductDetails(page: Page) {
    const title = await page.textContent('.inventory_details_name');
    const desc = await page.textContent('.inventory_details_desc');
    const price = await page.textContent('.inventory_details_price');

    return {
        title: title?.trim(),
        description: desc?.trim(),
        price: price?.trim()
    }
}