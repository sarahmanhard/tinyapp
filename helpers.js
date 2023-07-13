// Generates a random string of length 6
const generateRandomString = () => {
  const alphanumeric = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  }
  return result;
};

// Finds the user object by email in the users database
const getUserByEmail = (email, database) => {
  for (let userId in database) {
    if (email === database[userId].email) {
      return database[userId];
    }
  }
  return undefined;
};

// Returns the user ID by email
const getUserIdByEmail = (email, database) => {
  for (let userId in database) {
    if (email === database[userId].email) {
      return userId;
    }
  }
  return undefined;
};

// Returns an object containing URLs that belong to a specific user
const getUrlsForUser = (userId, database) => {
  const userUrls = {};
  for (let shortUrl in database) {
    if (userId === database[shortUrl].userId) {
      userUrls[shortUrl] = database[shortUrl];
    }
  }
  return userUrls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  getUserIdByEmail,
  getUrlsForUser
};




