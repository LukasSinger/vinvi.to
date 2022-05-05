require("dotenv").config();
let https = require("https");
let url = require("url");
let fs = require("fs");

https
  .createServer((req, res) => handleRequest(req, res))
  .listen({
    host: "localhost",
    port: 8080
  });

console.log("The server is now listening for requests.");

function handleRequest(req, res) {
  console.log("Request received.");
  let q = url.parse(req.url, true);
  let file;
  file =
    q.pathname == "/"
      ? "public/pages/index.html"
      : `public/pages/${q.pathname}.html`;
  return servePage(file, res);
}

function servePage(file, res) {
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      return res.end("We couldn't find what you requested (404)");
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(data);
    return res.end();
  });
}
