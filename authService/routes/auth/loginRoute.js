const express = require("express");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const {
  fetchStudents,
  fetchProfessors,
} = require("./util");
const { ROLES } = require("../../../consts");

const router = express.Router();
dotenv.config();

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
  console.log("BODY RECEIVED:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const professors = await fetchProfessors();
    const professor = professors.find((p) => p.email === email);

    console.log("Professor found:", professor);

    if (!professor) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, professor.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateJWT({
      id: professor.id,
      role: ROLES.PROFESSOR,
      email: professor.email,
    });

    return res.status(200).json({ token });
  } catch (err) {
    console.error("ERROR in /professor login:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});



// Student Login
router.post("/student", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const students = await fetchStudents();  // Assumed to be from a util file
  const student = students.find((s) => s.email === email);

  if (!student) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, student.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateJWT({
    id: student.id,
    role: ROLES.STUDENT,
    email: student.email,
  });

  return res.status(200).json({ token });
});

module.exports = router;
