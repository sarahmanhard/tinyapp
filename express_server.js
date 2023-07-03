const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "abc123": { longURL: "http://www.example.com", userId: "user1" },
  "def456": { longURL: "http://www.google.com", userId: "user2" },
};

const users = {
  user1: {
    id: "user1",
    email: "user1@example.com",
    password: "password1",
  },
  user2: {
    id: "user2",
    email: "user2@example.com",
    password: "password2",
  },
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  const userId = req.cookies.user_id;
  if (!userId || !users[userId]) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Routes

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", requireLogin, (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {
    user,
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", requireLogin, (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", requireLogin, (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL,
    userId: user.id,
  };

  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url) {
    res.status(404).send("URL not found");
    return;
  }

  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {
    user,
    shortURL,
    longURL: url.longURL,
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
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
  const newUser = {
    id: userId,
    email,
    password,
  };

  users[userId] = newUser;

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {
    user,
  };
  res.render("login", templateVars);
});


app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);

  if (!user) {
    res.status(403).send("Invalid email address");
    return;
  }

  if (user.password !== password) {
    res.status(403).send("Invalid password");
    return;
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Helper function to find a user in the users object based on email
function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null; // User not found
}

// Helper function to generate a random string
function generateRandomString() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
