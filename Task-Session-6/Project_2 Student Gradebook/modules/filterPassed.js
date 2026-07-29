const students = require ("../data/students.js");
const calculateAverage = require ("./calculateAverage.js");

function filterPassed() {

    let passed = [];

    for (let i = 0; i < students.length; i++) {

        let avg = calculateAverage(students[i].grades);

        if (avg >= 60) {
            passed.push(students[i].name);
        }

    }

    return passed;
}

module.exports = filterPassed;