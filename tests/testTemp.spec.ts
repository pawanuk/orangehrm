import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

interface FieldData {
    label: string;
    selector: string;
    value?: string;
    fieldType?: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'file' | 'number' | 'email';
}

// Function to generate random data for form fields
const generateRandomData = (fieldData: FieldData): string | number | Date => {
    if (!fieldData.fieldType) return faker.lorem.word(); // Default random word
    switch (fieldData.fieldType) {
        case 'text':
        case 'textarea':
        case 'date':
            return faker.lorem.word(); // Can be customized for specific data types
        case 'email':
            return faker.internet.email();
        case 'file':
            // Handle file upload logic here (consider using a fixture to provide test files)
            return 'path/to/your/file.txt';
        case 'number':
            return faker.datatype.number({ min: 1, max: 100 }); // Example number generation
        default:
            return faker.lorem.word();
    }
};

// Function to determine appropriate field selector based on field type
const getSelector = (label: string, fieldType: string): string => {
    const baseSelector = `//label[text()='${label}']/following-sibling::`;
    switch (fieldType) {
        case 'checkbox':
        case 'radio':
            return baseSelector + 'input';
        case 'date':
            // Handle date picker element identification here (consider using Playwright date pickers)
            return '<selector for date picker element>';
        case 'text':
            return baseSelector + 'input';
        default:
            return baseSelector + fieldType;
    }
};

// Function to extract form fields and their selectors
const extractFormFields = async (page: Page): Promise<FieldData[]> => {
    const fields: FieldData[] = [];
    const labels = await page.locator('label').all();

    for (const label of labels) {
        const labelText = (await label.textContent())?.trim();
        if (labelText) {
            const commonDiv = await label.evaluateHandle((el) => el.closest('div'));
            const input = await commonDiv?.asElement()?.$('input, textarea, select');
            if (input) {
                const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
                const typeAttr = await input.getAttribute("type");
                const fieldType = tagName === 'select' ? 'dropdown' : typeAttr;
                if (fieldType) {
                    fields.push({
                        label: labelText,
                        selector: getSelector(labelText, fieldType),
                        fieldType: fieldType as FieldData['fieldType'],
                    });
                }
            }
        }
    }

    return fields;
};

// Function to fill the form
const fillForm = async (page: Page, fields: FieldData[], expectedFormData?: Record<string, string>) => {
    for (const field of fields) {
        const value = expectedFormData ? expectedFormData[field.label] : generateRandomData(field);
        const element = await page.$(field.selector);
        if (element) {
            console.log(`Filling field "${field.label}" with value "${value}"`);
            switch (field.fieldType) {
                case 'text':
                    await element.fill(value as string);
                    break;
                case 'textarea':
                    await element.fill(value as string);
                    break;
                case 'dropdown':
                    await element.selectOption({ label: value as string });
                    break;
                case 'checkbox':
                case 'radio':
                    if (value) await element.check();
                    else await element.uncheck();
                    break;
                case 'date':
                    // Handle date selection logic here (consider using Playwright date pickers)
                    break;
                case 'file':
                    await element.setInputFiles(field.value || (value as string));
                    break;
                case 'number':
                    await element.fill(value.toString()); // Convert number to string for filling
                    break;
            }
        } else {
            console.warn(`Field "${field.label}" not found using selector "${field.selector}".`);
        }
    }
};

// Function to capture form data from the DOM for verification
const captureFormData = async (page: Page, fields: FieldData[]): Promise<Record<string, string>> => {
    const formData: Record<string, string> = {};
    for (const field of fields) {
        const element = await page.$(field.selector);
        if (element) {
            let fieldValue: string | null = null;
            switch (field.fieldType) {
                case 'text':
                case 'textarea':
                case 'number':
                    fieldValue = await element.inputValue();
                    break;
                case 'dropdown':
                    fieldValue = await element.evaluate(el => (el as HTMLSelectElement).selectedOptions[0]?.textContent || '');
                    break;
                case 'checkbox':
                case 'radio':
                    fieldValue = (await element.isChecked()) ? 'checked' : 'unchecked';
                    break;
                case 'date':
                    // Handle date value retrieval logic here (consider using Playwright date pickers)
                    break;
                case 'file':
                    // File upload verification might require additional checks
                    fieldValue = 'File uploaded'; // Placeholder for file upload verification
                    break;
            }
            if (fieldValue !== null) {
                formData[field.label] = fieldValue;
            }
        } else {
            console.warn(`Field "${field.label}" not found using selector "${field.selector}".`);
            // Consider throwing an error or handling missing fields differently
        }
    }

    return formData;
};

// Function to verify captured form data against expected values
const verifyFormData = (formData: Record<string, string>, expectedData: Record<string, string>) => {
    for (const [label, expectedValue] of Object.entries(expectedData)) {
        const actualValue = formData[label];
        expect(actualValue).toEqual(expectedValue);
    }
};

test('Fill and verify form using random data', async ({ page }) => {
    // ... your existing test logic to navigate to the form page

    await page.goto('file:///D:/pawan/orangehrm/utils/example.html');

    // Extract form fields and their selectors
    const fields = await extractFormFields(page);
    console.log('Extracted form fields:', fields);

    // Check if no fields were extracted
    if (fields.length === 0) {
        console.error('No form fields were extracted. Please check the selectors and page structure.');
        return;
    }

    // Generate expected data for verification (replace with your specific data)
    const expectedFormData: Record<string, string> = {};
    for (const field of fields) {
        expectedFormData[field.label] = generateRandomData(field) as string;
    }

    // Fill the form with generated data
    await fillForm(page, fields, expectedFormData);

    // Add a slight delay to ensure the form submission is complete
    await page.waitForTimeout(5000);

    // Capture form data from the DOM for verification
    const capturedFormData = await captureFormData(page, fields);
    console.log('Captured form data:', capturedFormData);

    // Verify captured form data against expected values
    verifyFormData(capturedFormData, expectedFormData);

    console.log('Form data verification successful!');
});