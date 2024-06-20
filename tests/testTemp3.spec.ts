import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

interface FieldData {
    label: string;
    selector: string;
    fieldType: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'file' | 'number' | 'email' | 'password';
}

// Function to get dropdown options from the page
const getDropdownOptions = async (page: Page, selector: string): Promise<string[]> => {
    const options = await page.$$eval(`${selector} option`, (options: HTMLOptionElement[]) => options.map(option => option.textContent?.trim() || ''));
    return options.filter(option => option !== '');
};

// Function to generate random data for form fields
const generateRandomData = async (page: Page, fieldData: FieldData): Promise<string | number | Date | boolean> => {
    switch (fieldData.fieldType) {
        case 'text':
        case 'textarea':
            return faker.lorem.sentence();
        case 'email':
            return faker.internet.email();
        case 'password':
            return faker.internet.password();
        case 'file':
            // Handle file upload logic here (consider using a fixture to provide test files)
            return 'path/to/your/file.txt';
        case 'number':
            return faker.datatype.number({ min: 1, max: 100 });
        case 'checkbox':
        case 'radio':
            return faker.datatype.boolean();
        case 'date':
            return faker.date.future().toISOString().split('T')[0];
        case 'dropdown':
            const options = await getDropdownOptions(page, fieldData.selector);
            return options[Math.floor(Math.random() * options.length)];
        default:
            return faker.lorem.word();
    }
};

// Function to extract form fields and their selectors dynamically
const extractFormFields = async (page: Page): Promise<FieldData[]> => {
    const fields: FieldData[] = [];
    const formElements = await page.$$('form input, form textarea, form select');

    for (const element of formElements) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const typeAttr = await element.evaluate(el => el.getAttribute('type') || el.tagName.toLowerCase());
        const fieldType = tagName === 'select' ? 'dropdown' : typeAttr as FieldData['fieldType'];

        const closestLabel = await element.evaluateHandle(el => el.closest('label') || (el.previousElementSibling?.tagName === 'LABEL' ? el.previousElementSibling : null));
        const labelText = closestLabel ? await closestLabel.evaluate(el => el?.textContent?.trim() || '') : '';

        const uniqueSelector = await element.evaluate(el => {
            const id = el.getAttribute('id');
            if (id) return `${el.tagName.toLowerCase()}#${id}`;
            
            const name = el.getAttribute('name');
            if (name) return `${el.tagName.toLowerCase()}[name="${name}"]`;

            const classes = el.className.split(' ').filter(cls => cls).join('.');
            if (classes) return `${el.tagName.toLowerCase()}.${classes}`;

            return null;
        });

        if (labelText && uniqueSelector) {
            fields.push({
                label: labelText,
                selector: uniqueSelector,
                fieldType: fieldType as FieldData['fieldType'],
            });
        }
    }

    return fields;
};

// Function to fill the form dynamically
const fillForm = async (page: Page, fields: FieldData[], expectedFormData?: Record<string, string>) => {
    for (const field of fields) {
        const value = expectedFormData ? expectedFormData[field.label] : await generateRandomData(page, field);
        const element = await page.$(field.selector);
        if (element) {
            console.log(`Filling field "${field.label}" with value "${value}"`);
            switch (field.fieldType) {
                case 'text':
                case 'textarea':
                case 'password':
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
                    await element.fill(value as string);
                    break;
                case 'file':
                    await element.setInputFiles(field.value || (value as string));
                    break;
                case 'number':
                case 'email':
                    await element.fill(value as string);
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
                case 'email':
                case 'password':
                    fieldValue = await element.inputValue();
                    break;
                case 'dropdown':
                    fieldValue = await element.evaluate((el: HTMLSelectElement) => el.selectedOptions[0]?.textContent || '');
                    break;
                case 'checkbox':
                case 'radio':
                    fieldValue = (await element.isChecked()) ? 'checked' : 'unchecked';
                    break;
                case 'date':
                    fieldValue = await element.inputValue();
                    break;
                case 'file':
                    fieldValue = 'File uploaded'; // Placeholder for file upload verification
                    break;
            }
            if (fieldValue !== null) {
                formData[field.label] = fieldValue;
            }
        } else {
            console.warn(`Field "${field.label}" not found using selector "${field.selector}".`);
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
    // Navigate to the form page
    await page.goto('file:///D:/pawan/orangehrm/utils/example.html');

    // Extract form fields and their selectors
    const fields = await extractFormFields(page);
    console.log('Extracted form fields:', fields);

    // Check if no fields were extracted
    if (fields.length === 0) {
        console.error('No form fields were extracted. Please check the selectors and page structure.');
        return;
    }

    // Generate expected data for verification
    const expectedFormData: Record<string, string> = {};
    for (const field of fields) {
        expectedFormData[field.label] = await generateRandomData(page, field) as string;
    }

    // Fill the form with generated data
    await fillForm(page, fields, expectedFormData);

    // Submit the form (modify based on your form submission mechanism)
    await page.locator('button[type="submit"]').click();

    // Add a slight delay to ensure the form submission is complete
    await page.waitForTimeout(5000);

    // Capture form data from the DOM for verification
    const capturedFormData = await captureFormData(page, fields);
    console.log('Captured form data:', capturedFormData);

    // Verify captured form data against expected values
    verifyFormData(capturedFormData, expectedFormData);

    console.log('Form data verification successful!');
});
