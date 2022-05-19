require("dotenv").config();
const http = require("http");
const fs = require("fs");
const formidable = require("formidable");
const express = require("express");
const app = express();
app.use(express.static("public"));

const DB_DIR = "database";
const DB_LOCATION = DB_DIR + "/database.json";
const HOST = process.env.NODE_ENV ? "saturn.rochesterschools.org" : "localhost";
const PORT = process.env.NODE_ENV ? 16677 : 16667;

const staticPathMappings = {
  "/": "pages/home.html",
  "/home": "pages/home.html",
  "/new": "pages/start-writing.html",
  "/library": "pages/your-library.html",
  "/404": "pages/blank-page.html"
};

let currentIdTime;
let currentIds;

app
  .listen(PORT, HOST)
  .on("listen", () => {
    console.log("The server is now listening for requests.");
  })
  .on("error", (err) => {
    if (process.env.NODE_ENV)
      console.log(
        "You are trying to run the server on an improperly configured machine.\nIf you're just trying to test, use `npm run devstart` instead."
      );
    else throw err;
  });

// Serves static pages
app.use((req, res) => {
  servePage(req.path, res);
});

// Responds to API requests
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

  servePage("/home", res);
});

/**
 * Determines the webpage to serve based on the requested path.
 * @param {string} file The requested path.
 * @param {http.ServerResponse} res The response object to write to.
 */
function servePage(path, res, was404) {
  let file = `public/${staticPathMappings[path]}`;
  fs.readFile(file, (err, data) => {
    if (err) {
      if (was404) throw err;
      servePage("/404", res, true);
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
 * @param {Function} func The callback to run.
 * @param {string} msg The notice to print when there is an error.
 * @param {boolean} printErr Whether or not to print the actual error message as well.
 */
function runSafelyInDeployment(func, msg, printErr) {
  if (!process.env.NODE_ENV) func();
  else
    try {
      func();
    } catch (err) {
      console.log(msg);
      if (printErr) console.log(err);
    }
}
