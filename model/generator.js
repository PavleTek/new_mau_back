import { query } from "../db.js";

export const getGenerator = (id = null) =>
  id
    ? query(
        "SELECT id, name, central_id, fn_prefix, freq_nominal, pelec_nominal, db_min, db_max, droop_min, droop_max, rise_time_min, rise_time_max, p_set_min, p_set_max, psetp_min_difference_pu, pearson_max, rau_master_id, rau_slave_id FROM raus.Tbl_Generators_1 WHERE id = ?;",
        [id]
      ).then((rows) => rows?.[0])
    : query(
        "SELECT id, name, central_id, fn_prefix, freq_nominal, pelec_nominal, db_min, db_max, droop_min, droop_max, rise_time_min, rise_time_max, p_set_min, p_set_max, psetp_min_difference_pu, pearson_max, rau_master_id, rau_slave_id FROM raus.Tbl_Generators_1;"
      );

export const deleteGenerator = (id) =>
  query("DELETE FROM raus.Tbl_Generators_1 WHERE id = ?;", [id]).then((res) => `deleted ${res.affectedRows} generator`);

export const updateGenerator = (id, data) => {
  const fields = Object.keys(data);
  if (fields.length === 0) return Promise.resolve(0);
  return query(`UPDATE raus.Tbl_Generators_1 SET ${fields.map((field) => `${field} = ?`).join(`,\n`)} WHERE id = ?;`, [
    ...Object.values(data),
    id,
  ]).then((res) => `updated ${res.affectedRows} generator`);
};

export const insertGenerator = (data) => {
  const fields = Object.keys(data);
  if (fields.length === 0) return Promise.resolve(null);
  return query(
    `INSERT INTO raus.Tbl_Generators_1(${fields.join(", ")})VALUES(${fields.map(() => "?").join(", ")});`,
    Object.values(data)
  ).then((res) => `added ${res.affectedRows} generator`);
};
