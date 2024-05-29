import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ContactDetailsPage } from '../pages/ContactDetailsPage';
import { generateContactDetails } from '../utils/formDataFactory';

test.describe('Contact Details Form', () => {
  test('should fill and verify contact details form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const contactDetailsPage = new ContactDetailsPage(page);
    const contactDetails = generateContactDetails();

    await loginPage.navigate();
    await loginPage.login('Admin', 'admin123');

    await contactDetailsPage.navigate();
    await contactDetailsPage.fillContactDetails(contactDetails);

    await contactDetailsPage.save();
    await page.waitForLoadState('networkidle');

    await contactDetailsPage.verifyContactDetails(contactDetails);
  });
});
