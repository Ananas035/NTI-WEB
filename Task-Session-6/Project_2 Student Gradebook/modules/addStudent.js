const students = require("../data/students.js");

function addStudent(name, grades) {
    students.push({
        name,
        grades
    });
}

module.exports = addStudent;