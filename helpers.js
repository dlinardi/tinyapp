const bcrypt = require('bcrypt');

const generateRandomString = () => (Math.random().toString(36).substr(2, 6));

const validateInput = (email, password) => {
  if (email || password) {
    return false;
  }
  return true;
};

const getUserByEmail = (userDB, email) => {
  for (const userID in userDB) {
    if (userDB[userID].email === email) {
      return userDB[userID];
    }
  }
  return false;
};

const authenticateUser = (userDB, email, password) => {
  const user = getUserByEmail(userDB, email);

  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }

  return false;
};

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

// comment about this
const renderError = (res, user_id, status, error) => {
  res.status(status);
  return res.render('error', { status, error, user_id });
}

module.exports = {
  generateRandomString,
  validateInput,
  getUserByEmail,
  authenticateUser,
  urlsForUser,
  renderError
};