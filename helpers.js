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

module.exports = { generateRandomString, validateInput, checkUserExists };