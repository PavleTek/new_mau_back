const express = require("express");
const userService = require("./userService");
const centralService = require("./centralService");
const contSystem = require("./system/system.controller");
const cors = require("cors");
const { user } = require("./prisma");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use("/system", contSystem);

// Login Function

app.post("/users/authenticate", userService.login);

app.post("/users/register", async (req, res) => {
  try {
    const result = await userService.register(req, res);
    console.log(result);
    if (result.status === 200) {
      res.json({ status: result.status, data: result.data });
    } else {
      res.status(400).json({ status: result.status, data: result.data });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/users/password", userService.authenticate, async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  try {
    const result = await userService.changePassword(userId, oldPassword, newPassword);

    if (result.success) {
      res.json({ success: result.success, message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// User Related functions GET
app.get("/users/profile", userService.getUserFromToken, (req, res) => {
  // Access the user data
  const userData = req.user;

  // Send the user data as a response
  res.json(userData);
});

app.get("/users", async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Central Related functions GET
app.get("/centrals", userService.authenticate, async (req, res) => {
  try {
    const centrals = await centralService.getAllCentrals();
    res.setHeader("Content-Type", "application/json"); // Set the content type header
    res.status(200).json(centrals); // Send the JSON response
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/centrals/:id", userService.authenticate, async (req, res) => {
  try {
    const centralId = parseInt(req.params.id);
    const central = await centralService.getCentralById(centralId);
    if (!central) {
      res.status(404).json({ error: "Central not found" });
    } else {
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(central);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generator Related functions GET
app.get("/generators", userService.authenticate, async (req, res) => {
  try {
    const generators = await centralService.getAllGenerators();
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(generators);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/generators/:id", userService.authenticate, async (req, res) => {
  try {
    const generatorId = parseInt(req.params.id);
    const generator = await centralService.getGeneratorById(generatorId);
    if (!generator) {
      res.status(404).json({ error: "Generator not found" });
    } else {
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(generator);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// RAU Related functions GET
app.get("/rau", userService.authenticate, async (req, res) => {
  try {
    const raus = await centralService.getAllRAU();
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(raus);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/rau/:id", userService.authenticate, async (req, res) => {
  try {
    const rauId = parseInt(req.params.id);
    const rau = await centralService.getRAUById(rauId);
    if (!rau) {
      res.status(404).json({ error: "RAU not found" });
    } else {
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(rau);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/rau-detailed/:id", userService.authenticate, async (req, res) => {
  const rauId = parseInt(req.params.id);
  try {
    const rauWithDetails = await centralService.getRAUWithDetailsById(rauId);
    res.json(rauWithDetails);
  } catch (error) {
    res.status(500).json({ error: "Error fetching RAU details" });
  }
});

// Raw Data Related functions GET
app.get("/rawdata", userService.authenticate, async (req, res) => {
  try {
    const rawData = await centralService.getAllRawData();
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(rawData);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/rawdata/:id", userService.authenticate, async (req, res) => {
  try {
    const rawDataId = parseInt(req.params.id);
    const rawData = await centralService.getRawDataById(rawDataId);
    if (!rawData) {
      res.status(404).json({ error: "Raw Data not found" });
    } else {
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(rawData);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// RAU Type Related functions GET
app.get("/rautype", userService.authenticate, async (req, res) => {
  try {
    const rauTypes = await centralService.getAllRauTypes();
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(rauTypes);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/rautype/:id", userService.authenticate, async (req, res) => {
  try {
    const rauTypeId = parseInt(req.params.id);
    const rauType = await centralService.getRauTypeById(rauTypeId);
    if (!rauType) {
      res.status(404).json({ error: "RAU Type not found" });
    } else {
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(rauType);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Central Related functions POST PUT DELETE
app.post("/centrals", userService.authenticateAdmin, centralService.createCentral);
app.put("/centrals/:id", userService.authenticateAdmin, centralService.updateCentral);
app.delete("/centrals/:id", userService.authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10); // Convert to integer if it's a string
  try {
    const deletedRAU = await centralService.deleteCentralById(id);
    res.status(200).json({ message: "Successfully deleted", deletedRAU });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Generator Related functions POST PUT DELETE
app.post("/generators", userService.authenticateAdmin, centralService.createGenerator);
app.put("/generators/:id", userService.authenticateAdmin, centralService.updateGenerator);
app.delete("/generators/:id", userService.authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10); // Convert to integer if it's a string
  try {
    const deletedRAU = await centralService.deleteGeneratorById(id);
    res.status(200).json({ message: "Successfully deleted", deletedRAU });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// RAU Related functions POST PUT DELETE
app.post("/rau", userService.authenticateAdmin, centralService.createRAU);
app.put("/rau/:id", userService.authenticateAdmin, centralService.updateRAU);
app.delete("/rau/:id", userService.authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10); // Convert to integer if it's a string
  try {
    const deletedRAU = await centralService.deleteRAUById(id);
    res.status(200).json({ message: "Successfully deleted", deletedRAU });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Raw Data Related functions POST PUT DELETE
app.post("/rawdata", userService.authenticateAdmin, centralService.createRawData);
app.put("/rawdata/:id", userService.authenticateAdmin, centralService.updateRawData);
app.delete("/rawdata/:id", userService.authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10); // Convert to integer if it's a string
  try {
    const deletedRAU = await centralService.deleteRawDataById(id);
    res.status(200).json({ message: "Successfully deleted", deletedRAU });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// RAU Type Related functions POST PUT DELETE
app.post("/rautype", userService.authenticateAdmin, centralService.createRauType);
app.put("/rautype/:id", userService.authenticateAdmin, centralService.updateRauType);
app.delete("/rautype/:id", userService.authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10); // Convert to integer if it's a string
  try {
    const deletedRAU = await centralService.deleteRauTypeById(id);
    res.status(200).json({ message: "Successfully deleted", deletedRAU });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
