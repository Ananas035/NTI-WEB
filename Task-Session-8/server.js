const http = require("http");
const readBooks = require("./modules/readBooks");
const writeBooks = require("./modules/writeBooks");

const PORT = 3000;

const server = http.createServer((req, res) => {

    res.setHeader("Content-Type", "application/json");

  // ================= GET =================

    if (req.method === "GET" && req.url === "/books") {

    readBooks((err, books) => {

        if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify({ message: "File Error" }));
        }

        res.writeHead(200);
        res.end(JSON.stringify(books));

    });

    return;
    }

// ================= POST =================

    if (req.method === "POST" && req.url === "/books") {

    let body = "";

    req.on("data", chunk => {
        body += chunk;
    });

    req.on("end", () => {

        let newBook;

        try {
        newBook = JSON.parse(body);
        } catch {
        res.writeHead(400);
        return res.end(JSON.stringify({
            message: "Invalid JSON"
        }));
        }

        readBooks((err, books) => {

        if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify({
            message: "File Error"
            }));
        }

        const id =
            books.length > 0
            ? books[books.length - 1].id + 1
            : 1;

        const book = {
            id,
            title: newBook.title,
            author: newBook.author,
            price: newBook.price,
            available: newBook.available
        };

        books.push(book);

        writeBooks(books, (err) => {

            if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify({
                message: "Write Error"
            }));
            }

            res.writeHead(201);
            res.end(JSON.stringify(book));

        });

        });

    });

    return;
    }

// ================= DELETE =================

    if (req.method === "DELETE" && req.url.startsWith("/books/")) {

    const id = Number(req.url.split("/")[2]);

    readBooks((err, books) => {

        if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify({
            message: "File Error"
        }));
        }

        const index = books.findIndex(book => book.id === id);

        if (index === -1) {
        res.writeHead(404);
        return res.end(JSON.stringify({
            message: "Book Not Found"
        }));
        }

        const deletedBook = books.splice(index, 1)[0];

        writeBooks(books, (err) => {

        if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify({
            message: "Write Error"
            }));
        }

        res.writeHead(200);
        res.end(JSON.stringify({
            message: "Book Deleted",
            deletedBook
        }));

        });

        });

        return;
    }

// ================= INVALID ROUTE =================

    res.writeHead(404);
    res.end(JSON.stringify({
        message: "Route Not Found"
    }));

});

server.listen(5000, () => {
    console.log(`Server running on http://localhost:5000`);
});