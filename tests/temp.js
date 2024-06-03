const { faker } = require("@faker-js/faker/locale/af_ZA");


function generateContactDetailsJSON() {
    return {
        "Steet 1": faker.location.streetAddress(),    // Street 1
        "Street 2": faker.location.secondaryAddress(), // Street 2
        "City": faker.location.city(),             // City
        "State/Province": faker.location.state(),            // State/Province
        "Postal Code": faker.location.zipCode(),          // Zip/Postal Code
        "Home": "456",             // Home
        "Mobile": '123-456-7890',                    // Mobile (Hardcoded)
        "Work": '098-765-4321',                    // Work (Hardcoded)
        "Work Email": 'abc@gmail.com',            // Work Email
        "Other Email": 'abcd@gmail.com'            // Other Email
    };
}

const data = generateContactDetailsJSON()

for (let [key, value] of Object.entries(data)) {
    console.log(key, value);
}

