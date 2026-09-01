const express = require('express');

const {
    createInventoryTransaction,
    getInventoryTransactions,
    getInventoryByModelCode,
    restockProduct
} = require('../controllers/inventory-controller');

const router = express.Router();
const protect = require('../middleware/auth-middleware');
const authorize = require('../middleware/role-middleware');

// Create inventory transaction
router.post('/', protect, authorize('ADMIN'), createInventoryTransaction);

// Restock existing product
router.post('/restock/:modelCode', protect, authorize('ADMIN'), restockProduct);

// Get all inventory transactions
router.get('/', protect, getInventoryTransactions);

// Get transactions for a specific model
router.get('/model/:modelCode', protect, getInventoryByModelCode);

module.exports = router;