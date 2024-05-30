import { faker } from '@faker-js/faker';

function generatePhoneNumber() {
  return faker.phone.number('(###) ###-#### x####');
}

export function generateContactDetails() {
  return [
    faker.location.streetAddress(),    // Street 1
    faker.location.secondaryAddress(), // Street 2
    faker.location.city(),             // City
    faker.location.state(),            // State/Province
    faker.location.zipCode(),          // Zip/Postal Code
    "456",             // Home
    '123-456-7890',                    // Mobile (Hardcoded)
    '098-765-4321',                    // Work (Hardcoded)
    'abc@gmail.com',            // Work Email
    'abcd@gmail.com'            // Other Email
  ];
}

export function contactDetailsTemplate() {
  return {
    "Steet 1": "",
    "Street 2": "",
    "City": "",
    "State/Province": "",
    "Postal Code": "",
    "Home": "",
    "Mobile": '',
    "Work": '',
    "Work Email": '',
    "Other Email": ''
  };
}

export function generateContactDetailsJSON() {
  const expectedDetails = { ...contactDetailsTemplate() }
  expectedDetails["Steet 1"] = faker.location.streetAddress()
  expectedDetails["Street 2"] = faker.location.secondaryAddress()
  expectedDetails["City"] = faker.location.city()
  expectedDetails["State/Province"] = faker.location.state()
  expectedDetails["Postal Code"] = faker.location.zipCode()
  expectedDetails["Home"] = '098-765-1234';
  expectedDetails["Mobile"] = '123-456-7890';
  expectedDetails["Work"] = '098-765-4321';
  expectedDetails["Work Email"] = faker.internet.email()
  expectedDetails["Other Email"] = faker.internet.email()
  return expectedDetails;
}
