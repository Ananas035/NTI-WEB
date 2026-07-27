const addToCart = require('./modules/addToCart');
const removeFromCart = require('./modules/removeFromCart');
const listCart = require('./modules/listCart');
const calculateTotal = require('./modules/calculateTotal');

addToCart(1); 
addToCart(3); 
addToCart(5); 
addToCart(6); 

console.log('================= * Cart * ==================')
listCart();

console.log('================= * Total * =================')
calculateTotal();
console.log('=============================================')

removeFromCart(3); 

console.log('================= * Cart * ==================')
listCart();

console.log('================= * Total * =================')
calculateTotal();