const readGrades = require("./read.grades");
const saveGrades = require("./save.grades");

function updateGrade(id, newGrade) {

    const grades = readGrades();

    const student = grades.find(student => student.id == id);

    if (!student) {
        console.log("Student Not Found");
        return;
    }

    student.grade = newGrade;

    saveGrades(grades);

    console.log("Grade Updated Successfully");
}

module.exports = updateGrade;