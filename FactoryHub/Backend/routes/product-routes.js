const express = require('express');
const upload = require('../middleware/upload');

const {
    createProduct,
    getProducts,
    getProductByCode,
    updateProduct,
    deleteProduct
} = require('../controllers/product-controller');

const router = express.Router();


// Get all products
// Create new product
router.route('/')
    .get(getProducts)
    .post(upload.single('image'), createProduct);


// Get / Update / Delete by Model Code
router.route('/code/:modelCode')
    .get(getProductByCode)
    .patch(upload.single('image'), updateProduct)
    .delete(deleteProduct);


module.exports = router;