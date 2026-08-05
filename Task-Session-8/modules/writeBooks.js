const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "books.json");

function writeBooks(data, callback) {
    fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
    (err) => {
        callback(err);
    }
    );
}

module.exports = writeBooks;