import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

interface FieldSelectors {
    [label: string]: string;
}

// Function to generate random data for form fields
const generateRandomData = (label: string): string => {
    if (label.toLowerCase().includes('email')) return faker.internet.email();
    if (label.toLowerCase().includes('work') || label.toLowerCase().includes('mobile') || label.toLowerCase().includes('home')) return faker.phone.number("+48 91 ### ## ##");
    if (label.toLowerCase().includes('zip') || label.toLowerCase().includes('postal')) return faker.location.zipCode();
    if (label.toLowerCase().includes('street')) return faker.location.streetAddress();
    if (label.toLowerCase().includes('city')) return faker.location.city();
    if (label.toLowerCase().includes('state')) return faker.location.state();
    if (label.toLowerCase().includes('country')) return 'Afghanistan'; // For the dropdown
    return faker.lorem.word(); // Default random word
};

// Function to extract form fields (generates absolute xpaths)
// const extractFormFields = async (page: Page): Promise<FieldSelectors> => {
//     return await page.evaluate(() => {
//         const labels = Array.from(document.querySelectorAll('label.oxd-label'));
//         const selectors: FieldSelectors = {};

//         labels.forEach((label) => {
//             const labelText = label.textContent?.trim();
//             if (labelText) {
//                 const commonDiv = label.closest('.oxd-input-group');
//                 if (commonDiv) {
//                     const input = commonDiv.querySelector('input, textarea, select');
//                     if (input) {
//                         // Construct the XPath dynamically
//                         let currentElement: HTMLElement | null = input as HTMLElement;
//                         let xpathSegments: string[] = [];

//                         while (currentElement && currentElement !== document.body) {
//                             const tagName = currentElement.tagName.toLowerCase();
//                             const siblings = Array.from(currentElement.parentElement!.children)
//                                 .filter((sibling) => sibling.tagName.toLowerCase() === tagName);
//                             const index = siblings.indexOf(currentElement) + 1;
//                             xpathSegments.unshift(`${tagName}[${index}]`);
//                             currentElement = currentElement.parentElement;
//                         }

//                         const inputXPath = '//' + xpathSegments.join('/');
//                         selectors[labelText] = inputXPath;
//                     }
//                 }
//             }
//         });

//         return selectors;
//     });
// };
// // Generates relative xpaths
const extractFormFields = async (page: Page): Promise<FieldSelectors> => {
    return await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label')); // 
        const selectors: FieldSelectors = {}; // key: Value | 'City': 'xpath'

        labels.forEach((label) => {
            const labelText = label.textContent?.trim(); // Street 1
            if (labelText) {
                const commonDiv = label.closest('div');
                if (commonDiv) {
                    const input = commonDiv.querySelector('input, textarea, select');
                    if (input) {
                        // Construct the relative XPath for the input
                        const siblings = Array.from(commonDiv.querySelectorAll(input.tagName.toLowerCase()));
                        const inputPosition = siblings.indexOf(input) + 1;
                        selectors[labelText] = `//label[text()='${labelText}']/following::${input.tagName.toLowerCase()}[${inputPosition}]`;
                    }
                }
            }
        });

        return selectors;
    });
};

// Function to fill the form
const fillForm = async (page: Page, fields: { [label: string]: string }) => {
    for (const [label, selector] of Object.entries(fields)) {
        const value = generateRandomData(label);
        console.log(`Filling field "${label}" with value "${value}" using selector "${selector}"`);
        const element = await page.$(selector);
        if (element) {
            const tagName = await element.evaluate(el => el.tagName);
            const tagType = await element.getAttribute("type")

            if (tagName === 'SELECT') {
                const options = await element.$$eval('option', (options) => options.map(option => option.textContent)); // Get all options text content
                if (options.length > 0) {
                    const randomIndex = Math.floor(Math.random() * options.length); // Generate random index
                    const randomOption = options[randomIndex];
                    console.log(`Selecting random option: ${randomOption}`);
                    await element.selectOption({ value: randomOption as string }); // Select by text content
                } else {
                    console.log(`No options found for selector: ${selector}`);
                }
            } else if (tagName === "INPUT" && tagType === "text") {
                await element.fill(value);
            } else if (tagName === "INPUT" && tagType === "radio") {
                await element.click();
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
    await page.goto('file:///D:/pawan/orangehrm/utils/example.html');

    // Extract form fields and their selectors
    const fields = await extractFormFields(page);
    console.log('Extracted form fields:', fields);

    // Check if no fields were extracted
    if (Object.keys(fields).length === 0) {
        console.error('No form fields were extracted. Please check the selectors and page structure.');
        return;
    }

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
        expect.soft(loggedFormData[label]).toEqual(expectedValue)
        if (loggedFormData[label] !== expectedValue) {
            console.error(`Field ${label} does not match. Expected: ${expectedValue}, Found: ${loggedFormData[label]}`);
            throw new Error(`Field ${label} does not match. Expected: ${expectedValue}, Found: ${loggedFormData[label]}`);
        }
    }

    console.log('Form data verification successful!');
});