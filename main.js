const fs = require("fs");
const formidable = require("formidable");
const express = require("express");
const session = require("express-session");
const app = express();

const PUBLIC_DIR = "public";
const DB_DIR = "database";
const PUBLIC_DB_DIR_NAME = "publicDb";
const PUBLIC_DB_DIR = `${PUBLIC_DIR}/${PUBLIC_DB_DIR_NAME}`;
const DB_LOCATION = DB_DIR + "/database.json";
const HOST = process.env.NODE_ENV ? "saturn.rochesterschools.org" : "localhost";
const PORT = process.env.NODE_ENV ? 16677 : 16667;

const staticPathMappings = {
  "/": "pages/home.html",
  "/home": "pages/home.html",
  "/story": "pages/read-book.html",
  "/new": "pages/start-writing.html",
  "/library": "pages/your-library.html",
  "/404": "pages/blank-page.html"
};

let currentIdTime;
let currentIds;

app.use(express.static(PUBLIC_DIR));
app.engine(".html", require("ejs").__express);
app.set("views", __dirname);
app.set("view engine", "html");

app
  .listen(PORT, HOST)
  .on("listening", () => {
    console.log("The server is now listening for requests.");
  })
  .on("error", (err) => {
    if (process.env.NODE_ENV)
      console.log(
        "You are trying to run the server on an improperly configured machine.\nIf you're just trying to test, use `npm run devstart` instead."
      );
    else throw err;
  });

// Handle new user request
app.post("/api/user/new", (req, res) => {
  let db = getDb();
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields) => {
    if (err) throw err;
    // Store the new user's data
    db.users[fields.username] = fields;
    fs.writeFile(DB_LOCATION, JSON.stringify(db), (err) => {
      if (err) throw err;
    });
  });

  servePage("/home", res);
});

// Serve story page
app.get("/story/:id(\\d+)", (req, res) => {
  let db = getDb();
  let dbEntry = db.stories[req.params.id];
  if (dbEntry) {
    let reqUser = req.headers["x-user"];
    let reqPass = req.headers["x-pass"];
    if (
      !(reqUser == dbEntry.username && isValidCredentials(db, reqUser, reqPass))
    ) {
      delete dbEntry.content;
    }
    servePage("/story", res, { story: dbEntry });
  } else servePage("/404", res);
});

// Handle new story request
app.post("/api/story/new", (req, res) => {
  let db = getDb();
  let id = getUniqueId();
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    // Check for valid authentication
    if (isValidCredentials(db, fields.username, fields.password)) {
      // Don't include password in database entry
      delete fields.password;
      // Store the cover image, if there is one
      let coverImg = files["cover"];
      if (coverImg.originalFilename) {
        let newCoverPath = `${PUBLIC_DB_DIR}/img/${coverImg.originalFilename}`;
        fields.cover = newCoverPath;
        fs.rename(coverImg.filepath, newCoverPath, (err) => {
          if (err) throw err;
        });
      }
      // Store the metadata and story content
      db.stories[id] = fields;
      fs.writeFile(DB_LOCATION, JSON.stringify(db), (err) => {
        if (err) throw err;
      });
      writeToRes(res, 200, "text/html", "Submitted successfully");
    } else {
      writeToRes(res, 401, "text/html", "Invalid credentials");
    }
  });
});

// Serve static pages
app.use((req, res) => {
  servePage(req.path, res);
});

/**
 * Determines the webpage to serve based on the requested path.
 * @param {string} file The requested path.
 * @param {http.ServerResponse} res The response object to write to.
 */
function servePage(path, res, vars, was404) {
  let file = `${PUBLIC_DIR}/${staticPathMappings[path]}`;
  if (fs.existsSync(file)) {
    res.render(file, vars, (err, data) => {
      if (err) throw err;
      if (was404) writeToRes(res, 404, "text/html", data);
      else writeToRes(res, 200, "text/html", data);
    });
  } else {
    servePage("/404", res, vars, true);
  }
}

/**
 * Writes data to the response sent by the server.
 * @param {http.ServerResponse} res The response to write to.
 * @param {number} status The status code to send.
 * @param {string} type The Content-Type of the data being sent.
 * @param {string | Buffer | object} data The data to send.
 */
function writeToRes(res, status, type, data) {
  if (typeof data != "string" && !(data instanceof Buffer)) {
    data = JSON.stringify(data);
  }
  res.writeHead(status, { "Content-Type": type });
  res.write(data);
  res.end();
}

/**
 * Evaluates the given username and password.
 * @param {object} db The database to validate against.
 * @param {string} username The username.
 * @param {string} password The password.
 * @returns {boolean} Whether or not the given username and password are valid.
 */
function isValidCredentials(db, username, password) {
  let user = db.users[username];
  return user && password == user.password;
}

/**
 * Retrieves the database object, or creates one if it does not exist.
 * @returns The database object.
 */
function getDb() {
  let db;
  if (!fs.existsSync(DB_LOCATION)) {
    // The database hasn't been created or has been compromised
    fs.mkdirSync(DB_DIR);
    fs.mkdirSync(PUBLIC_DB_DIR);
    fs.mkdirSync(PUBLIC_DB_DIR + "/img");
    db = "";
  } else db = fs.readFileSync(DB_LOCATION);
  if (db.length == 0) {
    db = {};
    db.stories = {};
    db.users = {};
  } else db = JSON.parse(db);
  return db;
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
