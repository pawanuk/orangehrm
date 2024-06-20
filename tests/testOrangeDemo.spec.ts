import { test, expect, Page, ElementHandle } from '@playwright/test';
import { faker } from '@faker-js/faker';

interface FieldSelectors {
    [label: string]: string;
}

var password: string = "";

// Function to generate random data for form fields
const generateRandomData = (label: string): string => {
    const lowerCaseLabel = label.toLowerCase();
    if (lowerCaseLabel.includes('email')) return faker.internet.email();
    if (lowerCaseLabel.includes('work') || lowerCaseLabel.includes('mobile') || lowerCaseLabel.includes('home')) return faker.phone.number("+48 91 ### ## ##");
    if (lowerCaseLabel.includes('zip') || lowerCaseLabel.includes('postal')) return faker.location.zipCode();
    if (lowerCaseLabel.includes('street')) return faker.location.streetAddress();
    if (lowerCaseLabel.includes('city')) return faker.location.city();
    if (lowerCaseLabel.includes('state')) return faker.location.state();
    if (lowerCaseLabel.includes('country')) return 'Afghanistan'; // For the dropdown
    return faker.lorem.word(); // Default random word
};

// Function to extract form fields 
const extractFormFields = async (page: Page): Promise<FieldSelectors> => {
    return await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const selectors: FieldSelectors = {};

        elements.forEach((element) => {
            if (element.tagName.toLowerCase() === 'label') {
                const labelText = element.textContent?.trim();
                if (labelText) {
                    const commonDiv = element.closest('.oxd-input-group');
                    if (commonDiv) {
                        const inputs = Array.from(commonDiv.querySelectorAll('input, textarea, select, div[class*="select"]'));
                        inputs.forEach((input, index) => {
                            const siblings = Array.from(commonDiv.querySelectorAll(input.tagName.toLowerCase()));
                            const inputPosition = siblings.indexOf(input) + 1;
                            const selector = `//label[text()='${labelText}']/following::${input.tagName.toLowerCase()}[${inputPosition}]`;
                            const subfieldKey = `${labelText}[${index + 1}]`;
                            selectors[subfieldKey] = selector;
                        });
                    }
                }
            }
        });

        return selectors;
    });
};

// Recursive function to select a valid option
const selectValidOption = async (element: ElementHandle, options: string[]): Promise<string> => {
    if (options.length === 0) {
        throw new Error('No options available');
    }

    const randomIndex = Math.floor(Math.random() * options.length);
    const randomOption = options[randomIndex];

    if (randomOption && randomOption.trim() !== "") {
        console.log(`Selecting valid option: ${randomOption}`);
        await element.selectOption({ label: randomOption });
        return randomOption;
    } else {
        console.log('Selected option is null or empty, retrying...');
        return selectValidOption(element, options);
    }
};

// Function to fill the form
const fillForm = async (page: Page, fields: { [label: string]: string }) => {
    for (const [label, selector] of Object.entries(fields)) {
        const value = generateRandomData(label);
        console.log(`Filling field "${label}" with value "${value}" using selector "${selector}"`);
        const element = await page.$(selector);
        const className = await element?.getAttribute('class') as string
        if (element) {
            const tagName = await element.evaluate(el => el.tagName);
            const tagType = await element.getAttribute("type");

            if (tagName === 'SELECT') {
                const options = await element.$$eval('option', (options) => options.map(option => option.textContent as string));
                try {
                    await selectValidOption(element, options);
                } catch (error) {
                    console.log(`No valid options found for selector: ${selector}`);
                }
            } else if (tagName === "DIV" && className.includes("oxd-select-text-input")) {
                // Handling the custom dropdown for Country
                await element.click(); // Click to open the dropdown
                await page.waitForSelector('.oxd-select-dropdown'); // Wait for the dropdown to appear
                const options = await page.$$('.oxd-select-dropdown .oxd-select-option'); // Get all options
                const randomOption = options[Math.floor(Math.random() * options.length)];
                await randomOption.click(); // Click on a random option
            } else if (tagName === "INPUT" && (tagType === "text" || tagType === "password" || tagType === "email")) {
                if (tagType === "password") {
                    if (password !== "") {
                        await element.fill(password);
                    } else {
                        await element.fill(value);
                        password = value;
                    }
                }
                await element.fill(value);
            } else if (tagName === "INPUT" && tagType === "radio") {
                await element.click();
            } else if (tagName === "INPUT" && tagType === "checkbox") {
                await element.check();
            } else if (tagName === "TEXTAREA") {
                await element.fill(value);
            } else if (tagName === "INPUT") {
                await element.fill(value);
            }
        }
    }
};

// Function to capture form data from the DOM for verification
const captureFormData = async (page: Page, fields: { [label: string]: string }): Promise<{ [label: string]: string }> => {
    const formData: { [label: string]: string } = {};
    for (const [label, selector] of Object.entries(fields)) {
        const element = await page.$(selector);
        if (element) {
            formData[label] = await element.inputValue();
        }
    }
    return formData;
};

test('Fill and verify form using random data', async ({ page }) => {
    // Navigate to the login page
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Navigate to the form page
    await page.getByRole('link', { name: 'My Info' }).click();
    await page.getByRole('link', { name: 'Contact Details' }).click();
    await page.waitForTimeout(5000);

    // Execute the script in the page context
    await page.evaluate(() => {
        // Step 1: Select all elements in the DOM
        const allElements = document.querySelectorAll("*");

        // Step 2: Convert NodeList to Array
        const elementsArray = Array.from(allElements);

        // Step 3: Extract outer HTML of each element
        const elementsHTML = elementsArray.map(element => element.outerHTML);

        // Step 4: Join all HTML strings into one, separated by new lines
        const htmlString = elementsHTML.join("\n\n");

        // Step 5: Copy the string to the clipboard
        navigator.clipboard.writeText(htmlString).then(() => {
            console.log('All elements copied to clipboard successfully!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    });


    // Extract form fields and their selectors
    const fields = await extractFormFields(page);
    console.log('Extracted form fields:', fields);

    // Check if no fields were extracted
    if (Object.keys(fields).length === 0) {
        console.error('No form fields were extracted. Please check the selectors and page structure.');
        return;
    }

    await page.waitForTimeout(2000);

    // Fill the form with generated data
    await fillForm(page, fields);

    // Add a slight delay to ensure the form submission is complete
    await page.waitForTimeout(5000);

    // Capture form data from the DOM for verification
    const loggedFormData = await captureFormData(page, fields);
    console.log('Captured form data:', loggedFormData);

    // Verify form data
    for (const [label, selector] of Object.entries(fields)) {
        const expectedValue = await page.$eval(selector, el => (el as HTMLInputElement).value);
        expect.soft(loggedFormData[label]).toEqual(expectedValue);
        if (loggedFormData[label] !== expectedValue) {
            console.error(`Field ${label} does not match. Expected: ${expectedValue}, Found: ${loggedFormData[label]}`);
            throw new Error(`Field ${label} does not match. Expected: ${expectedValue}, Found: ${loggedFormData[label]}`);
        }
    }

    console.log('Form data verification successful!');
});