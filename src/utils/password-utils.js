const bcrypt = require('bcryptjs');

// Function to hash the password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Function to compare passwords without decrypting.
const comparePassword = async (enteredPassword, storedPassword) => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
