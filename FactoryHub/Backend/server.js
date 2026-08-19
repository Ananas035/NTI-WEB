const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

const dns = require("dns");
dns.setServers(["8.8.8.8","8.8.4.4"])

require("dotenv").config();

// 1. Corrected path to your database connection file
const connectDB = require('./config/db-connect');

// 2. Corrected paths to your route files
const customerRoutes = require('./routes/customer-routes');
const productRoutes = require('./routes/product-routes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`FactoryHub Server running on port ${PORT}`);
});