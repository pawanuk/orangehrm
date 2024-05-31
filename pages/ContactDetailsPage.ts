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

  /**
   * Iterate over json object and enter values in contact form fields.
   * @param data -> json object with values to enter in fields.
   */
  async fillContactDetailsJSON(jsonData: any) {
    let count = 1 // initialize a counter 
    for (let [key, value] of Object.entries(jsonData)) { // entries will return key, value pair
      const n = count + 1 // initialize n to index xpath
      console.log(`Filling data: ${value} at ${n}`);
      await this.page.fill(`(//input)[${n}]`, value as string); // value from json data
      count++; 
    }
  }

  /**
   * Create actual json object, copying contact details tempalte. 
   * (means copying only keys and values are empty)
   * Iterate over actual empty json
   * @returns 
   */
  async getActualContactDetailsJSON(): Promise<any> {
    const actualDetails: { [key: string]: string } = { ...contactDetailsTemplate() }; // create actual detials template
    let count = 1
    for (let [key, value] of Object.entries(actualDetails)) { // entries will give (key, value) where value is empty
      const n = count + 1
      const selector = `(//input)[${n}]`;
      actualDetails[key] = await this.page.inputValue(selector); // read the actual data and update the value for the key
      count++;
    }
    return actualDetails;
  }



  async save() {
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState("networkidle");
  }
}
