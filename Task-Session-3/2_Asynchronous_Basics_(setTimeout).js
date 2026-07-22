// =======================1=========================
console.log("Hello");

setTimeout(() => {
    console.log("World");
}, 2000);
// =================================================

// =======================2=========================
function print() {
    for (let i = 1; i <= 5; i++) {
        setTimeout(() => {
            console.log(i);
        }, i * 1000);
    }
}

print();
// =================================================

// =======================3=========================
console.log("Loading...");

setTimeout(() => {
    console.log("Done");
}, 3000);
// =================================================

// =======================4=========================
function sendMessage(message, delay) {
    console.log("Sending message...");

    setTimeout(() => {
        console.log("Message received:", message);
    }, delay);
}

sendMessage("Welcome to our website!", 2000);
// =================================================