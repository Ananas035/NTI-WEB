const cart = require('../data/cart');

function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index === -1) {
        console.log(`Product with ID ${productId} is not in the cart.`);
        return false;
    }
    const removed = cart.splice(index, 1)[0];
    console.log(`${removed.name} Removed  from cart.`);
    return true;
}

module.exports = removeFromCart;