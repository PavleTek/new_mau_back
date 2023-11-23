import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config.js";
import { query } from "../db.js";

export const getUser = (uname, psw) =>
  query("SELECT id, username, name, password, is_admin, mandatory FROM raus.user WHERE username = ?;", [uname])
    .then((rows) => rows?.[0])
    .then((user) => {
      if (!user) return Promise.reject({ status: 404, message: "User not found" });
      return bcrypt.compare(psw, user.password).then((isPasswordValid) => {
        if (isPasswordValid) {
          const { id, username, is_admin } = user;
          const token = jwt.sign({ id, username, is_admin }, JWT_SECRET, { expiresIn: "1h" });
          return Promise.resolve(token);
        }
        return Promise.reject({ status: 401, message: "Invalid password" });
      });
    });

export const setUserPassword = (id, oldPassword, newPassword) =>
  query("SELECT id, username, name, password, is_admin, mandatory FROM raus.user WHERE id = ?;", [id])
    .then((rows) => rows?.[0])
    .then((user) =>
      !user ? Promise.reject({ status: 404, message: "User not found" }) : bcrypt.compare(oldPassword, user.password)
    )
    .then((isPasswordValid) =>
      isPasswordValid ? bcrypt.hash(newPassword, 10) : Promise.reject({ status: 401, message: "Invalid password" })
    )
    .then((hashedNewPassword) => query("UPDATE raus.user SET password = ? WHERE id = ?;", [hashedNewPassword, id]))
    .then((res) => res.affectedRows);

export const registerUser = async (name, is_admin, mandatory, username, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      `
			INSERT INTO raus.user (name, is_admin, mandatory, username, password)
			VALUES (?, ?, ?, ?, ?);
			`,
      [name, is_admin, mandatory, username, hashedPassword]
    );

    return result.affectedRows;
  } catch (error) {
    console.error(error);
    throw error; // Handle or log the error as needed
  }
};

export const updateUser = (id, user) => {
  if (user.password !== undefined && user.password.trim() === "") delete user.password;
  return (
    !!user.password
      ? bcrypt.hash(user.password.trim(), 10).then((password) => ({ ...user, password }))
      : Promise.resolve(user)
  )
    .then((user) => {
      const fields = Object.keys(user);
      if (fields.length === 0) return Promise.resolve(0);
      return query(`UPDATE raus.user SET ${keys.map((field) => `${field} = ?`).join(",\n")} WHERE id = ?;`, [
        ...Object.values(user),
        id,
      ]);
    })
    .then((res) => res.affectedRows);
};

export const deleteUser = (id) => query(`DELETE FROM raus.user WHERE id = ?;`, [id]).then((res) => res.affectedRows);

export const getUserById = (id = null) =>
  id
    ? query("SELECT id, username, name, password, is_admin, mandatory FROM raus.user WHERE id = ?;", [id]).then(
        (rows) => rows?.[0]
      )
    : query("SELECT id, username, name, password, is_admin, mandatory FROM raus.user;");

export const getUserFromToken = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("No Bearer token provided");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send("Invalid token");
    }
    req.user = decoded; // Attach the user data to the request object
  });
};
