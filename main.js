require("dotenv").config();
const http = require("http");
const fs = require("fs");
const formidable = require("formidable");
const express = require("express");
const app = express();

const DB_DIR = "database";
const DB_LOCATION = DB_DIR + "/database.json";
const HOST = process.env.DEPLOY_MODE
  ? "saturn.rochesterschools.org"
  : "localhost";
const PORT = 16677;

let currentIdTime;
let currentIds;

app
  .listen(PORT, HOST)
  .on("listen", () => {
    console.log("The server is now listening for requests.");
  })
  .on("error", () => {
    console.log(
      "You are trying to run the server on an improperly configured machine.\nIf you're just trying to test, use `npm run devstart` instead."
    );
  });

app.get(/.*/, (req, res) => {
  runSafelyInDeployment(
    () => handleRequest(req, res),
    "Something went wrong while handling the request.",
    true
  );
});

app.post("/api", (req, res) => {
  let db;
  let id = getUniqueId();
  if (!fs.existsSync(DB_LOCATION)) {
    // The database hasn't been created or has been compromised
    fs.mkdirSync(DB_DIR);
    fs.mkdirSync(DB_DIR + "/img");
    db = "";
  } else db = fs.readFileSync(DB_LOCATION);
  if (db.length == 0) db = {};
  else db = JSON.parse(db);

  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    // Store the cover image
    let coverImg = files["cover"];
    let newCoverPath = DB_DIR + "/img/" + coverImg.originalFilename;
    fs.rename(coverImg.filepath, newCoverPath, (err) => {
      if (err) throw err;
    });
    // Store the metadata and story content
    fields.cover = newCoverPath;
    db[id] = fields;
    fs.writeFile(DB_LOCATION, JSON.stringify(db), (err) => {
      if (err) throw err;
    });
  });

  servePage("public/pages/index.html", res);
});

function handleRequest(req, res) {
  file = req.path == "/" ? "public/pages/index.html" : `public/${req.path}`;
  servePage(file, res);
}

function servePage(file, res) {
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("We couldn't find what you requested (404)");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(data);
    res.end();
  });
}

/**
 * Generates a unique ID based on time and order generated.
 * @returns A unique numeric ID.
 */
function getUniqueId() {
  if (currentIdTime != Date.now()) {
    currentIdTime = Date.now();
    currentIds = 0;
  }
  let id = Date.now().toString() + currentIds;
  currentIds++;
  return id;
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
