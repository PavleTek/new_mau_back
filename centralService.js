const prisma = require("./prisma.js");

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

const getRAUWithDetailsById = async (rauId) => {
  try {
    console.log("rau with details start");
    const rauWithDetails = await prisma.Tbl_RAU.findUnique({
      where: {
        id: rauId,
      },
      include: {
        Tbl_RawData: true,
        Tbl_Rau_Type: true,
      },
    });

    if (!rauWithDetails) {
      console.log(404);
      throw new Error("RAU not found");
    } else {
      console.log("worked");
      return rauWithDetails;
    }
  } catch (error) {
    console.log(500);
    throw new Error("Error fetching RAU details");
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

    res.status(200).send(newRAU);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const updateRAU = async (req, res) => {
  console.log("update rau is running");
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

    console.log(updatedRAU);
    res.send(updatedRAU);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

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
  getRAUById: (id) => getById("Tbl_RAU", id),
  getRAUWithDetailsById: (id) => getRAUWithDetailsById(id),
  createRAU: createRAU,
  updateRAU: updateRAU,
  deleteRAUById: (id) => deleteRauWithRelatedRawData(id),

  getAllRawData: () => getAll("Tbl_RawData"),
  getRawDataById: (id) => getById("Tbl_RawData", id),
  createRawData: createRawData,
  updateRawData: updateRawData,
  deleteRawDataById: (id) => deleteById("Tbl_RawData", id),

  getAllRauTypes: () => getAll("Tbl_Rau_Type"),
  getRauTypeById: (id) => getById("Tbl_Rau_Type", id),
  createRauType: createRauType,
  updateRauType: updateRauType,
  deleteRauTypeById: (id) => deleteById("Tbl_Rau_Type", id),
};
