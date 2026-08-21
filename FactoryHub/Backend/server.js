const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const connectDB = require('./config/db-connect');

const customerRoutes = require('./routes/customer-routes');
const productRoutes = require('./routes/product-routes');

connectDB();

const app = express();

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`FactoryHub Server running on port ${PORT}`);
});