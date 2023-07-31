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
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const userUrls = urlsForUser(userId);
  const templateVars = {
    urls: userUrls,
    user: users[userId],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id/edit", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url || url.userID !== userId) {
    res.status(404).send("URL not found");
    return;
  }
  // Other users will get a access denied message if trying to access another's URL
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

app.post("/urls/:id", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url || url.userID !== userId) {
    res.status(403).send("Access denied");
    return;
  }

  const newLongURL = req.body.longURL;
  url.longURL = newLongURL;

  res.redirect("/urls");
});

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
    shortURL,
    longURL: url.longURL,
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url) {
    res.status(404).send("URL not found");
    return;
  }

  res.redirect(url.longURL);
});

app.get("/register", (req, res) => {
  res.render("urls_register", { user: req.session.user });
});

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

app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId],
  };
  res.render("urls_login", templateVars);
});

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

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});