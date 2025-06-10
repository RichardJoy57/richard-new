const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const axios = require("axios");
const { ROLES } = require("../../../consts");

dotenv.config();

async function fetchJWKS(jku) {
  const response = await axios.get(jku);
  return response.data.keys;
}

function getPublicKeyFromJWKS(kid, keys) {
  const key = keys.find((k) => k.kid === kid);
  if (!key) throw new Error("Unable to find a signing key that matches the 'kid'");
  // This is a simplification; for real RS256 keys, you may need to convert modulus/exponent to PEM
  return `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`;
}

async function verifyJWT(token) {
  const decodedHeader = jwt.decode(token, { complete: true }).header;
  const { kid, alg, jku } = decodedHeader;

  if (jku && kid && alg === "RS256") {
    // JWKS verification
    const keys = await fetchJWKS(jku);
    const publicKey = getPublicKeyFromJWKS(kid, keys);
    return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
  } else if (alg === "HS256") {
    // Local secret verification
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } else {
    throw new Error("Unsupported or invalid token algorithm/header");
  }
}

function verifyRole(requiredRoles) {
  return async (req, res, next) => {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authorization token is missing" });
    }

    try {
      const decoded = await verifyJWT(token);
      req.user = decoded;

      // Support both single role as string or array of roles
      const userRoles = Array.isArray(req.user.roles)
        ? req.user.roles
        : [req.user.role || req.user.roles];

      const hasRequiredRole = userRoles.some((role) =>
        requiredRoles.includes(role)
      );
      if (hasRequiredRole) {
        return next();
      } else {
        return res.status(403).json({ message: "Access forbidden: Insufficient role" });
      }
    } catch (error) {
      console.error(error);
      return res
        .status(403)
        .json({ message: "Invalid or expired token", error: error.message });
    }
  };
}

function restrictProfessorToOwnData(req, res, next) {
  if (
    req.user.roles.includes(ROLES.PROFESSOR) &&
    req.user.id !== req.params.id
  ) {
    return res.status(403).json({
      message: "Access forbidden: You can only access your own data",
    });
  }
  next();
}

module.exports = {
  verifyRole,
  restrictProfessorToOwnData,
};
