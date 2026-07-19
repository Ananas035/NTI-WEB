function processCheckout(customerName, category, price, quantity, couponCode, paymentMethod) {
    
    let subtotal = price * quantity;
    let currentTotal = subtotal; 
    
    let categoryDiscountAmount = 0;
    let couponDiscountAmount = 0;
    let paymentDiscountAmount = 0;
    let vatTaxAmount = 0;

    if (category === "Electronics") {
        categoryDiscountAmount = currentTotal * 0.10; 
    } else if (category === "Clothing") {
        categoryDiscountAmount = currentTotal * 0.20;
    } else if (category === "Books") {
        categoryDiscountAmount = currentTotal * 0.15; 
    }
    currentTotal = currentTotal - categoryDiscountAmount;

    if (couponCode === "SAVE50") {
        couponDiscountAmount = 50.00; 
    } else if (couponCode === "SAVE20") {
        couponDiscountAmount = currentTotal * 0.20; 
    } else if (couponCode === "none") {
        couponDiscountAmount = 0; 
    } else {
        console.log("Note: The coupon code entered is invalid.");
    }
    
    currentTotal = currentTotal - couponDiscountAmount;
    
    if (currentTotal < 0) {
        currentTotal = 0; 
    }

    if (paymentMethod === "E-Wallet") {
        paymentDiscountAmount = currentTotal * 0.05; 
    } else if (paymentMethod === "Visa") {
        paymentDiscountAmount = currentTotal * 0.02;
    } else if (paymentMethod === "Cash") {
        paymentDiscountAmount = 0; 
    } else {
        console.log("Note: Unknown payment method.");
    }
    
    currentTotal = currentTotal - paymentDiscountAmount;


    vatTaxAmount = currentTotal * 0.14; 
    

    let finalBill = currentTotal + vatTaxAmount;


    let invoice = "====================================\n";
    invoice = invoice + "        E-COMMERCE INVOICE          \n";
    invoice = invoice + "====================================\n";
    invoice = invoice + "Customer Name: " + customerName + "\n";
    invoice = invoice + "Category: " + category + "\n";
    invoice = invoice + "Payment Method: " + paymentMethod + "\n";
    invoice = invoice + "------------------------------------\n";
    invoice = invoice + "Price per item: $" + price + "\n";
    invoice = invoice + "Quantity: " + quantity + "\n";
    invoice = invoice + "Subtotal: $" + subtotal + "\n";
    invoice = invoice + "------------------------------------\n";
    
    if (categoryDiscountAmount > 0) {
        invoice = invoice + "Category Savings: -$" + categoryDiscountAmount + "\n";
    }
    if (couponDiscountAmount > 0) {
        invoice = invoice + "Coupon Savings: -$" + couponDiscountAmount + "\n";
    }
    if (paymentDiscountAmount > 0) {
        invoice = invoice + "Payment Savings: -$" + paymentDiscountAmount + "\n";
    }
    
    invoice = invoice + "VAT (14% Tax): +$" + vatTaxAmount + "\n";
    invoice = invoice + "====================================\n";
    invoice = invoice + "FINAL TOTAL TO PAY: $" + finalBill + "\n";
    invoice = invoice + "====================================\n";

    return invoice;
}


console.log("--- TEST 1: Paid with Visa, No Coupon (none) ---");
console.log(processCheckout("Ahmed", "Electronics", 1000, 1, "none", "Visa"));

console.log("\n--- TEST 2: Paid in Cash with a Coupon ---");
console.log(processCheckout("Ali", "Clothing", 200, 2, "SAVE50", "Cash"));

console.log("\n--- TEST 3: Paid with E-Wallet, No Coupon (none) ---");
console.log(processCheckout("Omar", "Books", 50, 4, "none", "E-Wallet"));