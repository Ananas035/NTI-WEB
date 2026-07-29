const students = require ("../data/students.js");
const calculateAverage = require ("./calculateAverage.js");

function listStudents() {

    for (let i = 0; i < students.length; i++) {

        console.log(
            students[i].name,
            students[i].grades,
            "Average:",
            calculateAverage(students[i].grades)
        );

    }

}

module.exports = listStudents;