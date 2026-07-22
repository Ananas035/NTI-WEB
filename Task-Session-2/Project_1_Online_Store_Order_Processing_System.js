function processOrders(orders) {
    let totalRevenue = 0;
    let successfulOrders = 0;
    let processedCount = 0;

    let skippedInRow = 0;
    let stockFailures = 0;

    let stopMessage = "";

    for (let i = 0; i < orders.length; i++) {
        let order = orders[i];
        
        processedCount++;
        if (
            order.status === "cancelled" ||
            order.status === "invalid" ||
            !order.stockAvailable
        ) {
            skippedInRow++;

            if (!order.stockAvailable) {
                stockFailures++;
            }

            if (skippedInRow === 3 || stockFailures === 3) {
                stopMessage = "System stopped due to critical failure";
                break;
            }

            continue;
        }

        totalRevenue += order.amount;
        successfulOrders++;
        skippedInRow = 0;
    }

    return {
        totalRevenue,
        successfulOrders,
        processedCount,
        stopMessage
    };
}

const orders = [
    { id: 1, status: "valid", stockAvailable: true, amount: 100 },
    { id: 2, status: "cancelled", stockAvailable: true, amount: 200 },
    { id: 3, status: "invalid", stockAvailable: true, amount: 300 },
    { id: 4, status: "valid", stockAvailable: false, amount: 400 },
    { id: 5, status: "valid", stockAvailable: true, amount: 500 }
];

console.log(processOrders(orders));