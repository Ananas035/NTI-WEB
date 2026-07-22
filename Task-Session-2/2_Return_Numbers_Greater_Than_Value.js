function greaterThan(arr, value) {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > value) {
            result.push(arr[i]);
        }
    }
    return result;
}

console.log(greaterThan([1, 2, 3, 4, 5], 3));
console.log(greaterThan([1, 2, 3, 4, 5], 5));