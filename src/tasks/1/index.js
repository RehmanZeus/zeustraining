const dummyForm = document.getElementById("dummy-form");

const validCheck = (fields) => {

    for (const field of fields) {



        if (!field) {
            alert(`${field.name} is required`)
            return false;
        }

        if (!field.predefined) {
            if (field.value.length < field.minLength || field.value.length > field.maxLength) {
                alert(`${field.name} must be minimum of ${field.minLength} and maximum of ${field.maxLength}`)
                return false;
            }
        }

    }
    return true;
}


const validateFormValues = (dname, cmnt, gender) => {

    const valuesToValidate = [{
        name: "Name",
        value: dname,
        minLength: 3,
        maxLength: 25,
        predefined: false
    }, {
        name: "Comment",
        value: cmnt,
        minLength: 10,
        maxLength: 250,
        predefined: false
    }, {
        name: "Gender",
        value: gender,
        predefined: true
    }];

    return validCheck(valuesToValidate);
}

dummyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameValue = dummyForm.elements["name"].value
    const commentValue = dummyForm.elements["comments"].value;
    const genderButtons = document.querySelectorAll('input[name=gender]')
    let selectedGender, g;

    for (const x of genderButtons) {
        if (x.checked) {
            g  = x;
            selectedGender = x.value;
            break;
        }
    }
    const allGood = validateFormValues(nameValue, commentValue, selectedGender);

    if (allGood) {
        alert(`Your submitted values: \n
            Name: ${nameValue} \n
            Comment: ${commentValue} \n
            Gender: ${selectedGender}`);
        dummyForm.elements["name"].value = "";
        dummyForm.elements["comments"].value = "";
        g.checked = false;
    } else {
        alert("Please fix the errors")
    }




})