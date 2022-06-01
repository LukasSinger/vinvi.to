const PUBLIC_DIR = "public";
const DB_DIR = "database";
const PUBLIC_DB_DIR_NAME = "publicDb";
const PUBLIC_DB_DIR = `${PUBLIC_DIR}/${PUBLIC_DB_DIR_NAME}`;
const DB_LOCATION = DB_DIR + "/database.json";
const HOST = process.env.NODE_ENV ? "saturn.rochesterschools.org" : "localhost";
const PORT = process.env.NODE_ENV ? 16677 : 16667;

const pathMappings = {
  "/": "pages/home.html",
  "/home": "pages/home.html",
  "/library": "pages/your-library.html",
  "/new": "pages/start-writing.html",
  "/profile": "pages/profile.html",
  "/search": "pages/search.html",
  "/story": "pages/read-book.html",
  "/404": "pages/404.html"
};

const NEW_USER_BALANCE = 10;
const MAX_DAILY_REWARDS = 1;
const MIN_STORY_COST = 1;
const COST_PER_WORD = 0.01;

const fs = require("fs");
const formidable = require("formidable");
const express = require("express");
const app = express();

let currentIdTime;
let currentIds;

/**
 * Counts the words in the provided string.
 * @returns {number} The number of words.
 */
String.prototype.countWords = function () {
  return this.trim().split(/\s+/).length;
};

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
    if (process.env.NODE_ENV) console.log("You are trying to run the server on an improperly configured machine.\nIf you're just trying to test, use `npm run devstart` instead.");
    else throw err;
  });

// Handle user balance request
app.get("/api/balance", (req, res) => {
  let db = getDb();
  let reqUser = db.users[getReqUser(req)];
  if (requestHasValidCredentials(req, db)) {
    writeToRes(res, 200, "application/json", reqUser.balance);
  } else {
    writeToRes(res, 401, "text/html", "Invalid credentials");
  }
});

// Handle library request
app.get("/api/library", (req, res) => {
  let db = getDb();
  let user = db.users[getReqUser(req)];
  if (requestHasValidCredentials(req, db)) {
    writeToRes(res, 200, "application/json", user.ownedStories);
  } else {
    writeToRes(res, 401, "text/html", "Invalid credentials");
  }
});

// Handle new user request
app.post("/api/user/new", (req, res) => {
  let db = getDb();
  let id = getUniqueId();
  let form = new formidable.IncomingForm({
    filter: ({ name, originalFilename, mimetype }) => {
      return mimetype && mimetype.includes("image");
    },
    maxFileSize: 8 * 1024 * 1024 /* 8MB */,
    filename: () => id,
    keepExtensions: true
  });
  form.parse(req, (err, fields, files) => {
    if (err || db.users[fields.username] || !fields.email || !fields.username || !fields.password) {
      writeToRes(res, 400, "text/html", "Bad request");
      return;
    }
    // Store the profile picture, if there is one
    let pfpImg = files["pfp"];
    if (pfpImg) {
      let newPfpPath = `/${PUBLIC_DB_DIR_NAME}/img/${pfpImg.originalFilename}`;
      fields.pfp = newPfpPath;
      fs.rename(pfpImg.filepath, PUBLIC_DIR + newPfpPath, (err) => {
        if (err) throw err;
      });
    }
    // Store the new user's data
    fields.balance = NEW_USER_BALANCE;
    fields.createdStories = [];
    fields.ownedStories = [];
    db.users[fields.username] = fields;
    saveDb(db);
    redirect(res, "/");
  });
});

// Handle user info request
app.get("/api/user/:id", (req, res) => {
  let db = getDb();
  let user = db.users[req.params.id];
  if (user) {
    delete user.email;
    delete user.password;
    writeToRes(res, 200, "application/json", user);
  } else {
    writeToRes(res, 404, "text/html", "User not found");
  }
});

// Handle new story request
app.post("/api/story/new", (req, res) => {
  let db = getDb();
  let id = getUniqueId();
  let form = new formidable.IncomingForm({
    filter: ({ name, originalFilename, mimetype }) => {
      return mimetype && mimetype.includes("image");
    },
    maxFileSize: 8 * 1024 * 1024 /* 8MB */,
    filename: () => id,
    keepExtensions: true
  });
  form.parse(req, (err, fields, files) => {
    if (err || !fields.username || !fields.password || !fields.title || !fields.content) {
      writeToRes(res, 400, "text/html", "Bad request");
      return;
    }
    // Check for valid authentication
    if (isValidCredentials(fields.username, fields.password, db)) {
      // Don't include password in database entry
      delete fields.password;
      // Store the cover image, if there is one
      let coverImg = files["cover"];
      if (coverImg && coverImg.originalFilename) {
        let newCoverPath = `/${PUBLIC_DB_DIR_NAME}/img/${coverImg.originalFilename}`;
        fields.cover = newCoverPath;
        fs.rename(coverImg.filepath, PUBLIC_DIR + newCoverPath, (err) => {
          if (err) throw err;
        });
      }
      // Calculate cost
      let rawCost = Math.floor(fields.content.countWords() * COST_PER_WORD);
      fields.cost = Math.max(rawCost, MIN_STORY_COST);
      // Store the metadata and story content
      fields.id = id;
      db.stories[id] = fields;
      // Add story to user's account
      db.users[fields.username].createdStories.push(id);
      // Add balance to user's account based on length of submission
      db.users[fields.username].balance += fields.cost;
      // Write to database
      saveDb(db);
      redirect(res, "/");
    } else {
      writeToRes(res, 401, "text/html", "Invalid credentials");
    }
  });
});

// Handle story search request
app.get("/api/story/search", (req, res) => {
  let feed = performSearch(req);
  writeToRes(res, 200, "application/json", feed);
});

// Handle story content request
app.get("/api/story/:id", (req, res) => {
  let db = getDb();
  let dbEntry = db.stories[req.params.id];
  if (dbEntry) {
    if (userHasAccess(db.users[getReqUser(req)], dbEntry) && requestHasValidCredentials(req, db)) {
      writeToRes(res, 200, "application/json", dbEntry);
    } else {
      delete dbEntry.content;
      writeToRes(res, 200, "application/json", dbEntry);
    }
  } else writeToRes(res, 404, "text/html", "Story not found");
});

// Handle buy story request
app.get("/api/story/:id/buy", (req, res) => {
  let db = getDb();
  let dbEntry = db.stories[req.params.id];
  let reqUser = db.users[getReqUser(req)];
  if (dbEntry) {
    if (requestHasValidCredentials(req, db)) {
      if (executeTranscation(reqUser, dbEntry.cost, dbEntry.id)) {
        saveDb(db);
        writeToRes(res, 200, "text/html", "Transcation successful");
      } else {
        writeToRes(res, 400, "text/html", "Transcation failed (balance too low)");
      }
    } else {
      writeToRes(res, 401, "text/html", "Invalid credentials");
    }
  } else writeToRes(res, 404, "text/html", "Story not found");
});

// Handle daily rewards request
app.get("/api/rewards", (req, res) => {
  const ONE_DAY = 1000 * 60 * 60 * 24;
  let db = getDb();
  let user = db.users[getReqUser(req)];
  if (requestHasValidCredentials(req, db)) {
    // Check if the user has received daily rewards within the last 24 hours
    let timeSinceLastHandout = Date.UTC() - user.lastDailyReward;
    if (!user.lastDailyReward || timeSinceLastHandout > ONE_DAY) {
      user.lastDailyReward = Date.UTC();
      let allStoryIds = Object.keys(db.stories);
      let selectedStoryIds = [];
      // Give the user rewards until the max is reached or there are no more stories to give
      for (let i = 0; i < MAX_DAILY_REWARDS; i++) {
        let selection = Math.floor(Math.random() * allStoryIds.length);
        let originalSelection = selection;
        let selectedId = allStoryIds[selection];
        // If the selected story has already been selected or the user already has it,
        // look sequentially for a valid story
        while (selectedStoryIds.includes(selectedId) || userHasAccess(user, db.stories[selectedId])) {
          selection = (selection + 1) % allStoryIds.length;
          selectedId = allStoryIds[selection];
          // If the sequential search couldn't find a valid story, save and stop
          if (selection == originalSelection) {
            saveDb(db);
            writeToRes(res, 200, "text/html", "Daily rewards partially fulfilled");
            return;
          }
        }
        selectedStoryIds.push(selectedId);
        executeTranscation(user, 0, selectedId);
      }
      saveDb(db);
      writeToRes(res, 200, "text/html", "Daily rewards fulfilled");
    } else {
      writeToRes(res, 429, "text/html", ONE_DAY - timeSinceLastHandout);
    }
  } else writeToRes(res, 401, "text/html", "Invalid credentials");
});

// Serve home page
app.get("/", (req, res) => {
  homePage(req, res);
});
app.get("/home", (req, res) => {
  homePage(req, res);
});
function homePage(req, res) {
  let feed = performSearch();
  servePage("/home", res, { feed: feed });
}

// Serve search page
app.get("/search", (req, res) => {
  let feed = performSearch(req);
  servePage("/search", res, { query: req.query.query, feed: feed });
});

// Serve profile page
app.get("/user/:id", (req, res) => {
  let db = getDb();
  let user = db.users[req.params.id];
  for (let i = 0; i < user.createdStories.length; i++) {
    let id = user.createdStories[i];
    user.createdStories[i] = db.stories[id];
  }
  if (user) servePage("/profile", res, { metadata: user });
  else servePage("/404", res);
});

// Serve story page
app.get("/story/:id(\\d+)", (req, res) => {
  let dbEntry = getDb().stories[req.params.id];
  if (dbEntry) servePage("/story", res, { metadata: dbEntry });
  else servePage("/404", res);
});

// Serve all other pages staticly
app.use((req, res) => {
  servePage(req.path, res);
});

/**
 * Determines the webpage to serve based on the requested path.
 * @param {string} file The requested path.
 * @param {http.ServerResponse} res The response object to write to.
 */
function servePage(path, res, vars, was404) {
  let file = `${PUBLIC_DIR}/${pathMappings[path]}`;
  if (fs.existsSync(file)) {
    res.render(file, vars, (err, data) => {
      if (err) throw err;
      if (was404 || path == "/404") writeToRes(res, 404, "text/html", data);
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
  if (type) res.writeHead(status, { "Content-Type": type });
  else res.writeHead(status);
  if (data) res.write(data);
  res.end();
}

/**
 * Sends a response instructing the browser to redirect to the specified URL.
 * @param {http.ServerResponse} res The response to write to.
 * @param {string} url The URL to redirect the browser to.
 */
function redirect(res, url) {
  res.writeHead(303, { Location: url });
  res.end();
}

/**
 * Performs a search based on the provided request.
 * @param {http.IncomingRequest} req The request to read search parameters from.
 * @returns {Array} An array of story metadata.
 */
function performSearch(req) {
  let db = getDb();
  let ids = Object.keys(db.stories);
  let feed = [];
  let query;
  let limit;
  if (req && req.query) {
    query = req.query.query.toLowerCase();
    limit = req.query.limit;
  }
  if (!limit) limit = 20;
  for (let i = 0; i < limit && i < ids.length; i++) {
    let story = db.stories[ids[ids.length - 1 - i]];
    // Add the story metadata to the results if there was no query
    // or the title matches the query
    if (!query || story.title.toLowerCase().includes(query)) {
      delete story.content;
      feed.push(story);
    }
  }
  return feed;
}

/**
 * Withdraws from the user's balance and adds the given asset to their account.
 * @param {object} user The user to do the transaction with
 * @param {number} cost The balance to withdraw
 * @param {string} asset The ID of the asset to give the user access to
 * @returns {boolean} Whether or not the transaction was successful
 */
function executeTranscation(user, cost, assetID) {
  if (user.balance < cost) return false;
  user.balance -= cost;
  user.ownedStories.push(assetID);
  return true;
}

/**
 * Evaluates the given request for a valid username and password combination.
 * @param {http.IncomingRequest} req The request to read authentication details from.
 * @param {object} db The database to authenticate against.
 * @returns {boolean} Whether or not the request can be authenticated.
 */
function requestHasValidCredentials(req, db) {
  let reqUser = getReqUser(req);
  let reqPass = req.headers["x-pass"];
  return isValidCredentials(reqUser, reqPass, db);
}

/**
 * Gets the username from the authentication details of the request.
 * @param {http.IncomingRequest} req The request to read the username from.
 * @returns {string} The username.
 */
function getReqUser(req) {
  return req.headers["x-user"];
}

/**
 * Checks a user's current access to a given story.
 * @param {object} user The user object.
 * @param {object} story The story object.
 * @returns {boolean} Whether or not the story is accessible by the given user.
 */
function userHasAccess(user, story) {
  return user.createdStories.includes(story.id) || user.ownedStories.includes(story.id);
}

/**
 * Evaluates the given username and password.
 * @param {string} username The username.
 * @param {string} password The password.
 * @param {object} db The database to validate against.
 * @returns {boolean} Whether or not the given username and password are valid.
 */
function isValidCredentials(username, password, db) {
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
    safeMkdirSync(DB_DIR);
    safeMkdirSync(PUBLIC_DB_DIR);
    safeMkdirSync(PUBLIC_DB_DIR + "/img");
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
 * Saves new database contents.
 * @param {object} db The new database object to write.
 */
function saveDb(db) {
  fs.writeFile(DB_LOCATION, JSON.stringify(db), (err) => {
    if (err) throw err;
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
 * Same as mkdirSync(), except does not create the directory if it already exists.
 * @param {string} dir The directory to create.
 */
function safeMkdirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
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
