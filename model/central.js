import { query } from "../db.js";

export const getCentral = (id = null) =>
  id
    ? query("SELECT id, cen_name, cen_address, cen_longitude, cen_latitude FROM raus.Tbl_Centrals WHERE id = ?;", [
        id,
      ]).then((rows) => rows?.[0])
    : query("SELECT id, cen_name, cen_address, cen_longitude, cen_latitude FROM raus.Tbl_Centrals;");

export const deleteCentral = (id) =>
  query("DELETE FROM raus.Tbl_Centrals WHERE id = ?;", [id]).then((res) => `deleted ${res.affectedRows} central`);

export const updateCentral = (id, data) => {
  const fields = Object.keys(data);
  if (fields.length === 0) return Promise.resolve(0);
  return query(`UPDATE raus.Tbl_Centrals SET ${fields.map((field) => `${field} = ?`).join(`,\n`)} WHERE id = ?;`, [
    ...Object.values(data),
    id,
  ]).then((res) => `updated ${res.affectedRows} central`);
};

export const insertCentral = (data) => {
  const fields = Object.keys(data);
  if (fields.length === 0) return Promise.resolve(null);
  return query(
    `INSERT INTO raus.Tbl_Centrals(${fields.join(", ")})VALUES(${fields.map(() => "?").join(", ")});`,
    Object.values(data)
  ).then((res) => `added ${res.affectedRows} central`);
};
