const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const {
  getUserByEmail,
  getUserById,
  urlsForUser,
  emailExists,
  getRandomString,
} = require("./helpers");

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["secret-key"], // secret keys for session
  })
);
app.set("view engine", "ejs");


//DATA OBJECTS

const urlDatabase = {}; // store URLS
const users = {}; // store User data

//ROUTES

//homepage
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//Handle Registration
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_register", templateVars);
  }
});

//validate input data
app.post("/register", (req, res) => {
  const userID = getRandomString(6);
  const userEmail = req.body.email;
  const userPW = req.body.password;
  if (!userEmail || !userPW || emailExists(userEmail, users)) {
    res.status(400).send("Looks like that account is taken, try a new one!");
  } else {
    //store user data
    req.session.user_id = userID;
    const hashedPassword = bcrypt.hashSync(userPW, 10);
    users[userID] = {
      id: userID,
      email: userEmail,
      password: hashedPassword,
    };
    res.redirect("/urls");
  }
});

//login page for registered user
app.get("/login", (req, res) => {
  // check if user is already logged in
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_login", templateVars);
  }
});

//handle login
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPW = req.body.password;
  const userID = getUserByEmail(userEmail, users);
  if (!userEmail || !userPW) {
    return res.status(400).send(" must fill out valid email and password ");
  }
  const user = getUserByEmail(userEmail, users);
  if (user === null) {
    return res.status(400).send("Access denied");
  }
  if (!bcrypt.compareSync(userPW, user.password)) {
    return res
      .status(400)
      .send(" Username or password incorrect: please try again ");
  } else {
    // set user session and redirect to URLs page
    req.session.user_id = userID.id;
    res.redirect("/urls");
  }
});

//handles user logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//Show URL's of logged in users
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const urlsForUserDB = urlsForUser(userID, urlDatabase);
  const user = getUserById(userID, users); //store the new URL in the database
  if (!user) {
    return res.redirect("/login");
  } else {
    const templateVars = {
      urls: urlsForUserDB,
      user: users[userID],
    };
    return res.render("urls_index", templateVars);
  }
});

//Creates New URL page
app.post("/urls", (req, res) => {
  const shortURL = getRandomString(6);
  const userID = req.session.user_id;
  if (getUserById(userID, users)) {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: userID,
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    return res
      .status(400)
      .send("Please login to save urls");
  }
});
// redirect to long URL
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const user = getUserById(userID, users);
  if (user === null) {
    return res.redirect("/login");
  }
  const templateVars = {
    urls: urlDatabase,
    user: users[userID],
  };
  res.render("urls_new", templateVars);
});

//View single URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    return res.redirect(urlDatabase[shortURL].longURL);
  }
  return res.status(400).send("This link does not exist");
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  let templateVars = {};

  if (!userID) {
    templateVars.user = null;
  } else {
    const userURLs = urlsForUser(userID, urlDatabase);
    const shortURL = req.params.shortURL;
    
    if (userURLs[shortURL]) {
      const longURL = urlDatabase[shortURL].longURL;
      templateVars.user = users[userID];
      templateVars.longURL = longURL;
      templateVars.shortURL = shortURL;
      templateVars.owner = true; // Set the owner variable to true since the user owns the URL
    } else {
      templateVars.user = users[userID];
      templateVars.shortURL = null;
      templateVars.owner = false; // Set the owner variable to false since the user doesn't own the URL
    }
  }

  res.render("urls_show", templateVars);
});

// Edit URL
app.post("/urls/:shortURL/edit", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.urlupdate;

  const url = urlDatabase[shortURL];
  
  if (!url || url.userID !== userID) {
    return res.status(403).send("Access denied");
  }

  url.longURL = newLongURL;

  // Redirect to the URL's details page after successful update
  res.redirect(`/urls/${shortURL}`);
});

// Update URL
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(400).send(" inaccessible ");
  } else {
    const userURLs = urlsForUser(userID, urlDatabase);
    if (userURLs[req.params.shortURL]) {
      urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      res.redirect("/urls");
    } else {
      return res.status(400).send(" inaccessible ");
    }
  }
});

//Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(400).send("inaccessible");
  } else {
    const userURLs = urlsForUser(userID, urlDatabase);
    const urlToDelete = req.params.shortURL;
    if (userURLs[urlToDelete]) {
      delete urlDatabase[urlToDelete];
      res.redirect("/urls");
    } else {
      return res.status(400).send("inaccessible");
    }
  }
});

//start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});