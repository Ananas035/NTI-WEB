function calculateShipping(weight){
    return new Promise((resolve, reject) => {
        if (weight > 0){
            const cost = weight * 5;
            resolve(`Shipping cost: $${cost}`);
        }
        else{
            reject("Error: Invalid weight");
        }
    });
}

calculateShipping(10)
.then(cost => console.log(cost))
.catch(error => console.log(error));

calculateShipping(-2)
.then(cost => console.log(cost))
.catch(error => console.log(error));