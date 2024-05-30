import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ContactDetailsPage } from '../pages/ContactDetailsPage';
import { generateContactDetails, generateContactDetailsJSON } from '../utils/formDataFactory';

test.describe('Contact Details Form', () => {
  test.only('should fill and verify contact details form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const contactDetailsPage = new ContactDetailsPage(page);
    const expectedDetails = generateContactDetailsJSON();
    console.log(expectedDetails);
    
    await loginPage.navigate();
    await loginPage.login('Admin', 'admin123');

    await contactDetailsPage.navigate();
    await contactDetailsPage.fillContactDetailsJSON(expectedDetails);

    await contactDetailsPage.save();

    const actualContactDetails = await contactDetailsPage.getActualContactDetailsJSON()
    console.log(actualContactDetails);
    
  });
});
