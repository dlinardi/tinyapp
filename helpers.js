const bcrypt = require('bcrypt');

const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

const validateInput = (email, password) => {
  if (email === '' || password === '') {
    return true;
  }
  return false;
};

const checkUserExists = (userDB, email) => {
  for (const id in userDB) {
    if (userDB[id].email === email) {
      return true;
    }
  }
  return false;
};

const authenticateUser = (userDB, password) => {
  for (const id in userDB) {
    if (bcrypt.compareSync(password, userDB[id].password)) {
      return id;
    }
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

module.exports = {
  generateRandomString,
  validateInput,
  checkUserExists,
  authenticateUser,
  urlsForUser
};