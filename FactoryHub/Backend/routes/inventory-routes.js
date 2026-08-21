const express = require('express');

const {
    createInventoryTransaction,
    getInventoryTransactions,
    getInventoryByModelCode,
    restockProduct
} = require('../controllers/inventory-controller');

const router = express.Router();

// Create inventory transaction
router.post('/', createInventoryTransaction);

// Restock existing product
router.post('/restock/:modelCode', restockProduct);

// Get all inventory transactions
router.get('/', getInventoryTransactions);

// Get transactions for a specific model
router.get('/model/:modelCode', getInventoryByModelCode);

module.exports = router;