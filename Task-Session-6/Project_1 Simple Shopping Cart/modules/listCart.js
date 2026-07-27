const cart = require('../data/cart');

function listCart() {
    if (cart.length === 0) {
        console.log('The cart is empty.');
        return;
    }
    console.log('Current Cart Items:');
    cart.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - ${item.price.toFixed(2)} EGP`);
    });
}

module.exports = listCart;