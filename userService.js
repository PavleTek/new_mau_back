const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("./prisma/prisma.js");

const register = async (req) => {
  const { name, is_admin, mandatory, username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        is_admin,
        mandatory,
        username,
        password: hashedPassword,
      },
    });
    return { status: 200, data: user };
  } catch (error) {
    return { status: 500, data: error };
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid password");
    }

    const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, "secretKey", {
      expiresIn: "1h",
    });

    res.send({ token });
  } catch (error) {
    res.status(500).send(error, req.body);
  }
};

async function changePassword(userId, oldPassword, newPassword) {
  try {
    // Find the user by ID
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Check if the old password is valid
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return { success: false, message: 'Invalid old password' };
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedNewPassword,
      },
    });

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error(error); // Log the error for debugging
    return { success: false, message: 'An error occurred' };
  }
}

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("No Bearer token provided");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, "secretKey", (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(401).send("Token verification failed: " + err.message);
    }

    req.user = decoded;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("No Bearer token provided");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, "secretKey", (err, decoded) => {
    if (err) {
      return res.status(401).send("Invalid token");
    }

    req.user = decoded;

    // Check if the user is an admin
    if (!req.user.is_admin) {
      return res.status(403).send("Access denied. Admin rights required.");
    }

    next();
  });
};

async function getAllUsers() {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
}

const getUserFromToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("No Bearer token provided");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, "secretKey", (err, decoded) => {
    if (err) {
      return res.status(401).send("Invalid token");
    }

    req.user = decoded; // Attach the user data to the request object
    next();
  });
};

const getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = {
  register,
  login,
  changePassword,
  authenticate,
  authenticateAdmin,
  getProfile,
  getUserFromToken,
  getAllUsers,
};
