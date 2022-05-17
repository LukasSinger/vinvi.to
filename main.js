require("dotenv").config();
const http = require("http");
const url = require("url");
const fs = require("fs");
const { parse } = require("path");

const DATABASE_LOCATION = "database/database.json";
const HOST = process.env.DEPLOY_MODE
  ? "saturn.rochesterschools.org"
  : "localhost";

let currentIdTime;
let currentIds;

runSafelyInDeployment(
  () => bootServer(),
  "You are trying to run the server on an improperly configured machine.\nIf you're just trying to test, use `npm run devstart` instead."
);

console.log("The server is now listening for requests.");

function bootServer() {
  http
    .createServer((req, res) => {
      runSafelyInDeployment(
        () => handleRequest(req, res),
        "Something went wrong while handling the request.",
        true
      );
    })
    .listen({
      host: HOST,
      port: 16677
    });
}

function handleRequest(req, res) {
  let q = new URL(req.url, `http://${req.host}`);
  let file;
  if (q.pathname == "/api") {
    handleAPIRequest(req, res);
  } else {
    file =
      q.pathname == "/" ? "public/pages/index.html" : `public/${q.pathname}`;
    return servePage(file, res);
  }
}

function handleAPIRequest(req, res) {
  if (currentIdTime != Date.now()) {
    currentIdTime = Date.now();
    currentIds = 0;
  }
  let thisId = Date.now().toString() + currentIds;
  currentIds++;

  let db;
  if (!fs.existsSync(DATABASE_LOCATION)) db = "";
  else db = fs.readFileSync("database/database.json");
  if (db.length == 0) db = {};
  else db = JSON.parse(db);
  db[thisId] = parseRequestData(req);
  console.log(db);
  fs.writeFileSync("database/database.json", JSON.stringify(db));
  servePage("public/pages/index.html", res);
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

function parseRequestData(req) {
  let data = "";
  req.on("data", (chunk) => {
    data += chunk.toString();
  });
  return req.on("end", () => {
    return parse(body);
  });
}

/**
 * Runs the provided callback and, when running in deployment mode, prints notices instead of throwing errors.
 * @param func The callback to run.
 * @param msg The notice to print when there is an error.
 * @param {boolean} printErr Whether or not to print the actual error message as well.
 */
function runSafelyInDeployment(func, msg, printErr) {
  if (!process.env.DEPLOY_MODE) func();
  else
    try {
      func();
    } catch (err) {
      console.log(msg);
      if (printErr) console.log(err);
    }
}
