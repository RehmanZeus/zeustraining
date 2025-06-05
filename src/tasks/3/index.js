




const multiply = (arr, n) => {
    let carry = 0;
    let result = [];
    
    for(let i = arr.length - 1; i>=0; --i){
        let prod = arr[i] * n + carry;
        carry = Math.floor(prod/10000);
        result.unshift(prod % 10000)
    }
    while(carry > 0){
        result.unshift(carry%10000);
        carry = Math.floor(carry/10000);
    }
    return result
}

const factorial = (num) => {
    let arr = [1];
    for(let n = 1; n <=num ; ++n){
        arr = multiply(arr,n);
    }

    

    
    console.log(arr.join(','))

}

factorial(50000)

// const button = document.getElementById("solve");

// button.addEventListener("click", () => {
//     const inputValue = document.getElementById("problem").value;
//     factorial(inputValue);
// })
