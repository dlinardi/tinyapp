const express = require('express');
const bodyParser = require('body-parser');
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

// url database with examples of shortURL data
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "aJ48lW" }
};

// users database with example user
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
    res.redirect("/urls");
  } else {
    res.redirect("/login");
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
  const { user_id } = req.session;
  const templateVars = { user_id: users[user_id] };

  if (user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }

});

app.get("/urls/:shortURL", (req, res) => {
  const user_id = users[req.session.user_id];
  const { shortURL } = req.params;

  // check if user is logged in
  if (user_id) {
    // check if shortURL exists, and then check if the user owns that shortURL
    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === user_id.id) {
      const templateVars = { user_id, shortURL, longURL: urlDatabase[shortURL].longURL };
      res.render("urls_show", templateVars);
    } else {
      renderError(res, user_id, 403, 'Forbidden, you do not have access to this URL.');
    }
  } else {
    renderError(res, user_id, 403, 'Forbidden, please login or register.');
  }
});

app.post("/urls/:shortURL/", (req, res) => {
  const { newURL } = req.body;
  const { shortURL } = req.params;
  const { user_id } = req.session;

  // only allow the owner to edit/update
  if (urlDatabase[shortURL].userID === user_id) {
    urlDatabase[shortURL] = { longURL: newURL, userID: user_id };
    res.redirect("/urls");
  } else {
    renderError(res, user_id, 403, 'Forbidden, you are not the creator of this short URL.');
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const user_id = users[req.session.user_id];

  // only allow the owner to delete
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    renderError(res, user_id, 403, 'Forbidden, you are not the creator of this short URL.');
  }
});

app.get("/u/:shortURL", (req, res) => {
  
  // checkc if the shortURL was created and exists in urlDatabase
  if (urlDatabase[req.params.shortURL] !== undefined) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    const user_id = req.session.user_id;
    renderError(res, user_id, 404, 'Not Found, the URL does not exist.');
  }

});

// END URL ROUTES

// REGISTER ROUTES

app.get("/register", (req, res) => {
  const user_id = users[req.session.user_id];
  if (user_id) {
    res.redirect("/urls");
  } else {
    res.render("register", { user_id });
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
    renderError(res, user_id, 400, 'Bad Request, please enter a valid email and password.');
  }

  if (!user) {
    users[id] = { id, email, password: hashedPassword };
    req.session.user_id = id;
    res.redirect("/urls");
  } else {
    const user_id = users[req.session.user_id];
    renderError(res, user_id, 400, 'Bad Request, user already exists.');
  }

});

// END REGISTER ROUTES

// LOGIN ROUTES

app.get("/login", (req, res) => {
  const user_id = users[req.session.user_id];
  if (user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { user_id };
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = authenticateUser(users, email, password);
  
  if (!user) {
    // user not registered
    const user_id = users[req.session.user_id];
    renderError(res, user_id, 403, 'Forbidden, please enter a valid email and password.');
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

// END LOGIN ROUTES

// LOGOUT ROUTE

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

// END LOGOUT ROUTE

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});