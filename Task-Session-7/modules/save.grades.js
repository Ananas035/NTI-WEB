const fs = require("fs");

function saveGrades(grades) {
    fs.writeFileSync(
        "./data/grades.json",
        JSON.stringify(grades, null, 2)
    );
}

module.exports = saveGrades;