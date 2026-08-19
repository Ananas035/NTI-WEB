const mongoose = require("mongoose");

const dbConnect = async () => {
    try {
        // await mongoose.connect(process.env.MONGODB_URI, {
        //     dbName: process.env.DB_NAME,
        // });
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME,
            maxPoolSize: 10,
            minPoolSize: 2,               // Keep at least 2 connections open at all times
            socketTimeoutMS: 30000,       // Close dead sockets after 30 seconds
            serverSelectionTimeoutMS: 5000,
            maxIdleTimeMS: 10000,         // Close idle connections after 10s so new ones spawn fresh
            family: 4
            });
        console.log(`Database connection success`);
    } catch (error) {
    console.log(`Database connection fail: ${error.message}`);
    }

    
};

module.exports = dbConnect;