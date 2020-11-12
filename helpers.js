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

const fetchUser = (userDB, email) => {
  for (const userID in userDB) {
    if (userDB[userID].email === email) {
      return userDB[userID];
    }
  }
  return false;
};

const authenticateUser = (userDB, email, password) => {

  const user = fetchUser(userDB, email);

  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  } else {
    return false;
  }
  
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
  fetchUser,
  authenticateUser,
  urlsForUser
};