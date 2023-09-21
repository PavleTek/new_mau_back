const axios = require("axios");

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

const createCentrals = async () => {
  const token = await authenticate();
  if (token) {
    await createCentral(token, "Central1", "Address1", 0.12345, 0.66);
    await createCentral(token, "Central2", "Address2", 0.54321, 0.77);
    await createCentral(token, "Central3", "Address3", 0.10045, 0.82);
  }
};

const createGenerator = async (
  token,
  name,
  central_id,
  fnPrefix,
  freqNominal,
  pelecNominal,
  dbMin,
  dbMax,
  droopMax,
  droopMin,
  riseTimeMax,
  riseTimeMin,
  pSetMin,
  pSetMax,
  psetpMinDifferencePu,
  pearsonMax
) => {
  try {
    const response = await axios.post(
      "http://localhost:3000/generators",
      {
        name: name,
        central_id: central_id,
        fn_prefix: fnPrefix,
        freq_nominal: freqNominal,
        pelec_nominal: pelecNominal,
        db_min: dbMin,
        db_max: dbMax,
        droop_min: droopMin,
        droop_max: droopMax,
        rise_time_min: riseTimeMin,
        rise_time_max: riseTimeMax,
        p_set_min: pSetMin,
        p_set_max: pSetMax,
        psetp_min_difference_pu: psetpMinDifferencePu,
        pearson_max: pearsonMax,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log("Generator created:", response.data);
  } catch (error) {
    console.error("Error creating generator:", error.response.data);
  }
};

const createGenerators = async () => {
  const token = await authenticate();
  if (token) {
    await createGenerator(
      token,
      "Generator1",
      1, // central_id
      "Prefix1",
      50,
      100,
      0,
      100,
      1,
      0.5,
      0.2,
      0.1,
      0,
      200,
      0.02,
      0.5
    );

    await createGenerator(
      token,
      "Generator2",
      1, //  central_id
      "Prefix2",
      50,
      100,
      0,
      100,
      1,
      0.5,
      0.2,
      0.1,
      0,
      200,
      0.02,
      0.5
    );

    await createGenerator(
      token,
      "Generator3",
      2, // Replace with the actual central_id
      "Prefix1",
      5230,
      100,
      0,
      105190,
      1,
      0.512,
      0.212,
      0.1,
      0,
      200,
      0.02,
      0.5121
    );

    await createGenerator(
      token,
      "Generator4",
      2, // Replace with the actual central_id
      "Prefix2",
      50,
      123400,
      0,
      102340,
      1,
      0.5,
      0.2,
      0.1123,
      0,
      200,
      0.02,
      0.5515
    );
  }
};

createGenerators();
