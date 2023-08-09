const express = require("express");
const app = express();
const PORT = 8080;
const path = require('path');
const { getUserByEmail, generateRandomString } = require("./helpers");
const { urlDatabase, users } = require("./database");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieSession = require("cookie-session");
app.use(
  cookieSession({
    name: "session",
    keys: ["secret-key"],
  })
);

const bcrypt = require("bcrypt");

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

// Helper functions 
// Function to filter and return URLs associated with a specific user ID
const urlsForUser = function (id) {
  const filteredUrls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrls[url] = urlDatabase[url];
    }
  }
  return filteredUrls;
};

// Middleware 
// Middleware function to check if user is logged in
const requireLogin = (req, res, next) => {
  const userId = req.session.user_id;
  if (!userId || !users[userId]) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Routes
// Redirects users to their URLs if logged in, otherwise redirects to login page
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Lists URLs for the logged-in user
app.get("/urls", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const userUrls = urlsForUser(userId);
  const templateVars = {
    urls: userUrls,
    user: users[userId],
  };
  res.render("urls_index", templateVars);
});

// Renders the new URL creation page
app.get("/urls/new", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_new", templateVars);
});

// Allows editing of a specific URL
app.get("/urls/:id/edit", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url || url.userID !== userId) {
    res.status(404).send("URL not found");
    return;
  }
  // Other users will get an access denied message if trying to access another's URL
  if (url.userID !== userId) {
    res.status(403).send("Access denied");
    return;
  }

  const templateVars = {
    user: users[userId],
    shortURL,
    longURL: url.longURL,
  };

  res.render("urls_edit", templateVars);
});

// Creates a new URL
app.post("/urls", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL,
    userID: userId,
  };

  res.redirect("/urls");
});

// Handles updating an existing URL
app.post("/urls/:id/edit", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const newLongURL = req.body.urlupdate;

  const url = urlDatabase[shortURL];
  if (!url || url.userID !== userId) {
    res.status(403).send("Access denied");
    return;
  }

  url.longURL = newLongURL;

  res.redirect("/urls");
});

// Deletes a URL
app.post("/urls/:id/delete", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url || url.userID !== userId) {
    res.status(403).send("Access denied");
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Displays a specific URL's details
app.get("/urls/:id", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url || url.userID !== userId) {
    res.status(404).send("URL not found");
    return;
  }

  const templateVars = {
    user: users[userId],
    owner: url.userID === userId, // This sets the value of 'owner' to true if the user owns the URL
    shortURL,
    longURL: url.longURL,
  };

  res.render("urls_show", templateVars);
});

// Redirects to the original URL associated with a short URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];

  if (!url) {
    let templateVars = {
      status: 404,
      message: "URL not found",
      user: users[req.session.user_id],
    };
    res.status(404);
    res.render("urls_error", templateVars);
    return;
  }

  res.redirect(url.longURL); // Redirect to the long URL
});


// Renders the registration page
app.get("/register", (req, res) => {
  res.render("urls_register", { user: req.session.user });
});

// Handles user registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password fields cannot be empty");
    return;
  }

  const user = getUserByEmail(email);
  if (user) {
    res.status(400).send("Email address already registered");
    return;
  }

  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
  };

  users[userId] = newUser;

  req.session.user_id = userId;
  res.redirect("/urls");
});

// Renders the login page
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_login", templateVars);
});

// Handles user login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Invalid login credentials");
    return;
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

// Handles user logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Starts the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});