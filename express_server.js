const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { generateRandomString, validateInput, checkUserExists, authenticateUser, urlsForUser } = require('./helpers');

const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "aJ48lW" }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "example@example.org",
    password: "i-like-turtles"
  }
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// URL ROUTES

app.get("/urls", (req, res) => {
  const id = req.cookies["user_id"];

  // returns an object with longURL and userID
  const usersURLs = urlsForUser(urlDatabase, id);

  const templateVars = { user_id: users[req.cookies["user_id"]], urls: usersURLs };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const user_id = req.cookies.user_id;

  if (user_id) {
    urlDatabase[shortURL] = { longURL, userID: user_id };
  }

  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const templateVars = { user_id: users[user_id] };

  if (user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }

});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };

  if (urlDatabase[req.params.shortURL]) {
    res.render("urls_show", templateVars);
  } else {
    res.send("That URL doesn't exit.");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/", (req, res) => {
  const newURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  const user_id = req.cookies["user_id"];

  if (urlDatabase[shortURL].userID === user_id) {
    urlDatabase[shortURL] = { longURL: newURL, userID: user_id };
  } else {
    return res.status(403).send('Forbidden, you are not the creator of this short URL.');
  }

  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  if (urlDatabase[shortURL].userID === req.cookies["user_id"]) {
    delete urlDatabase[shortURL];
  } else {
    return res.status(403).send('Forbidden, you are not the creator of this short URL.');
  }

  res.redirect("/urls");
});

// LOGIN ROUTES

app.get("/login", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // error handling functions
  const userExists = checkUserExists(users, email);
  const userAuthenticated = authenticateUser(users, password);
  
  if (!userExists || !userAuthenticated) {
    return res.status(403).send('Forbidden, please enter a valid email and password.');
  }
  
  const id = userAuthenticated;

  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id', req.body.user_id);
  res.redirect('/urls');
});

// REGISTER ROUTES

app.get("/register", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  // error handling functions
  const badInput = validateInput(email, hashedPassword);
  const userExists = checkUserExists(users, email);


  if (badInput) {
    res.status(400).send('Bad Request, please enter a valid email and password.');
  } else if (userExists) {
    res.status(400).send('Bad Request, user already exists.');
  }

  users[id] = { id, email, password: hashedPassword };

  res.cookie('user_id', id);
  
  console.log(users);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});