const util = require('util')
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    // Read the content of 'example.txt'
    fs.readFile('example.txt', 'utf8', (err, data) => {
        if (err) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
        }

        // Send the contents of the file as the HTTP response
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(data);
    });
});

const PORT = process.env.PORT || 3000;

// `util.print()` has been removed in Node 12, see:
//   https://nodejs.org/api/deprecations.html#dep0026-utilprint
util.print('Starting HTTP server.')
server.listen(PORT, () => {
    util.print(`Server is listening on port ${PORT}`);
});

