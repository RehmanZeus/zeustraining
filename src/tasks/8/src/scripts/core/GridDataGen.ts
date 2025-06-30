interface JSONData {
    id: number;
    firstName: string;
    lastName: string;
    Age: string;
    Salary: number;
}

/**
 * Generates random grid data for the specified number of rows.
 */
export class GridDataGen {
    numberOfDataToGen: number;

    /**
     * @param n The number of rows of data to generate.
     * The data will consist of random first names, last names, ages, and salaries.
     */
    constructor(n: number) {
        this.numberOfDataToGen = n;
    }

    /**
     * 
     * @returns An array of JSONData objects, each representing a row of data.
     * Each object contains an id, first name, last name, age (as a string), and salary (as a number).
     * The first name and last name are randomly generated with 3 to 8 characters.
     */
    generateData(): JSONData[] {
        const lowAlphabets = "abcdefghijklmnopqrstuvwxyz";
        const upAlphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const data: JSONData[] = [];

        for (let i = 0; i < this.numberOfDataToGen; i++) {
            // Generate random first name
            const firstNameLength = Math.floor(Math.random() * 6) + 3; // 3 to 8 characters
            let firstName = upAlphabets[Math.floor(Math.random() * upAlphabets.length)];
            for (let j = 1; j < firstNameLength; j++) {
                firstName += lowAlphabets[Math.floor(Math.random() * lowAlphabets.length)];
            }

            // Generate random last name
            const lastNameLength = Math.floor(Math.random() * 6) + 3;
            let lastName = upAlphabets[Math.floor(Math.random() * upAlphabets.length)];
            for (let j = 1; j < lastNameLength; j++) {
                lastName += lowAlphabets[Math.floor(Math.random() * lowAlphabets.length)];
            }

            // Generate random age between 18 and 65
            const age = Math.floor(Math.random() * (65 - 18 + 1)) + 18;

            // Generate random salary between 30,000 and 150,000
            const salary = Math.floor(Math.random() * (150000 - 30000 + 1)) + 30000;

            data.push({
                id: i + 1,
                firstName,
                lastName,
                Age: age.toString(),
                Salary: salary
            });
        }

        return data;
    }
}
