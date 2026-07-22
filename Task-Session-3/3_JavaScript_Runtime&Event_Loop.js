// =======================1=========================
console.log("Start");

setTimeout(() => {
    console.log("Timeout");
}, 1000);

console.log("End");

// Output:
// Start
// End
// Timeout

// =================================================

// =======================2=========================
console.log("A");

setTimeout(() => {
    console.log("B");
}, 0);

console.log("C");

// console.log is synchronous, so it runs first.
// setTimeout is asynchronous, so its callback runs after the call stack is empty.

// Output:
// A
// C
// B

// =================================================

// =======================3=========================
console.log("Step 1");

setTimeout(() => {
    console.log("Step 2");
}, 2000);

console.log("Step 3");

console.log("Step 4");

// Output:
// Step 1
// Step 3
// Step 4
// Step 2

// =================================================

// =======================4=========================
console.log("First");

setTimeout(() => {
        console.log("Timeout");
    }, 0);

console.log("Second");
// =================================================