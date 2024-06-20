import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

interface FieldData {
    label: string;
    selector: string;
    value?: string;
    fieldType?: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'file' | 'number' | 'email' | 'password';
}

let password: string = ""

// Function to get dropdown options from the page
const getDropdownOptions = async (page: Page, selector: string): Promise<string[]> => {
    const options = await page.$$eval(`${selector}//option`, (options: HTMLOptionElement[]) => options.map(option => option.textContent?.trim() || ''));
    return options.filter(option => option !== '');
};

// Function to generate random data for form fields
const generateRandomData = async (page: Page, fieldData: FieldData): Promise<string | number | Date | boolean> => {
    if (!fieldData.fieldType) return faker.lorem.word(); // Default random word
    switch (fieldData.fieldType) {
        case 'text':
        case 'textarea':
            return faker.lorem.sentence();
        case 'email':
            return faker.internet.email();
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

// Function to determine appropriate field selector based on field type
const getSelector = (label: string, tagName: string, fieldType: string): string => {
    switch (fieldType) {
        case 'checkbox':
        case 'radio':
            return `//label[text()='${label}']/following::${tagName.toLowerCase()}[@type='${fieldType}'][1]`;
        case 'date':
            return `//label[text()='${label}']/following::${tagName.toLowerCase()}[@type='date'][1]`;
        case 'dropdown':
            return `//label[text()='${label}']/following::${tagName.toLowerCase()}[1]`;
        default:
            return `//label[text()='${label}']/following::${tagName.toLowerCase()}[1]`;
    }
};

// Function to extract form fields and their selectors, including nested fields
const extractFormFields = async (page: Page): Promise<FieldData[]> => {
    const fields: FieldData[] = [];
    const labels = await page.locator('label').all();

    for (const label of labels) {
        const labelText = (await label.textContent())?.trim();
        if (labelText) {
            const commonDivHandle = await label.evaluateHandle((el: Element) => el.closest('div'));
            const commonDivElement = commonDivHandle.asElement();
            if (commonDivElement) {
                const inputs = await commonDivElement.$$('input, textarea, select');
                for (const input of inputs) {
                    const tagName = (await input.evaluate((el: Element) => el.tagName)).toLowerCase();
                    const typeAttr = await input.getAttribute("type") || tagName;
                    const fieldType = tagName === 'select' ? 'dropdown' : typeAttr;
                    if (fieldType) {
                        fields.push({
                            label: labelText,
                            selector: getSelector(labelText, tagName, fieldType),
                            fieldType: fieldType as FieldData['fieldType'],
                        });
                    }
                }
            }
        }
    }

    return fields;
};

// Function to handle subfields if any (recursive)
const handleSubFields = async (page: Page, element: any, fieldData: FieldData): Promise<void> => {
    const subElements = await element.$$('*');
    for (const subElement of subElements) {
        await analyzeAndInteract(page, subElement, fieldData);
    }
};

// Function to analyze and interact with elements
const analyzeAndInteract = async (page: Page, element: any, fieldData: FieldData): Promise<void> => {
    const tagName = await element.evaluate((el: HTMLElement) => el.tagName.toLowerCase());

    if (['input', 'textarea', 'select'].includes(tagName)) {
        const type = await element.getAttribute('type') || 'text';
        const data = generateRandomData(page, fieldData);
        await element.fill(data);
    } else {
        await handleSubFields(page, element, fieldData);
    }
};

// Function to fill the form
const fillForm = async (page: Page, fields: FieldData[], expectedFormData?: Record<string, string>) => {
    for (const field of fields) {
        const value = expectedFormData ? expectedFormData[field.label] : await generateRandomData(page, field);
        const element = await page.$(field.selector);
        if (element) {
            console.log(`Filling field "${field.label}" with value "${value}"`);
            switch (field.fieldType) {
                case 'password':
                    if (password !== "") {
                        await element.fill(password)
                        break;
                    }
                    await element.fill(value as string);
                    password
                    break;
                case 'text':
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
                    await element.fill(value as string);
                    break;
                case 'file':
                    await element.setInputFiles(field.value || (value as string));
                    break;
                case 'number':
                    await element.fill(value.toString()); // Convert number to string for filling
                    break;
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

    // Adjust selectors for specific fields based on provided locators
    fields.forEach(field => {
        if (field.label.includes('Birthdate')) {
            if (field.selector.includes('select')) {
                field.selector = field.selector.replace('select', `div/select[${field.label.includes('day') ? '1' : '2'}]`);
            } else if (field.selector.includes('input')) {
                field.selector = field.selector.replace('input', 'div/input');
            }
        }
    });

    // Generate expected data for verification (replace with your specific data)
    const expectedFormData: Record<string, string> = {};
    for (const field of fields) {
        expectedFormData[field.label] = await generateRandomData(page, field) as string;
    }

    // Fill the form with generated data
    await fillForm(page, fields, expectedFormData);

    // Submit the form (modify based on your form submission mechanism)
    await page.locator("(//button[normalize-space()='Save'])[1]").click();

    // Add a slight delay to ensure the form submission is complete
    await page.waitForTimeout(5000);

    // Capture form data from the DOM for verification
    const capturedFormData = await captureFormData(page, fields);
    console.log('Captured form data:', capturedFormData);

    // Verify captured form data against expected values
    verifyFormData(capturedFormData, expectedFormData);

    console.log('Form data verification successful!');
});
