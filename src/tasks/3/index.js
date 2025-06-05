let DIVISOR = 10000




const multiply = (arr, n) => {
    let carry = 0;
    let result = [];
    
    for(let i = arr.length - 1; i>=0; --i){
        let prod = arr[i] * n + carry;
        carry = Math.floor(prod/DIVISOR);
        result.unshift(prod % DIVISOR)
    }
    while(carry > 0){
        result.unshift(carry%DIVISOR);
        carry = Math.floor(carry/DIVISOR);
    }
    return result
}

const padZeroes = (s) => {
    const length = DIVISOR.toString().length - 1;
    console.log(length)
    let padd;
    for(let i = 0; i < length ; ++i){
        padd += '0';
    }
    console.log(padd + s)
    return padd+s;

}

const factorial = (num) => {
    let arr = [1];
    for(let n = 1; n <=num ; ++n){
        arr = multiply(arr,n);
    }

    for(let i = 0; i < arr.length; ++i){
        if(arr[i] < DIVISOR && i != 0){
            arr[i] = padZeroes(arr[i].toString());
        }
    }


    

    
    console.log(arr.join(','))
    const ans = document.getElementById("answer");
    ans.innerHTML = arr.join(',')
}


const button = document.getElementById("solve");

button.addEventListener("click", () => {
    const inputValue = document.getElementById("problem").value;
    factorial(inputValue);
})
