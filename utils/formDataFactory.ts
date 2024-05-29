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
    generatePhoneNumber(),             // Home
    '123-456-7890',                    // Mobile (Hardcoded)
    '098-765-4321',                    // Work (Hardcoded)
    'abc@gmail.com',            // Work Email
    'abcd@gmail.com'            // Other Email
  ];
}
