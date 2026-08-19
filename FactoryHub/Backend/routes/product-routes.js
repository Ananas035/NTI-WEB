    const express = require('express');
    const upload = require('../middleware/upload'); // Import Multer
    const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
    } = require('../controllers/product-controller');

    const router = express.Router();

    router.route('/')
    .get(getProducts)
    .post(upload.single('image'), createProduct); // Added upload middleware

    router.route('/:id')
    .get(getProductById)
    .patch(upload.single('image'), updateProduct) // Added upload middleware
    .delete(deleteProduct);

    module.exports = router;