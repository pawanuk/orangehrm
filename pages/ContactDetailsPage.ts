import { Page } from 'playwright';

export class ContactDetailsPage {
  private page: Page;
  private contactDetailsURL = 'https://opensource-demo.orangehrmlive.com/web/index.php/pim/contactDetails/empNumber/7';
  private firstFieldLocator = '(//input)[2]';

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(this.contactDetailsURL);
  }

  async fillContactDetails(data: string[]) {
    await this.page.fill(this.firstFieldLocator, data[0]);
    console.log(`Filling data: ${data[0]} at (//input)[2]`);
    for (let i = 1; i < data.length; i++) {
      await this.page.keyboard.press('Tab');
      if (i === 5) { // Skip field 6
        console.log(`Skipping data: ${data[i]} at index ${i}`);
        continue;
      }
         const locator = `(//input)[${i + 2}]`;
      console.log(`Filling data: ${data[i]} at ${locator}`);
      await this.page.fill(locator, data[i]);
    }
  }

  async verifyContactDetails(data: string[]) {
    await this.page.focus(this.firstFieldLocator);
    for (let i = 0; i <  data.length; i++) {
      await this.page.keyboard.press('Tab');
      if (i === 5) { // Skip field 6
        console.log(`Skipping verification at index ${i}`);
        continue;
      }
      const fieldValue = await this.page.inputValue(`(//input)[${i + 2}]`);
      console.log(`Verifying data at index ${i + 2}: Expected: ${data[i]}, Found: ${fieldValue}`);
      if (fieldValue !== data[i]) {
        throw new Error(`Field ${i + 2} does not match expected value. Expected: ${data[i]}, Found: ${fieldValue}`);
      }
    }
  }

  async save() {
    await this.page.click('button[type="submit"]');
  }
}
