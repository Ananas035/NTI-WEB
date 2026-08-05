const readGrades = require("./read.grades");
const saveGrades = require("./save.grades");

function addGrade(id, name, subject, grade) {

    const grades = readGrades();

    grades.push({
        id,
        name,
        subject,
        grade
    });

    saveGrades(grades);

    console.log("Grade Added Successfully");
}

module.exports = addGrade;