const express = require("express");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const { ROLES } = require("../../../consts");

dotenv.config();

const router = express.Router();

// JWT Generator
function generateJWT(payload) {
  const privateKey = process.env.JWT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("JWT private key is not set in environment variables.");
  }

  return jwt.sign(payload, privateKey, {
    algorithm: "HS256",
    expiresIn: "1h",
  });
}

// Professor Login
router.post("/professor", async (req, res) => {
  console.log("[authService] BODY RECEIVED:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Call professor service login-data route to get professor with password
    const response = await axios.get(`${process.env.PROFESSOR_SERVICE_URL}/login-data`, {
      params: { email },
    });

    const professor = response.data;
    console.log("[authService] Professor found:", professor);

    if (!professor.password) {
      console.error("[authService] Missing password for professor in data");
      return res.status(500).json({ message: "Password not set for this user" });
    }

    const isMatch = await bcrypt.compare(password, professor.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateJWT({
      id: professor._id || professor.id,
      role: ROLES.PROFESSOR,
      email: professor.email,
    });

    return res.status(200).json({ token });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Professor not found
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.error("[authService] ERROR in /professor login:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Student Login (unchanged)
router.post("/student", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { fetchStudents } = require("./util"); // Assuming fetchStudents still returns list with passwords
    const students = await fetchStudents();
    const student = students.find((s) => s.email === email);

    if (!student) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateJWT({
      id: student._id || student.id,
      role: ROLES.STUDENT,
      email: student.email,
    });

    return res.status(200).json({ token });
  } catch (error) {
    console.error("[authService] ERROR in /student login:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
