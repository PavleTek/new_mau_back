const prisma = require("./prisma/prisma.js");
const fs = require("fs");
const path = require("path");

function getZeroAverages() {
  return {
    est_freq: 0,
    est_p: 0,
    est_q: 0,
    est_s: 0,
    est_fi: 0,
    est_fi_deg: 0,
    est_pset: 0,
  };
}

async function getRawDataLast10MinutesAveragesByRAUId(rauId) {
  try {
    const now = new Date();
    let minuteAverages = [];

    for (let i = 10; i > 0; i--) {
      const startTime = new Date(now.getTime() - i * 60 * 1000);
      const endTime = new Date(now.getTime() - (i - 1) * 60 * 1000);

      const rawDataForMinute = await prisma.tbl_RawData.findMany({
        where: {
          rau_id: rauId,
          timestamp: {
            gte: startTime,
            lt: endTime,
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      let minuteAverage;
      if (rawDataForMinute.length === 0) {
        minuteAverage = getZeroAverages();
      } else {
        minuteAverage = getMinuteAverageFromRawData(rawDataForMinute);
      }

      minuteAverages.push({
        time: `${i} minutes ago to ${i - 1} minutes ago`,
        average: minuteAverage,
      });
    }

    return minuteAverages;
  } catch (error) {
    console.error("Error retrieving RawData:", error);
    throw error;
  }
}

function calculateAverage(valuesArray) {
  const sum = valuesArray.reduce((acc, value) => acc + value, 0);
  const divisor = valuesArray.length > 60 ? valuesArray.length : 60;
  const average = sum / divisor;
  return parseFloat(average.toFixed(3));
}

function getMinuteAverageFromRawData(rawDataArray) {
  const averages = {};
  if (rawDataArray.length) {
    const keys = ["est_freq", "est_p", "est_q", "est_s", "est_fi", "est_fi_deg", "est_pset"];

    keys.forEach((key) => {
      const valuesArray = rawDataArray.map((element) => element[key]);
      averages[key] = calculateAverage(valuesArray);
    });
  }

  return averages;
}

async function getRawDataLastMinuteAveragesByRAUId(rauId) {
  try {
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const rawData = await prisma.tbl_RawData.findMany({
      where: {
        rau_id: rauId,
        timestamp: {
          gte: oneMinuteAgo,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });
    if (rawData.length === 0) {
      return getZeroAverages();
    }

    // Use getMinuteAverageFromRawData to calculate the averages
    const averages = getMinuteAverageFromRawData(rawData);

    return averages; // This now returns the entire average object
  } catch (error) {
    console.error("Error retrieving RawData:", error);
    throw error;
  }
}

async function getTenMostRecentRawData(rauId) {
  const currentDateTime = new Date();
  const tenSecondsAgo = new Date(currentDateTime.getTime() - 10000); // Calculate 10 seconds ago

  const rawData = await prisma.tbl_RawData.findMany({
    where: {
      rau_id: rauId,
      timestamp: {
        gte: tenSecondsAgo, // Filter for timestamps greater than or equal to tenSecondsAgo
        lte: currentDateTime, // Filter for timestamps less than or equal to currentDateTime
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 10,
  });

  return rawData;
}

// download files part
const folderPath = "../workers/hires"; // Replace with your folder path

async function listFiles() {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        return reject(err);
      }
      resolve(files);
    });
  });
}

async function getFilePath(fileName) {
  const filePath = path.join(folderPath, fileName);

  return new Promise((resolve, reject) => {
    fs.exists(filePath, (exists) => {
      if (exists) {
        resolve(filePath);
      } else {
        resolve(null); // File not found
      }
    });
  });
}

module.exports = {
  getTenMostRecentRawData: (id) => getTenMostRecentRawData(id),
  getRawDataLast10MinutesAveragesByRAUId: (id) => getRawDataLast10MinutesAveragesByRAUId(id),
  getRawDataLastMinuteAveragesByRAUId: (id) => getRawDataLastMinuteAveragesByRAUId(id),
  listFiles: () => listFiles(),
  getFilePath: (fileName) => getFilePath(fileName),
};
