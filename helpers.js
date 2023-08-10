//++++++FUNCTIONS+++++++

const urlsForUser = (id, urlDatabase) => {
  let userURLdata = {};
  for (const url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      userURLdata[url] = urlDatabase[url];
    }
  }
  return userURLdata;
};

//create a random 6 character string for short url
const getRandomString = (numOfChars) => {
  let randomCharsStr = '';
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < numOfChars; i++) {
    randomCharsStr += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }
  return randomCharsStr;
};

//create a function to look up if email already exist
const emailExists = (emailAddress, users) => { 
  for (const user in users) {
    if (emailAddress === users[user].email) {
      return true;
    }
  }
};

const getUserById = (id, users) => {
  const user = users[id];
  if (user) {
    return user;
  }
  return null;
};

const getUserByEmail = (email, users) => {
  for (const userID in users) {
    const user = users[userID];
    if (email === user.email) {
      return user;
    }
  }
  return null;
};

module.exports = { getUserByEmail, getUserById, urlsForUser, emailExists, getRandomString }; 