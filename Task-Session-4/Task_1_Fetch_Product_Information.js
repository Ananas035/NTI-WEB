const products = {
    1: "Laptop",
    2: "Phone",
    3: "Tablet"
};

function getProduct(id) {
    return new Promise((resolve, reject) => {
            if (products[id]) {
                resolve(`Product: ${products[id]}`);
            } else {
                reject("Error: Product not found");
            }
    });
}

getProduct(2)
.then(product => console.log(product))
.catch(error => console.log(error));

getProduct(5)
.then(product => console.log(product))
.catch(error => console.log(error));