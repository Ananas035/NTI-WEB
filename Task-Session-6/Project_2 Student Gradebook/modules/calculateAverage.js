function calculateAverage(grades) {

    let sum = 0;

    for (let i = 0; i < grades.length; i++) {
        sum += grades[i];
    }

    return sum / grades.length;
}

module.exports = calculateAverage;