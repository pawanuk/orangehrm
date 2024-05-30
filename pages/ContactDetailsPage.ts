import { Page } from 'playwright';
import { contactDetailsTemplate } from '../utils/formDataFactory';

interface ContactDetails {
  [key: string]: string;
}

export class ContactDetailsPage {
  private page: Page;
  private contactDetailsURL = 'https://opensource-demo.orangehrmlive.com/web/index.php/pim/contactDetails/empNumber/7';
  private firstFieldLocator = '(//input)[2]';

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(this.contactDetailsURL);
    await this.page.waitForLoadState("networkidle");
  }

  async fillContactDetails(data: string[]) {
    await this.page.fill(this.firstFieldLocator, data[0]);
    console.log(`Filling data: ${data[0]} at (//input)[2]`);
    for (let i = 1; i < data.length; i++) {
      const n = i + 2
      await this.page.keyboard.press('Tab');
      if (n === 5) { // Skip field 6
        console.log(`Skipping data: ${data[i]} at index ${i}`);
        continue;
      }
      const locator = `(//input)[${n}]`;
      console.log(`Filling data: ${data[i]} at ${locator}`);
      await this.page.fill(locator, data[i]);
    }
  }

  async fillContactDetailsJSON(data: any) {
    let count = 1
    for (let [key, value] of Object.entries(data)) {
      const n = count + 1
      console.log(`Filling data: ${value} at ${n}`);
      await this.page.fill(`(//input)[${n}]`, value as string);
      count++;
    }
  }

  async verifyContactDetails(data: string[]) {
    await this.page.focus(this.firstFieldLocator);
    for (let i = 0; i < data.length; i++) {
      const n = i + 2
      await this.page.keyboard.press('Tab');
      if (n === 5) { // Skip field 6
        console.log(`Skipping verification at index ${i}`);
        continue;
      }
      const fieldValue = await this.page.inputValue(`(//input)[${n}]`);
      console.log(`Verifying data at index ${i}: Expected: ${data[i]}, Found: ${fieldValue}`);
      if (fieldValue !== data[i]) {
        throw new Error(`Field ${n} does not match expected value. Expected: ${data[i]}, Found: ${fieldValue}`);
      }
    }
  }

  async getActualContactDetailsJSON(): Promise<any> {
    const actualDetails: { [key: string]: string } = { ...contactDetailsTemplate };
    const fieldKeys = Object.keys(actualDetails);
    for (let i = 0; i < fieldKeys.length; i++) {
        const selector = `(//input)[${i + 1}]`;
        actualDetails[fieldKeys[i]] = await this.page.inputValue(selector);
        console.log(actualDetails[fieldKeys[i]]);
        
    }
    return actualDetails;
}



  async save() {
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState("networkidle");
  }
}
