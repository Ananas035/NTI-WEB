const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const connectDB = require('./config/db-connect');
const customerRoutes = require('./routes/customer-routes');
const productRoutes = require('./routes/product-routes');
const inventoryRoutes = require('./routes/inventory-routes');
const invoiceRoutes = require('./routes/invoice-routes');
const returnRoutes = require('./routes/return-routes');
const accountRoutes = require('./routes/account-routes');
const paymentRoutes = require('./routes/payment-routes');
const checkRoutes = require('./routes/check-routes');
const authRoutes = require('./routes/auth-routes');
const factoryProfileRoutes = require('./routes/factory-profile-routes');

const emailService = require('./services/email-service');

const app = express();
app.use(cors({
    origin: 'http://localhost:4200'
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/checks', checkRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/factory-profile', factoryProfileRoutes);

// Central error handler: never leak stack traces or internal error details to
// the client. Malformed JSON bodies and any uncaught route error land here.
app.use((err, req, res, next) => {
    console.error('[Server] Unhandled error:', err.message);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Invalid request body'
        });
    }

    return res.status(err.status || 500).json({
        success: false,
        message: 'Something went wrong'
    });
});

const start = async () => {
    await connectDB();

    // Startup email check: warns clearly (server-side) when SMTP is missing but
    // does not stop the API from booting.
    await emailService.verifyEmailConfig();

    const PORT = process.env.PORT || 5000;

    return app.listen(PORT, () => {
        console.log(`FactoryHub Server running on port ${PORT}`);
    });
};

if (require.main === module) {
    start();
}

module.exports = { app, start };
