const addStudent = require ("./modules/addStudent.js"); 
const listStudents = require ("./modules/listStudents.js"); 
const filterPassed = require ("./modules/filterPassed.js");

addStudent("Ahmed", [90, 80, 70]);
addStudent("Sara", [50, 60, 55]);
addStudent("Ali", [100, 90, 95]);
addStudent("Kamal", [60, 65, 70]);

console.log("All Students:");
listStudents();

console.log("----------------");

console.log("Passed Students:");
console.log(filterPassed());