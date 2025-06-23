interface JSONData {
    id: number;
    firstName: string;
    lastName: string;
    Age: string;
    Salary: number;
}

export class GridDataGen {
    numberOfDataToGen: number;

    constructor(n: number) {
        this.numberOfDataToGen = n;
    }

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
