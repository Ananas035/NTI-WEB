const cart = require('../data/cart');

function calculateTotal() {
    let total = 0;

    for (let i = 0; i < cart.length; i++) {
        total += cart[i].price;
    }

    console.log("Total:" + total +" EGP");
}

module.exports = calculateTotal;