const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "books.json");

function readBooks(callback) {
    fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
        return callback(err);
    }

    try {
        const books = JSON.parse(data || "[]");
        callback(null, books);
    } catch (error) {
        callback(error);
    }
    });
}

module.exports = readBooks;