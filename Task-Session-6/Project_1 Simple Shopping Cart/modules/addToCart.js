const products = require('../data/products');
const cart = require('../data/cart');

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.log(`Product with ID ${productId} not found.`);
        return false;
    }
    cart.push({ ...product });
    console.log(`${product.name} Added to cart.`);
    return true;
}

module.exports = addToCart;