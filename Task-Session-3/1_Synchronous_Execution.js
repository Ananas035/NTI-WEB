// =======================1========================
console.log("Start");
console.log("Middle");
console.log("End");
// =================================================

// =======================2=========================
function secondFunction() {
    console.log("Inside Second Function");
}

function firstFunction() {
    console.log("First Function Started");
    secondFunction();
    console.log("First Function Ended");
}

firstFunction();
// =================================================

// =======================3=========================
function calculations() {
    let sum = 10 + 5;
    console.log("Sum:", sum);
    
    let multiply = sum * 2;
    console.log("Multiply:", multiply);
}

calculations();
// =================================================

// =======================4=========================
function calculateTotal(price, quantity) {
    return price * quantity;
}

function printBill(price, quantity) {
    let total = calculateTotal(price, quantity);
    console.log("Total Bill:", total);
}

printBill(100, 3);
// =================================================
