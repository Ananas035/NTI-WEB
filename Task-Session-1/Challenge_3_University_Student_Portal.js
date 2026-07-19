function generateStudentReport(studentName, attendancePercentage, midtermScore, assignmentScore, finalExamScore, tuitionStatus) {
    
    if (tuitionStatus === "Unpaid") {
        return "Access Denied: " + studentName + ", you cannot view your results because your tuition is unpaid.\n";
    }

    let totalScore = midtermScore + assignmentScore + finalExamScore;
    
    let letterGrade = "";
    let academicStatus = "";

    if (attendancePercentage < 70) {
        letterGrade = "F";
        academicStatus = "FAIL (Attendance below 70%)";
        
    } else {
        if (totalScore >= 90) {
            letterGrade = "A";
            academicStatus = "PASS";
        } else if (totalScore >= 80) {
            letterGrade = "B";
            academicStatus = "PASS";
        } else if (totalScore >= 70) {
            letterGrade = "C";
            academicStatus = "PASS";
        } else if (totalScore >= 60) {
            letterGrade = "D";
            academicStatus = "PASS";
        } else {
            letterGrade = "F";
            academicStatus = "FAIL (Low Academic Score)";
        }
    }

    let report = "====================================\n";
    report = report + "      STUDENT ACADEMIC REPORT       \n";
    report = report + "====================================\n";
    report = report + "Student Name: " + studentName + "\n";
    report = report + "Attendance: " + attendancePercentage + "%\n";
    report = report + "Tuition Status: " + tuitionStatus + "\n";
    report = report + "------------------------------------\n";
    report = report + "Midterm Score: " + midtermScore + " / 30\n";
    report = report + "Assignment Score: " + assignmentScore + " / 20\n";
    report = report + "Final Exam Score: " + finalExamScore + " / 50\n";
    report = report + "Total Score: " + totalScore + " / 100\n";
    report = report + "------------------------------------\n";
    report = report + "Final Grade: " + letterGrade + "\n";
    report = report + "Status: " + academicStatus + "\n";
    report = report + "====================================\n";

    return report;
}



console.log("--- TEST 1: Excellent Student (Paid, High Attendance, High Scores) ---");
console.log(generateStudentReport("Youssef", 95, 28, 19, 48, "Paid"));

console.log("\n--- TEST 2: Unpaid Tuition (Cannot view grades) ---");
console.log(generateStudentReport("Ali", 85, 25, 18, 40, "Unpaid"));

console.log("\n--- TEST 3: Automatic Fail due to Low Attendance ---");

console.log(generateStudentReport("Kareem", 60, 20, 20, 50, "Paid"));

console.log("\n--- TEST 4: Fail due to Low Grades ---");
console.log(generateStudentReport("Sara", 80, 10, 10, 20, "Paid"));


