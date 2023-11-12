const prisma = require("./prisma/prisma.js");
const fs = require("fs");

// Get All, Get By ID, and Get Detailed Rau Functions
const getAll = async (modelName) => {
  try {
    const data = await prisma[modelName].findMany();
    return data;
  } catch (error) {
    throw error;
  }
};

const getById = async (modelName, id) => {
  try {
    const data = await prisma[modelName].findUnique({
      where: {
        id: id,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const deleteById = async (modelName, id) => {
  try {
    const data = await prisma[modelName].delete({
      where: {
        id: id,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const deleteRauWithRelatedRawData = async (rauId) => {
  try {
    const fs = require("fs");
    const filePath = `../workers/.raus/RAUS${rauId}.txt`; // Specify the file path

    // Delete the file if it exists (handle if it doesn't exist)
    try {
      fs.unlinkSync(filePath);
    } catch (fileError) {
      // Handle the error if the file doesn't exist (e.g., log it)
      console.error(`File deletion error (if exists): ${fileError.message}`);
    }

    // Start a Prisma transaction
    await prisma.$transaction([
      // Delete the related Tbl_RawData records
      prisma.tbl_RawData.deleteMany({
        where: {
          rau_id: rauId,
        },
      }),
      // Delete the Tbl_RAU record
      prisma.tbl_RAU.delete({
        where: {
          id: rauId,
        },
      }),
    ]);

    // The transaction was successful
    return true;
  } catch (error) {
    // Handle errors
    throw error;
  }
};

// Central Create Update Functions
const createCentral = async (req, res) => {
  const { cen_name, cen_address, cen_longitude, cen_latitude } = req.body;

  try {
    const newCentral = await prisma.Tbl_Centrals.create({
      data: {
        cen_name,
        cen_address,
        cen_longitude,
        cen_latitude,
      },
    });

    res.status(200).send(newCentral);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const updateCentral = async (req, res) => {
  const centralId = parseInt(req.params.id);
  const { cen_name, cen_address, cen_longitude, cen_latitude } = req.body;

  try {
    const updatedCentral = await prisma.Tbl_Centrals.update({
      where: {
        id: centralId,
      },
      data: {
        cen_name,
        cen_address,
        cen_longitude,
        cen_latitude,
      },
    });

    res.send(updatedCentral);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Create Update Generator Functions
const createGenerator = async (req, res) => {
  const {
    name,
    central_id,
    fn_prefix,
    freq_nominal,
    pelec_nominal,
    db_min,
    db_max,
    droop_min,
    droop_max,
    rise_time_min,
    rise_time_max,
    p_set_min,
    p_set_max,
    psetp_min_difference_pu,
    pearson_max,
  } = req.body;

  try {
    const newGenerator = await prisma.Tbl_Generators_1.create({
      data: {
        name,
        central_id,
        fn_prefix,
        freq_nominal,
        pelec_nominal,
        db_min,
        db_max,
        droop_min,
        droop_max,
        rise_time_min,
        rise_time_max,
        p_set_min,
        p_set_max,
        psetp_min_difference_pu,
        pearson_max,
      },
    });

    res.status(200).send(newGenerator);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const updateGenerator = async (req, res) => {
  const generatorId = parseInt(req.params.id);
  const {
    name,
    central_id,
    fn_prefix,
    freq_nominal,
    pelec_nominal,
    db_min,
    db_max,
    droop_min,
    droop_max,
    rise_time_min,
    rise_time_max,
    p_set_min,
    p_set_max,
    psetp_min_difference_pu,
    pearson_max,
  } = req.body;

  try {
    const updatedGenerator = await prisma.Tbl_Generators_1.update({
      where: {
        id: generatorId,
      },
      data: {
        name,
        central_id,
        fn_prefix,
        freq_nominal,
        pelec_nominal,
        db_min,
        db_max,
        droop_min,
        droop_max,
        rise_time_min,
        rise_time_max,
        p_set_min,
        p_set_max,
        psetp_min_difference_pu,
        pearson_max,
      },
    });

    res.send(updatedGenerator);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Create and Update RAU:
const createRAU = async (req, res) => {
  const { rau_type_id, gen_id, is_master, scale_factor_u, scale_factor_i, p_set_scale, p_set_offset, rau_conf } =
    req.body;

  try {
    const newRAU = await prisma.Tbl_RAU.create({
      data: {
        rau_type_id,
        gen_id,
        is_master,
        scale_factor_u,
        scale_factor_i,
        p_set_scale,
        p_set_offset,
        rau_conf,
      },
    });
    const filePath = `../workers/.raus/RAUS${newRAU.id}.txt`; // Specify the file path

    convertRauConfToTextFile(newRAU.id, rau_conf, filePath);

    res.status(200).send(newRAU);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const updateRAU = async (req, res) => {
  const rauId = parseInt(req.params.id);
  const { rau_type_id, gen_id, is_master, scale_factor_u, scale_factor_i, p_set_scale, p_set_offset, rau_conf } =
    req.body;

  try {
    const updatedRAU = await prisma.Tbl_RAU.update({
      where: {
        id: rauId,
      },
      data: {
        rau_type_id,
        gen_id,
        is_master,
        scale_factor_u,
        scale_factor_i,
        p_set_scale,
        p_set_offset,
        rau_conf,
      },
    });

    const filePath = `../workers/.raus/RAUS${rauId}.txt`; // Specify the file path

    convertRauConfToTextFile(rauId, rau_conf, filePath);

    res.send(updatedRAU);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

function convertRauConfToTextFile(rauId, jsonString, outputPath) {
  // Parse the JSON string
  const data = JSON.parse(jsonString);

  // Initialize fileContent
  let fileContent = "";

  // Add the RAU ID only if the 'ID' key is not present in the JSON
  console.log(rauId, " outside if");
  if (!data.hasOwnProperty("ID")) {
    console.log(rauId, " inside if");
    fileContent += `ID=${rauId}\n`;
  }

  // Always add the FILE_PREFIX line
  fileContent += `FILE_PREFIX=RAU${rauId}\n`;

  // Convert the object to a string with key-value pairs separated by '='
  for (const [key, value] of Object.entries(data)) {
    // Skip the empty key
    if (key !== "key") {
      if (key === "ID") {
        fileContent += `${key.toUpperCase()}=${rauId}\n`;
      } else {
        fileContent += `${key.toUpperCase()}=${value}\n`;
      }
    }
  }

  // Write to the text file
  fs.writeFile(outputPath, fileContent, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log(`Data written to ${outputPath}`);
    }
  });
}

function getRauConfValueJsonFromFile(inputPath) {
  try {
    // Read the content of the file synchronously
    const fileContent = fs.readFileSync(inputPath, "utf8");

    let data = {};
    // Split the file content by new lines and loop through each line
    const lines = fileContent.split("\n");
    for (let line of lines) {
      if (line && !line.startsWith("FILE_PREFIX")) {
        // Split each line by the '=' to get the key and value
        let [key, value] = line.split("=");
        if (key === "id" && !value) {
          // If 'ID' is empty, skip adding it to the object
          continue;
        } else if (key === "key") {
          // If 'key' is encountered, it should remain empty as per the original JSON structure
          value = "";
        }
        data[key] = value;
      }
    }

    // Convert the object to a JSON object
    return data;
  } catch (err) {
    console.error("Error reading the file:", err);
    throw err; // rethrow the error for the caller to handle
  }
}

// Create and update RawData and RAU Type

const createRawData = async (req, res) => {
  const {
    rau_id,
    timestamp,
    serial_number,
    status,
    est_freq,
    est_p,
    est_q,
    est_s,
    est_fi,
    est_fi_deg,
    est_pset,
    channel_raw,
  } = req.body;

  try {
    const newRawData = await prisma.Tbl_RawData.create({
      data: {
        rau_id,
        timestamp,
        serial_number,
        status,
        est_freq,
        est_p,
        est_q,
        est_s,
        est_fi,
        est_fi_deg,
        est_pset,
        channel_raw,
      },
    });

    res.status(200).send(newRawData);
  } catch (error) {
    res.status(500).send(error);
  }
};

const updateRawData = async (req, res) => {
  const rawDataId = parseInt(req.params.id);
  const {
    rau_id,
    timestamp,
    serial_number,
    status,
    est_freq,
    est_p,
    est_q,
    est_s,
    est_fi,
    est_fi_deg,
    est_pset,
    channel_raw,
  } = req.body;

  try {
    const updatedRawData = await prisma.Tbl_RawData.update({
      where: {
        id: rawDataId,
      },
      data: {
        rau_id,
        timestamp,
        serial_number,
        status,
        est_freq,
        est_p,
        est_q,
        est_s,
        est_fi,
        est_fi_deg,
        est_pset,
        channel_raw,
      },
    });

    res.send(updatedRawData);
  } catch (error) {
    res.status(500).send(error);
  }
};

const createRauType = async (req, res) => {
  const { type_name, type_description, conf_file } = req.body;

  try {
    const newRauType = await prisma.Tbl_Rau_Type.create({
      data: {
        type_name,
        type_description,
        conf_file,
      },
    });

    res.status(200).send(newRauType);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const updateRauType = async (req, res) => {
  const rauTypeId = parseInt(req.params.id);
  const { type_name, type_description, conf_file } = req.body;

  try {
    const updatedRauType = await prisma.Tbl_Rau_Type.update({
      where: {
        id: rauTypeId,
      },
      data: {
        type_name,
        type_description,
        conf_file,
      },
    });

    res.send(updatedRauType);
  } catch (error) {
    res.status(500).send(error);
  }
};

// RawData managmente and rau updates
async function updateRunningStatus(rauId) {
  const currentTimestamp = new Date();
  const tenSecondsAgo = new Date(currentTimestamp - 10000); // 10 seconds ago

  const mostRecentRawData = await prisma.tbl_RawData.findFirst({
    where: {
      rau_id: rauId,
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  if (!mostRecentRawData) {
    return;
  }

  const shouldRun = mostRecentRawData.timestamp > tenSecondsAgo;

  await prisma.tbl_RAU.update({
    where: {
      id: rauId,
    },
    data: {
      running: shouldRun,
    },
  });
}

async function updateRunningStatusForAllRAUs() {
  const allRAUs = await prisma.tbl_RAU.findMany();

  for (const rau of allRAUs) {
    await updateRunningStatus(rau.id);
  }
}

const getRAUById = async (id, res) => {
  try {
    var data = await prisma["Tbl_RAU"].findUnique({
      where: {
        id: id,
      },
    });

    if (data) {
      var inputTextConfig;
      try {
        const rauConfValuesJson = getRauConfValueJsonFromFile(`../workers/.raus/RAUS${id}.txt`);
        data["config_values_json"] = rauConfValuesJson;
      } catch (err) {
        if (err.code === "ENOENT") {
          console.log("Error Rau File Not found");
        } else {
          console.log("Error Something happened with the RAU file");
        }
      }
    }
    return data;
  } catch (error) {
    res.status(500).send(error);
  }
};

const getRAUsByGenId = async (genId) => {
  try {
    const data = await prisma["Tbl_RAU"].findMany({
      where: {
        gen_id: genId,
      },
    });

    return data;
  } catch (error) {
    throw error;
  }
};

const getAllRauTypes = async (res) => {
  try {
    var data = await prisma["Tbl_Rau_Type"].findMany();
    return data;
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = {
  getAllCentrals: () => getAll("Tbl_Centrals"),
  getCentralById: (id) => getById("Tbl_Centrals", id),
  createCentral: createCentral,
  updateCentral: updateCentral,
  deleteCentralById: (id) => deleteById("Tbl_Centrals", id),

  getAllGenerators: () => getAll("Tbl_Generators_1"),
  getGeneratorById: (id) => getById("Tbl_Generators_1", id),
  createGenerator: createGenerator,
  updateGenerator: updateGenerator,
  deleteGeneratorById: (id) => deleteById("Tbl_Generators_1", id),

  getAllRAU: () => getAll("Tbl_RAU"),
  getRAUById: (id) => getRAUById(id),
  getRAUsByGenId: (id) => getRAUsByGenId(id),
  getRAUWithDetailsById: (id) => getRAUWithDetailsById(id),
  createRAU: createRAU,
  updateRAU: updateRAU,
  deleteRAUById: (id) => deleteRauWithRelatedRawData(id),

  getAllRawData: () => getAll("Tbl_RawData"),
  getRawDataById: (id) => getById("Tbl_RawData", id),
  createRawData: createRawData,
  updateRawData: updateRawData,
  deleteRawDataById: (id) => deleteById("Tbl_RawData", id),

  getAllRauTypes: getAllRauTypes,
  getRauTypeById: (id) => getById("Tbl_Rau_Type", id),
  createRauType: createRauType,
  updateRauType: updateRauType,
  deleteRauTypeById: (id) => deleteById("Tbl_Rau_Type", id),

  updateRunningStatus: (id) => updateRunningStatus(id),
  updateRunningStatusForAllRAUs: () => updateRunningStatusForAllRAUs(),
};
