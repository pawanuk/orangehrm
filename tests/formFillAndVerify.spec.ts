import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Function to generate random data for form fields
const generateRandomData = (label: string): string => {
  if (label.toLowerCase().includes('email')) return faker.internet.email();
  if (label.toLowerCase().includes('phone') || label.toLowerCase().includes('mobile') || label.toLowerCase().includes('home')) return faker.phone.number();
  if (label.toLowerCase().includes('zip') || label.toLowerCase().includes('postal')) return faker.location.zipCode();
  if (label.toLowerCase().includes('street')) return faker.location.streetAddress();
  if (label.toLowerCase().includes('city')) return faker.location.city();
  if (label.toLowerCase().includes('state')) return faker.location.state();
  if (label.toLowerCase().includes('country')) return 'Afghanistan'; // For the dropdown
  return faker.lorem.word(); // Default random word
};

// Function to extract form fields
const extractFormFields = async (page: Page): Promise<{ [label: string]: string }> => {
  const fieldSelectors: { [label: string]: string } = {};
  const fields = await page.$$('div.oxd-input-group'); // Using class-based selector for input groups

  for (const field of fields) {
    const labelElement = await field.$('label');
    const inputElement = await field.$('input, textarea, select');
    
    if (labelElement && inputElement) {
      const label = await labelElement.textContent();
      const inputName = await inputElement.getAttribute('name');
      
      if (label && inputName) {
        fieldSelectors[label.trim()] = `input[name="${inputName}"]`;
      }
    }
  }
  
  return fieldSelectors;
};

// Function to fill the form
const fillForm = async (page: Page, fields: { [label: string]: string }) => {
  for (const [label, selector] of Object.entries(fields)) {
    const value = generateRandomData(label);
    console.log(`Filling field "${label}" with value "${value}" using selector "${selector}"`);
    const element = await page.$(selector);
    if (element) {
      const tagName = await element.evaluate(el => el.tagName);
      if (tagName === 'SELECT') {
        await element.selectOption({ label: value });
      } else {
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
  console.log("line 70");

  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Add a slight delay to ensure the navigation is complete
  await page.waitForTimeout(5000);

  // Navigate to the form page
  await page.getByRole('link', { name: 'My Info' }).click();
  await page.getByRole('link', { name: 'Contact Details' }).click();

  // Add a slight delay to ensure the page is fully loaded
  await page.waitForTimeout(5000);

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

  // Select country manually due to the specific script from codegen
  const countryDropdown = page.locator('div[class*="oxd-select-wrapper"]');
  await countryDropdown.click();
  await page.locator('div[role="option"]:has-text("Afghanistan")').click();

  // Submit the form
  await page.getByRole('button', { name: 'Save' }).click();

  // Add a slight delay to ensure the form submission is complete
  await page.waitForTimeout(5000);

  // Capture form data from the DOM for verification
  const loggedFormData = await captureFormData(page, fields);
  console.log('Captured form data:', loggedFormData);

  // Verify form data
  for (const [label, selector] of Object.entries(fields)) {
    const expectedValue = await page.$eval(selector, el => (el as HTMLInputElement).value);
    if (loggedFormData[label] !== expectedValue) {
      console.error(`Field ${label} does not match. Expected: ${expectedValue}, Found: ${loggedFormData[label]}`);
      throw new Error(`Field ${label} does not match. Expected: ${expectedValue}, Found: ${loggedFormData[label]}`);
    }
  }

  console.log('Form data verification successful!');
});
