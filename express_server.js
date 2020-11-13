const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const {
  generateRandomString,
  validateInput,
  getUserByEmail,
  authenticateUser,
  urlsForUser,
  renderError
} = require('./helpers');
  
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
    password: bcrypt.hashSync("i-like-turtles", 10)
  }
};

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  const { user_id } = req.session;

  if (user_id) {
    res.redirect('/urls')
  } else {
    res.redirect('/login')
  }
});

// URL ROUTES

app.get("/urls", (req, res) => {
  const { user_id: id } = req.session;

  // returns an object with longURL and userID
  const usersURLs = urlsForUser(urlDatabase, id);

  const templateVars = { user_id: users[req.session.user_id], urls: usersURLs };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const { user_id } = req.session;

  if (user_id) {
    urlDatabase[shortURL] = { longURL, userID: user_id };
  }

  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = { user_id: users[user_id] };

  if (user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }

});

app.get("/urls/:shortURL", (req, res) => {
  const user_id = users[req.session.user_id];

  if (urlDatabase[req.params.shortURL]) {
    const templateVars = { user_id, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
    res.render("urls_show", templateVars);
  } else {
    const status = 403;
    const error = 'Forbidden, the URL does not exist.';
    renderError(res, user_id, status, error);
  }
});

app.post("/urls/:shortURL/", (req, res) => {
  const newURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  const user_id = req.session.user_id;

  if (urlDatabase[shortURL].userID === user_id) {
    urlDatabase[shortURL] = { longURL: newURL, userID: user_id };
    res.redirect("/urls");
  } else {
    const status = 403;
    const error = 'Forbidden, you are not the creator of this short URL.';
    renderError(res, user_id, status, error);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const user_id = users[req.session.user_id];

  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    const status = 403;
    const error = 'Forbidden, you are not the creator of this short URL.';
    renderError(res, user_id, status, error);
  }
});

app.get("/u/:shortURL", (req, res) => {
  
  if (urlDatabase[req.params.shortURL] !== undefined) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    const user_id = req.session.user_id;
    const status = 404;
    const error = 'Not Found, the URL does not exist.';
    renderError(res, user_id, status, error);
  }

});

// LOGIN ROUTES

app.get("/login", (req, res) => {
  const user_id = users[req.session.user_id];
  if(user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { user_id };
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  const user = authenticateUser(users, email, password);
  
  if (!user) {
    const user_id = users[req.session.user_id];
    const status = 403;
    const error = 'Forbidden, please enter a valid email and password.';
    renderError(res, user_id, status, error);
  }
  
  req.session.user_id = user.id;
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
});

// REGISTER ROUTES

app.get("/register", (req, res) => {
  const user_id = users[req.session.user_id];
  if (user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { user_id };
    res.render("register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;

  const badInput = validateInput(email, password);
  const user = getUserByEmail(users, email);
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (badInput) {
    const user_id = users[req.session.user_id];
    const status = 400;
    const error = 'Bad Request, please enter a valid email and password.';
    renderError(res, user_id, status, error);
  }

  if (!user) {
    users[id] = { id, email, password: hashedPassword };
    req.session.user_id = id;
    res.redirect('/urls');
  } else {
    const user_id = users[req.session.user_id];
    const status = 400;
    const error = 'Bad Request, user already exists.';
    renderError(res, user_id, status, error);
  }

});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});