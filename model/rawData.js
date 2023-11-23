import { query } from "../db.js";

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

export async function getTenMostRecentRawData(rauId) {
  // The timestamp condition is removed to fetch the 10 most recent elements

  const rawData = await query(
    `
      SELECT *
      FROM raus.Tbl_RawData
      WHERE rau_id = ?
      ORDER BY timestamp DESC
      LIMIT 10
    `,
    [rauId]
  );

  return rawData;
}

export async function isRauRunning(rauId) {
  const currentDateTime = new Date();
  const tenSecondsAgo = new Date(currentDateTime.getTime() - 10000); // 10 seconds ago

  // Fetch the most recent raw data entry
  const rawData = await query(
    `
      SELECT *
      FROM raus.Tbl_RawData
      WHERE rau_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `,
    [rauId]
  );

  if (rawData.length === 0) {
    // No data found
    return false;
  }

  // Check if the most recent entry is within the last 10 seconds
  const mostRecentDataTimestamp = new Date(rawData[0].timestamp);
  return mostRecentDataTimestamp > tenSecondsAgo;
}

export async function getRawDataLastMinuteAveragesByRAUId(rauId) {
  try {
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    // Format the date to a SQL-friendly format
    const formatSQLDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");

    const rawData = await query(
      `
        SELECT *
        FROM raus.Tbl_RawData
        WHERE rau_id = ?
          AND timestamp >= ?
        ORDER BY timestamp ASC
      `,
      [rauId, formatSQLDate(oneMinuteAgo)]
    );

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

export async function getRawDataLast10MinutesAveragesByRAUId(rauId) {
  try {
    const now = new Date();
    let minuteAverages = [];

    for (let i = 10; i > 0; i--) {
      const startTime = new Date(now.getTime() - i * 60 * 1000);
      const endTime = new Date(now.getTime() - (i - 1) * 60 * 1000);

      // Format the dates to a SQL-friendly format
      const formatSQLDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");

      const rawDataForMinute = await query(
        `
          SELECT *
          FROM raus.Tbl_RawData
          WHERE rau_id = ?
            AND timestamp >= ?
            AND timestamp < ?
          ORDER BY timestamp DESC
        `,
        [rauId, formatSQLDate(startTime), formatSQLDate(endTime)]
      );

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
