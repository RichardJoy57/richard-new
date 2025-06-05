const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const dotenv = require("dotenv");
const axios = require("axios");
const {
  STUDENT_SERVICE,
  PROFESSOR__SERVICE,
  ROLES,
} = require("../../../consts");

dotenv.config();

// Load RSA keys
const privateKey = fs.readFileSync(
  path.join(__dirname, "../auth/keys/private.key"),
  "utf8"
);
const publicKey = fs.readFileSync(
  path.join(__dirname, "../auth/keys/public.key"),
  "utf8"
);

const kid = "1";
const jku = `http://localhost:${process.env.PORT}/.well-known/jwks.json`;

// JWT generator
function generateJWTWithPrivateKey(payload) {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h",
    header: {
      kid,
      jku,
    },
  });
}

// JWT verifier
function verifyJWTWithPublicKey(token) {
  try {
    return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return null;
  }
}

// Data fetching
async function fetchStudents() {
  const response = await axios.get(STUDENT_SERVICE);
  return response.data;
}

async function fetchProfessors() {
  const response = await axios.get(PROFESSOR__SERVICE);
  return response.data;
}

module.exports = {
  kid,
  generateJWTWithPrivateKey,
  verifyJWTWithPublicKey,
  fetchStudents,
  fetchProfessors,
};
