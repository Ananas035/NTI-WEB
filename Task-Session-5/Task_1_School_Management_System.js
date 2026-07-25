class person {
    #email;
    #id;

    constructor(name, email, id) {
        this.name = name;
        this.#email = email;
        this.#id = id;
    }

    set id(value) {
        if (value > 0){
            this.#id = value;
        } else {
            console.log("Invalid ID");
        }
    }

    get id() {
        return this.#id;
    }

    set email(value) {
        if (value.includes("@")) {
            this.#email = value;
        } else {
            console.log("Invalid email");
        }
}

    get email() {
        return this.#email;
    }

    describeRole() {
        console.log("I am a person.");
    }
}

class Principal extends person {

    constructor(name, email, id) {
        super(name, email, id);
        this.members = [];
    }

    addMember(member) {
        this.members.push(member);
        console.log(`Member ${member.name} added.`);
    }

    removeMember(member) {
        this.members = this.members.filter(member => member.id !== id);
        console.log(`Member ${member.name} removed.`);
    }
    listMembers() {
        this.members.forEach(
            member => {
                console.log(`Name: ${member.name}`);
            }
        );
    }

    describeRole() {
        console.log("I am a principal.");
    }
}

class Teacher extends person {

    constructor(name, email, id, subject) {
        super(name, email, id);
        this.subject = subject;
        this.grade = [];
    }

    gradeStudent(studentName, grade) {
        this.grade.push({ studentName, grade });
    }

    listGrades() {
        console.log("Student Grades:");
        this.grade.forEach(({ studentName, grade }) => {
            console.log(`Name: ${studentName}, Grade: ${grade}`);
        });
    }

    describeRole() {
    console.log(`I teach ${this.subject}.`);
    }
}

class Student extends person {

    constructor(name, email, id) {
        super(name, email, id);
        this.subjects = [];
    }

    enroll(subject) {
        this.subjects.push(subject);
    }

    viewSubjects() {
        console.log("Enrolled Subjects:");
        this.subjects.forEach(subject => {
            console.log(`- ${subject}`);
        });
    }

    describeRole() {
        console.log("I am a student.");
    }
}


const principal = new Principal(
  "Mr. Ahmed",
  "ahmed@school.com",
  1
);

const teacher = new Teacher(
  "Sara",
  "sara@school.com",
  2,
  "JavaScript"
);

const student = new Student(
  "Ali",
  "ali@gmail.com",
  3
);

principal.addMember(teacher);
principal.addMember(student);

principal.listMembers();

teacher.gradeStudent("Ali", 95);
teacher.listGrades();

student.enroll("JavaScript");
student.enroll("HTML");
student.viewSubjects();

const schoolMembers = [principal, teacher, student];

console.log("\nRoles:");
schoolMembers.forEach(member => {
    console.log(member.name);
    member.describeRole();
});
