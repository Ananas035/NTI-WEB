// =======================1=========================
function greet(name, callback) {
    console.log("Hello, " + name + "!");
    callback();
}

function Goodbye() {
    console.log("Have a nice day!");
}

greet("youanas", Goodbye);
// =================================================

// =======================2=========================
function calculator(a, b, operation) {
    let result = operation(a, b);
    console.log("Result:", result);
}

function add(x, y) {
    return x + y;
}

function subtract(x, y) {
    return x - y;
}

function multiply(x, y) {
    return x * y;
}

calculator(10, 5, add);
calculator(10, 5, subtract);
calculator(10, 5, multiply);
// =================================================

// =======================3=========================
function loadData(callback) {
    console.log("Loading data...");
    
    setTimeout(() => {
        console.log("Data loaded.");
        callback();
    }, 2000);
}

function displayData() {
    console.log("Displaying data...");
}

loadData(displayData);
// =================================================

// =======================4=========================
function login(username, password, successCallback) {
    console.log("Checking credentials...");

    setTimeout(() => {
        if (username === "admin" && password === "123") {
            console.log("Login successful!");
            successCallback();
        } else {
            console.log("Login failed!");
        }
    }, 2000);
}

function Welcome() {
    console.log("Welcome to the Dashboard!");
}

login("admin", "123", Welcome);
// =================================================