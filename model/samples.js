import * as fs from "fs";

import { query } from "../db.js";
import { SAMPLES_DIR_HIRES } from "../config.js";

export const processSamples = (t_from, t_to) =>
  query(
    `INSERT INTO Tbl_ProcessedData(id_m, id_s, rau_id_m, rau_id_s, ts, f, p, q, p_set, gen_id, fn_prefix)
WITH samples_master AS (
SELECT s.id,
       s.est_freq  AS f,
       s.est_p     AS p,
       s.est_q     AS q,
       s.est_pset AS p_set,
       u.gen_id,
       s.rau_id,
       ROW_NUMBER() OVER (PARTITION BY u.gen_id ORDER BY s.timestamp) AS ordnmb
  FROM raus.Tbl_RawData s
       INNER JOIN raus.Tbl_RAU u ON s.rau_id = u.id
 WHERE s.timestamp BETWEEN ? AND ?
   AND u.is_master
), samples_slave AS (
SELECT s.id,
       s.est_pset  AS p_set,
       u.gen_id,
       s.rau_id,
       ROW_NUMBER() OVER (PARTITION BY u.gen_id ORDER BY s.timestamp) AS ordnmb
  FROM raus.Tbl_RawData s
       INNER JOIN raus.Tbl_RAU u ON s.rau_id = u.id
 WHERE s.timestamp BETWEEN ? AND ?
   AND NOT u.is_master
)
SELECT m.id     AS id_m,
       coalesce(s.id, m.id)     AS id_s,
       m.rau_id AS rau_id_m,
       coalesce(s.rau_id, m.rau_id) AS rau_id_s,
       ? + INTERVAL (m.ordnmb - 1) SECOND AS ts,
       m.f,
       m.p,
       m.q,
       coalesce(s.p_set, m.p_set) AS p_set,
       m.gen_id,
       g.fn_prefix
  FROM samples_master m
       LEFT OUTER JOIN samples_slave s ON m.ordnmb = s.ordnmb AND m.gen_id = s.gen_id
            INNER JOIN Tbl_Generators_1 g ON m.gen_id = g.id
ORDER BY m.ordnmb
RETURNING concat(fn_prefix, '_', date_format(?, '%Y%m%d_%H%i'), '.csv') AS fname,
          date_format(ts, '%Y%m%d-%H:%i:%s')                            AS moment,
          f                                                             AS frequency,
          p                                                             AS power,
          p_set                                                         AS ref_power;`,
    [t_from, t_to, t_from, t_to, t_from, t_from]
  );

export const samplesCleanup = (secs) =>
  query(`DELETE FROM Tbl_ProcessedData WHERE ts < now() - INTERVAL ? SECOND;`, [secs]).then((res1) =>
    query(`DELETE FROM Tbl_RawData WHERE timestamp < now() - INTERVAL ? SECOND;`, [secs]).then((res2) => ({
      raw: res2.affectedRows,
      processed: res1.affectedRows,
    }))
  );

export const getSamples = (id = null) =>
  id
    ? query(
        `SELECT id, rau_id, timestamp, serial_number, status, est_freq, est_p, est_q, est_s, est_fi, est_fi_deg, est_pset, channel_raw, processed FROM raus.Tbl_RawData WHERE id = ?;`,
        [id]
      ).then((rows) => rows?.[0])
    : query(
        `SELECT id, rau_id, timestamp, serial_number, status, est_freq, est_p, est_q, est_s, est_fi, est_fi_deg, est_pset, channel_raw, processed FROM raus.Tbl_RawData;`
      );

export const getTenMostRecentRawData = (rau_id) => {
  const currentDateTime = new Date();
  const tenSecondsAgo = new Date(currentDateTime.getTime() - 10000); // Calculate 10 seconds ago
  return query(
    `
    SELECT id, rau_id, timestamp, serial_number, status, est_freq, est_p, est_q, est_s, est_fi, est_fi_deg, est_pset, channel_raw, processed
      FROM raus.Tbl_RawData
     WHERE rau_id = ? AND timestamp BETWEEN ? AND ?
     ORDER BY timestamp DESC
     LIMIT 10;`,
    [rau_id, tenSecondsAgo, currentDateTime]
  );
};

export const getRawDataLast10MinutesAveragesByRAUId = (rau_id) =>
  query(
    `
    WITH z AS (
    SELECT timestamp, est_freq, est_p, est_q, est_s, est_fi, est_fi_deg, est_pset,
           floor((ROW_NUMBER() OVER (ORDER BY timestamp) - 1) / 60) AS minute
      FROM raus.Tbl_RawData
     WHERE timestamp >= now() - INTERVAL 10 MINUTE
       AND rau_id = ?
    )
    SELECT min(timestamp)  AS time_start,
           max(timestamp)  AS time_stop,
           avg(est_freq)   AS est_freq,
           avg(est_p)      AS est_p,
           avg(est_q)      AS est_q,
           avg(est_s)      AS est_s,
           avg(est_fi)     AS est_fi,
           avg(est_fi_deg) AS est_fi_deg,
           avg(est_pset)   AS est_pset
      FROM z
     GROUP BY minute;`,
    [rau_id]
  ).then((rows) =>
    rows
      .sort(({ time_start: ts1 }, { time_start: ts2 }) => (ts1 < ts2 ? -1 : ts1 > ts2 ? 1 : 0))
      .splice(0, 10)
      .map(({ est_freq, est_p, est_q, est_s, est_fi, est_fi_deg, est_pset }, i) => ({
        time: `${10 - i} minutes ago to ${9 - i} minutes ago`,
        average: { est_freq, est_p, est_q, est_s, est_fi, est_fi_deg, est_pset },
      }))
  );

export const getRawDataLastMinuteAveragesByRAUId = (rau_id) =>
  query(
    `
  SELECT avg(est_freq)   AS est_freq,
         avg(est_p)      AS est_p,
         avg(est_q)      AS est_q,
         avg(est_s)      AS est_s,
         avg(est_fi)     AS est_fi,
         avg(est_fi_deg) AS est_fi_deg,
         avg(est_pset)   AS est_pset
    FROM raus.Tbl_RawData
    WHERE timestamp >= now() - INTERVAL 1 MINUTE
      AND rau_id = ?;`,
    [rau_id]
  )
    .then((rows) => rows?.[0])
    .then(
      (row) =>
        row ?? {
          time: `1 minutes ago to 0 minutes ago`,
          average: row,
        }
    );

export const listHiResFiles = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(SAMPLES_DIR_HIRES, (err, files) => {
      if (err) {
        return reject(err);
      }
      resolve(files);
    });
  });
};

export const getHiResFilePath = (fileName) => {
  const fPath = `${SAMPLES_DIR_HIRES}${fileName}`;
  return new Promise((resolve, reject) => {
    fs.exists(fPath, (exists) => {
      if (exists) {
        resolve(fPath);
      } else {
        resolve(null); // File not found
      }
    });
  });
};

export const getLastSamplesPercentage = mins =>
  query(
    `
SELECT u.id AS rau_id,
       count(s.rau_id) / (? * 60) AS percentage
  FROM raus.Tbl_RAU u
       LEFT OUTER JOIN raus.Tbl_RawData s ON u.id = s.rau_id AND s.timestamp >= now() - INTERVAL ? MINUTE
 WHERE u.started < now() - INTERVAL ? MINUTE
 GROUP BY u.id;`,
    [mins, mins, mins]
  );

