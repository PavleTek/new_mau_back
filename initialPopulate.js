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

// register Users
const registerUsers = async () => {
  await registerUser("Pavle", true, true, "admin", "admin");
  await registerUser("Pavle", false, true, "user", "user");
};

const authenticate = async () => {
  try {
    const response = await axios.post("http://localhost:3000/users/authenticate", {
      username: "admin",
      password: "admin",
    });
    return response.data.token;
  } catch (error) {
    console.error("Authentication failed:", error.response.data);
    return null;
  }
};

const createCentral = async (token, cenName, cenAddres, cenLongitude, cenLatitude) => {
  try {
    const response = await axios.post(
      "http://localhost:3000/centrals",
      {
        CenName: cenName,
        CenAddres: cenAddres,
        CenLongitude: cenLongitude,
        CenLatitude: cenLatitude,
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    // console.log("Central created:", response.data);
  } catch (error) {
    console.error("Error creating central:", error.response.data);
  }
};

//   centrals
const createCentrals = async () => {
  const token = await authenticate();
  if (token) {
    await createCentral(token, "Central1", "Address1", 0.12345, 0.66);
    await createCentral(token, "Central2", "Address2", 0.54321, 0.77);
    await createCentral(token, "Central3", "Address3", 0.10045, 0.82);
  }
};

const createRauType = async (token, typeName, typeDescription, conf_file) => {
  try {
    const response = await axios.post(
      "http://localhost:3000/rautype",
      {
        type_name: typeName,
        type_description: typeDescription,
        conf_file: conf_file,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("rauType Created");
  } catch (error) {
    console.error("Error creating Rau Type:", error);
  }
};

// rau types
const createBasicRauTypes = async () => {
  const token = await authenticate();
  if (token) {
    await createRauType(token, "RAU 3000", "Physical Rau description", "JSON To Be implemented");
    await createRauType(token, "RAU V2", "Physical Rau description", "JSON To Be implemented");
    await createRauType(token, "Virtual", "Virtual Rau", "JSON To Be implemented");
  }
};

await registerUsers();
await createCentrals();
await createBasicRauTypes();