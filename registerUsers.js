const axios = require("axios");

const registerUser = async (name, is_admin, mandatory, username, password) => {
  try {
    const response = await axios.post("http://localhost:3000/users/register", {
      name,
      is_admin,
      mandatory,
      username,
      password,
    });
    console.log("User registered:", response.data);
  } catch (error) {
    console.error("Error registering user:", error);
  }
};

const registerUsers = async () => {
  await registerUser("Pavle", true, true, "pavle", "pavle");
};

registerUsers();
