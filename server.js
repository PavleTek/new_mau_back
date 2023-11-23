import rootpath from "rootpath";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

rootpath();
const app = express();

import { initTasks } from "./model/task.js";

import { APP_HTTP_PORT } from "./config.js";
import { jwt } from "./utils.js";
import errorHandler from "./error-handler.js";
import contRAU from "./controlers/rau.js";
import contUser from "./controlers/user.js";
import contRAUType from "./controlers/rau_type.js";
import contGenerator from "./controlers/generator.js";
import contCentral from "./controlers/central.js";
import contTask from "./controlers/task.js";
import contSystem from "./controlers/system.js";
import { getSamples, listHiResFiles, getHiResFilePath } from "./model/samples.js";
import { getTenMostRecentRawData, getRawDataLast10MinutesAveragesByRAUId, getRawDataLastMinuteAveragesByRAUId, isRauRunning } from "./model/rawData.js";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(jwt());
app.use("/rau", contRAU);
app.use("/users", contUser);
app.use("/rautype", contRAUType);
app.use("/generators", contGenerator);
app.use("/centrals", contCentral);
app.use("/tasks", contTask);
app.use("/system", contSystem);
app.get("/api/download/:fileName", async (req, res) => {
  const fileName = req.params.fileName;
  try {
    const filePath = await getHiResFilePath(fileName);

    if (!filePath) {
      return res.status(404).json({ error: "File not found" });
    }

    // Stream the file for download
    res.download(filePath, fileName);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/files", (req, res, next) => {
  listHiResFiles()
    .then((files) => res.json({ files }))
    .catch(next);
});
app.get("/last-ten-entries-by-rau/:id", (req, res, next) => {
  getTenMostRecentRawData(parseInt(req.params.id))
    .then((rau) => res.json(rau))
    .catch(next);
});
app.get("/is-rau-running/:id", (req, res, next) => {
  isRauRunning(parseInt(req.params.id))
    .then((user) => res.json(user))
    .catch(next);
});
app.get("/last-ten-minutes-averages-by-rau/:id", (req, res, next) => {
  getRawDataLast10MinutesAveragesByRAUId(parseInt(req.params.id))
    .then((user) => res.json(user))
    .catch(next);
});
app.get("/last-minute-average-by-rau/:id", (req, res, next) => {
  getRawDataLastMinuteAveragesByRAUId(parseInt(req.params.id))
    .then((user) => res.json(user))
    .catch(next);
});
app.get("/rawdata/:id?", (req, res, next) => {
  getSamples(parseInt(req.params.id))
    .then((user) => res.json(user))
    .catch(next);
});
app.use(errorHandler);

const server = app.listen(APP_HTTP_PORT, () => {
  console.log(`Server listening on port ${APP_HTTP_PORT}`);
  initTasks();
});
