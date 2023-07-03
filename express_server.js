const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  // Your URL database
};

const users = {
  // Your users database
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {
    user,
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  // URL creation logic
});

app.get("/urls/:id", (req, res) => {
  // URL details logic
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const userId = generateRandomString();

  if (!email || !password) {
    res.status(400).send("Email and password fields cannot be empty");
    return;
  }

  for (const userIdKey in users) {
    if (users[userIdKey].email === email) {
      res.status(400).send("Email address already registered");
      return;
    }
  }

  const newUser = {
    id: userId,
    email,
    password,
  };

  users[userId] = newUser;

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
