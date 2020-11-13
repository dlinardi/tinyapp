const bcrypt = require('bcrypt');

const generateRandomString = () => (Math.random().toString(36).substr(2, 6));

const validateInput = (email, password) => {
  if (email || password) {
    return false;
  }
  return true;
};

// checks if the email is already in the user database
const getUserByEmail = (userDB, email) => {
  for (const userID in userDB) {
    if (userDB[userID].email === email) {
      return userDB[userID];
    }
  }
  return false;
};

// authenticate user by checking if their email exists in the database,
// then by comparing the hashes of the password in the database and the
// password inputted through the form,
// returns a user
const authenticateUser = (userDB, email, password) => {
  const user = getUserByEmail(userDB, email);

  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }

  return false;
};

// returns an object of all the urls attached to a users account
const urlsForUser = (urlDB, id) => {
  let userURLs = {};
  for (const url in urlDB) {
    if (urlDB[url].userID === id) {
      userURLs[url] = {
        longURL: urlDB[url].longURL,
        userID: urlDB[url].userID
      };
    }
  }
  return userURLs;
};

// render an error template with custom message/status code
const renderError = (res, user_id, status, error) => {
  res.status(status);
  return res.render('error', { status, error, user_id });
};

module.exports = {
  generateRandomString,
  validateInput,
  getUserByEmail,
  authenticateUser,
  urlsForUser,
  renderError
};