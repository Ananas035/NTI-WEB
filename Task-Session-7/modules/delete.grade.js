const readGrades = require("./read.grades");
const saveGrades = require("./save.grades");

function deleteGrade(id) {

    const grades = readGrades();

    const newGrades = grades.filter(student => student.id != id);

    saveGrades(newGrades);

    console.log("Grade Deleted Successfully");
}

module.exports = deleteGrade;