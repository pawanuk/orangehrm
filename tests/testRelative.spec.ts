import { test, expect, Page, ElementHandle } from '@playwright/test';
import { faker } from '@faker-js/faker';

interface FieldSelectors {
    [label: string]: string;
}

var password: string = "";

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

// Function to extract form fields 
const extractFormFields = async (page: Page): Promise<FieldSelectors> => {
  return await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const selectors: FieldSelectors = {};

    labels.forEach((label) => {
      const labelText = label.textContent?.trim();
      if (labelText) {
        const commonDiv = label.closest('div');
        if (commonDiv) {
          const inputs = Array.from(commonDiv.querySelectorAll('input, textarea, select'));
          inputs.forEach((input, index) => {
            // Construct the relative XPath for the specific input
            const siblings = Array.from(commonDiv.querySelectorAll(input.tagName.toLowerCase()));
            const inputPosition = siblings.indexOf(input) + 1;
            const selector = `//label[text()='${labelText}']/following::${input.tagName.toLowerCase()}[${inputPosition}]`;

            // Create unique keys for subfields with indexes
            const subfieldKey = `${labelText}[${index + 1}]`; // Starts from 1 for clarity
            selectors[subfieldKey] = selector;
          });
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
        return selectValidOption(element, options); // Recursively call until a valid option is found
    }
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
                const options = await element.$$eval('option', (options) => options.map(option => option.textContent as string)); // Get all options text content
                try {
                    await selectValidOption(element, options);
                } catch (error) {
                    console.log(`No valid options found for selector: ${selector}`);
                }
            } else if (tagName === "INPUT" && (tagType === "text" || tagType === "password" || tagType === "email")) {
                if (tagType === "password") {
                    if (password !== "") {
                        await element.fill(password);
                    } else {
                        await element.fill(value);
                        password = value
                    }
                }
                await element.fill(value);
            } else if (tagName === "INPUT" && tagType === "radio") {
                await element.click();
            } else if (tagName === "INPUT" && tagType === "checkbox") {
                await element.check();
            } else if (tagName === "TEXTAREA") {
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
    await page.goto('file:///D:/pawan/orangehrm/utils/example4.html');

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
        expect.soft(loggedFormData[label]).toEqual(expectedValue)
        if (loggedFormData[label] !== expectedValue) {
            console.error(`Field ${label} does not match. Expected: ${expectedValue}, Found: ${loggedFormData[label]}`);
            throw new Error(`Field ${label} does not match. Expected: ${expectedValue}, Found: ${loggedFormData[label]}`);
        }
    }

    console.log('Form data verification successful!');
});