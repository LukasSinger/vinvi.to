require("dotenv").config();
const http = require("http");
const url = require("url");
const fs = require("fs");

let currentIdTime;
let currentIds;

http
  .createServer((req, res) => handleRequest(req, res))
  .listen({
    host: "localhost",
    port: 667
  });

console.log("The server is now listening for requests.");

function handleRequest(req, res) {
  console.log(req.read());
  let q = url.parse(req.url, true);
  let file;
  if (q.query.title) {
    if (currentIdTime != Date.now()) {
      currentIdTime = Date.now();
      currentIds = 0;
    }
    let thisId = Date.now().toString() + currentIds;
    currentIds++;
    let db = fs.readFileSync("database/database.json");
    if (db.length == 0) db = {};
    else db = JSON.parse(db);
    db[thisId] = q.query;
    fs.writeFileSync("database/database.json", JSON.stringify(db));
    servePage("public/pages/index.html", res);
  } else {
    file =
      q.pathname == "/" ? "public/pages/index.html" : `public/${q.pathname}`;
    return servePage(file, res);
  }
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
