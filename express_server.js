const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { generateRandomString, validateInput, checkUserExists } = require('./helpers')

const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});

// update url
app.post("/urls/:shortURL/", (req, res) => {
  const newURL = req.body.newURL;
  urlDatabase[req.params.shortURL] = newURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };

  if (urlDatabase[req.params.shortURL]) {
    res.render("urls_show", templateVars);
  } else {
    res.send("That URL doesn't exit.");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// LOGIN ROUTES

// app.post("/login", (req, res) => {
//   console.log('New user:', req.body.username);
//   res.cookie('username', req.body.username);
//   res.redirect('/urls')
// });

app.post("/logout", (req, res) => {
  res.clearCookie('user_id', req.body.user_id);
  res.redirect('/urls')
});

// REGISTER ROUTES

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;

  // error handling functions
  const badInput = validateInput(email, password);
  const userExists = checkUserExists(users, email);

  if (badInput) {
    res.sendStatus(400);
  } else if (userExists) {
    res.sendStatus(400);
  } else {
    users[id] = id;
    users[id] = { id, email, password};  
  
    console.log(users);
    res.cookie('user_id', id);
    
    res.redirect('/urls')
  }
});
  
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});