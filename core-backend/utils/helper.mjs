import dotenv from "dotenv";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
dotenv.config({ quiet: true });

class helper {
  generateVericationCode() {
    return String(Math.floor(100000 + crypto.randomInt(900000)));
  }

  generateId(size = 0) {
    return crypto.randomBytes(size).toString("hex").slice(0, 6);
  }

  encryptPassword(password = "") {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  comparePassword(password = "", stored = "") {
    try {
      const [salt, hash] = stored.split(":");
      if (!salt || !hash) return false;
      const hashBuffer = Buffer.from(hash, "hex");
      const derived = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(derived, hashBuffer);
    } catch {
      return false;
    }
  }

  createSessionToken(payload = {}) {
    return jsonwebtoken.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: "12h",
    });
  }

  createRefreshToken(payload = {}) {
    return jsonwebtoken.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: "7d",
    });
  }

  decodeSessionToken(sessionToken = "") {
    try {
      const token = sessionToken.startsWith("Bearer ")
        ? sessionToken.slice(7)
        : sessionToken;
      return jsonwebtoken.verify(token, process.env.TOKEN_SECRET);
    } catch {
      const err = new Error("auth_failed");
      err.isAuthError = true;
      throw err;
    }
  }
}

export const Helper = new helper();

export default Helper;
