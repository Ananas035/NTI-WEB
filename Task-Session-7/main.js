const addGrade = require("./modules/add.grade");
const deleteGrade = require("./modules/delete.grade");
const readGrades = require("./modules/read.grades");
const updateGrade = require("./modules/update.grade");

addGrade(1, "youanas", "Math", 90);
addGrade(2, "ibrahim", "Science", 85);

console.log(readGrades());

updateGrade(2, 95);

deleteGrade(1);

console.log(readGrades());