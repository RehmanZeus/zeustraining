
const calculateFact = (n) => {
 
    for(let i = n - 1; i >= 1; --i){
        n *= i
    }
    return n;
}

console.log(calculateFact(10))