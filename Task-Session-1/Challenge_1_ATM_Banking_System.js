let Pin = "1234";
let Balance = 1000.00;


function checkBalance() {
    return "Your balance is $" + Balance;
}

function deposit(amount) {
    if (amount <= 0) {
        return "Error: You must deposit more than zero.";
    }
    
    Balance += amount;
    return "Success! You deposited $" + amount + ". New balance: $" + Balance;
}

function withdraw(amount) {
    if (amount <= 0) {
        return "Error: You must withdraw more than zero.";
    }
    
    if (amount > Balance) {
        return "Error: You do not have enough money.";
    }
    
    Balance -= amount;
    return "Success! You withdrew $" + amount + ". New balance: $" + Balance;
}

function changePin(newPin) {
    let pinText = String(newPin);
    
    if (pinText.length !== 4) {
        return "Error: PIN must be exactly 4 digits.";
    }
    
    if (isNaN(pinText)) {
        return "Error: PIN must only contain numbers.";
    }
    
    Pin = pinText;
    return "Success! Your PIN is changed.";
}


function ATM(enteredPin, action, amount, newPin) {
    
    if (enteredPin !== Pin) {
        return "Error: Wrong PIN!";
    }
    
    if (action === "check_balance") {
        return checkBalance();
        
    } else if (action === "deposit") {
        return deposit(amount);
        
    } else if (action === "withdraw") {
        return withdraw(amount);
        
    } else if (action === "change_pin") {
        return changePin(newPin);
        
    } else {
        return "Error: I do not understand that action.";
    }
}


console.log( ATM("9999", "check_balance") ); 

console.log( ATM("1234", "check_balance") ); 

console.log( ATM("1234", "deposit", 50) );   

console.log( ATM("1234", "withdraw", 100) ); 

console.log( ATM("1234", "change_pin", null, "5678") ); 

console.log( ATM("1234", "check_balance") );