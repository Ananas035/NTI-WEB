async function getUserProfile(id) {
    try {
        const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
        if (!response.ok) {
            console.log("User not found");
            return;
        }
        const user = await response.json();
        console.log("Name:", user.name);
        console.log("Email:", user.email);
    } catch (error) {
        console.log("Something went wrong");
    }
}

getUserProfile(1);