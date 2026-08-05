const fs = require("fs");
const path = require("path");

const filepath = path.join(__dirname, "../data/grades.json");

function readGrades() {
    const data = fs.readFileSync(filepath, "utf8");
    return JSON.parse(data);
}

module.exports = readGrades;