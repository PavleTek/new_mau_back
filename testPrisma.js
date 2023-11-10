const axios = require("axios");
const prisma = require("./prisma/prisma.js");

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
        cen_name: cenName,
        cen_address: cenAddres,
        cen_longitude: cenLongitude,
        cen_latitude: cenLatitude,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("centrals created");
  } catch (error) {
    console.error("Error creating central:", error.response.data, error.messsage);
  }
};

const editExistingCentral = async (token, centralId, cenName, cenAddres, cenLongitude, cenLatitude) => {
  try {
    const response = await axios.put(
      `http://localhost:3000/centrals/${centralId}`,
      {
        cen_name: cenName,
        cen_address: cenAddres,
        cen_longitude: cenLongitude,
        cen_latitude: cenLatitude,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log("Central created:", response);
  } catch (error) {
    console.error("Error editing Central central:", error.response.data, error.messsage);
  }
};

const createCompleteRau = async (
  token,
  rau_type_id,
  gen_id,
  is_master,
  scale_factor_u,
  scale_factor_i,
  p_set_scale,
  p_set_offset,
  rau_conf,
  // Raw Details Part
  serial_number,
  status,
  est_freq,
  est_p,
  est_q,
  est_s,
  est_fi,
  est_fi_deg,
  est_pset,
  channel_raw
) => {
  try {
    const rauResponse = await axios.post(
      "http://localhost:3000/rau",
      {
        rau_type_id: rau_type_id,
        gen_id: gen_id,
        is_master: is_master,
        scale_factor_u: scale_factor_u,
        scale_factor_i: scale_factor_i,
        p_set_scale: p_set_scale,
        p_set_offset: p_set_offset,
        rau_conf: rau_conf,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const rauId = rauResponse.data.id;
    currentTimeStamp = new Date();
    console.log(rauId);

    const rawDatasResponse = await axios.post(
      "http://localhost:3000/rawdata",
      {
        rau_id: rauId,
        timestamp: currentTimeStamp,
        serial_number: serial_number,
        status: status,
        est_freq: est_freq,
        est_p: est_p,
        est_q: est_q,
        est_s: est_s,
        est_fi: est_fi,
        est_fi_deg: est_fi_deg,
        est_pset: est_pset,
        channel_raw: channel_raw,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return rawDatasResponse;
  } catch (error) {
    console.error("Error creating complete Rau:", error);
  }
};

const createBasicRauTypes = async () => {
  const token = await authenticate();
  if (token) {
    await createRauType(token, "Physical Main", "Rau Fisico que mide todo menos pset", "");
    await createRauType(token, "Physical Secondary", "Rau Fisico que mide solo PSet", "");
    await createRauType(token, "Virtual", "Rau Virtual, mide todo", "");
  }
};

const createCentrals = async () => {
  const token = await authenticate();
  if (token) {
    await createCentral(token, "Central1", "Adress1", 0.5, 0.619);
    await createCentral(token, "Central2", "Adress2", 0.5, 0.619);
    await createCentral(token, "TestCentral", "home", 0.5, 0.619);
    await createCentral(token, "thecentral", "faraway", 0.5, 0.619);
  }
};

const testCreateCompleteRau = async () => {
  const token = await authenticate();
  if (token) {
    console.log(token);
    createCompleteRau(
      token,
      10,
      undefined,
      false,
      0,
      0,
      0,
      0,
      "emptyconf",
      "SerialNUmberRawData",
      "Some Raw Data Status",
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      "ChanellRawThing"
    );
  }
};

const testEditingCentral = async () => {
  const token = await authenticate();
  editExistingCentral(token, 5, "ChangedNameByEditing", "NewEditedAddress", 0, 2);
};

const logToken = async () => {
  console.log("running");
  const token = await authenticate();
  console.log(token);
};

const logRauTypes = async () => {
  var data = await prisma["Tbl_Rau_Type"].findMany();
  console.log(data);
};

const createRauType = async () => {
  const type_name = "KRAFTTEX300";
  const type_description = "Description test";
  const conf_file =
    '{"ID": "^[1-9]\\\\d*$", "IP": "^((\\\\d|[1-9]\\\\d|1\\\\d{2}|2[0-4]\\\\d|25[0-5])\\\\.){3}(\\\\d|[1-9]\\\\d|1\\\\d{2}|2[0-4]\\\\d|25[0-5])$", "PORT": "^[1-9]\\\\d*$", "ENABLED": "^[01]$", "SAVE_OSCILLOGRAPHY": "^[01]$", "EST_PSET_CHANNEL_NUMBER": "^[37]$", "C_KOEF[1]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "C_KOEF[2]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "C_KOEF[3]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "C_KOEF[4]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "C_KOEF[5]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "C_KOEF[6]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "C_KOEF[7]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "C_KOEF[8]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "C_CONS[I]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "C_CONS[U]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "SCALE_FACTOR[I]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "SCALE_FACTOR[U]": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "P_SET_SCALE": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "P_SET_OFFSET": "^[+-]?(\\\\d*\\\\.\\\\d+|\\\\d+\\\\.\\\\d*|\\\\d+)$", "LOG_TIME_PERIOD": "^[1-9]\\\\d*$"}';

  const newRauType = await prisma.Tbl_Rau_Type.create({
    data: {
      type_name,
      type_description,
      conf_file,
    },
  });
};

const deleteRauTypes = async () => {
  // Delete the entity with id 10
  await prisma.Tbl_Rau_Type.delete({
    where: {
      id: 10,
    },
  });

  // Delete the entity with id 11
  await prisma.Tbl_Rau_Type.delete({
    where: {
      id: 11,
    },
  });
};

logRauTypes();
