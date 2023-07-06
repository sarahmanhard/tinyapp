const express = require("express");
const app = express();
const PORT = 8080;

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

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

const urlsForUser = function (id) {
  const filteredUrls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrls[url] = urlDatabase[url];
    }
  }
  return filteredUrls;
};

// Middleware to check if user is logged in
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
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    const userUrls = urlsForUser(userId);
    res.render("urls_index", { urls: userUrls, user: users[userId] });
  } else {
    res.render("urls_index", { urls: {}, user: null }); // Pass an empty object for urls when the user is not logged in
  }
});


app.get("/urls/new", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL,
    userID: user.id,
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

  const userId = req.session.user_id;
  const user = users[userId];
  const templateVars = {
    user,
    shortURL,
    longURL: url.longURL,
  };
  res.render("urls_show", templateVars);
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

  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Invalid password");
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
