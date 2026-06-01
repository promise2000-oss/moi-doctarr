import dotenv from "dotenv";
import Logger from "../utils/logger.mjs";
import { User } from "../models/user.model.mjs";
import helper from "../utils/helper.mjs";
dotenv.config({ quiet: true });

class routeGuard {
  async isUserAdmin(req, res, next) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const query = await User.findOne({
        _id: decodeToken.userId,
      });
      if (!query) {
        return res.status(403).json({ err: "not_allowed" });
      }
      if (query.role !== "admin") {
        return res.status(403).json({ err: "not_allowed" });
      }
      next();
    } catch (err) {
      if (err.isAuthError) {
        return res.status(401).json({ err: "auth_failed" });
      }
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }
}

export const RouteGuard = new routeGuard();

export default RouteGuard;
