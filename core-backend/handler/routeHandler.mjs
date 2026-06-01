import dotenv from "dotenv";
import Logger from "../utils/logger.mjs";
import { Triage } from "../models/triage.model.mjs";
import { SymptomLog } from "../models/symptoms.model.mjs";
import { User } from "../models/user.model.mjs";
import helper from "../utils/helper.mjs";
import mailer from "../utils/mailer.mjs";
import appleSignIn from "apple-signin-auth";
dotenv.config({ quiet: true });

class routeHandler {
  async checkHealth(req, res) {
    try {
      res.status(200).json({ msg: "successful" });
    } catch (err) {
      Logger.ERROR(err);
      res.status(500).json({ msg: "something went wrong" });
    }
  }

  // AUTH ROUTES
  async authenticateManually(req, res) {
    try {
      const { email, password, type, fullName, countryType } = req.body;
      const _verificationCode = helper.generateVericationCode();

      if (type === "SIGNUP_MANUALLY") {
        const emailTaken = await User.findOne({
          email: email.toLowerCase().trim(),
        });
        if (emailTaken) {
          return res.status(402).json({ err: "account_exist" });
        }
        const encryptPassword = helper.encryptPassword(password);
        const refreshToken = helper.createRefreshToken({
          email: email.toLowerCase().trim(),
        });
        const newAcct = new User({
          userName: fullName,
          email: email.toLowerCase().trim(),
          password: encryptPassword,
          verificationCode: _verificationCode,
          refreshToken,
          demographics: { country: countryType },
        });
        await newAcct.save();
        const userSessionToken = helper.createSessionToken({
          userId: newAcct._id,
        });
        await mailer.sendVerificationCode(
          email.toLowerCase().trim(),
          _verificationCode,
        );
        return res.status(200).json({
          msg: "successful",
          authorization: userSessionToken,
          refreshToken,
        });
      } else if (type === "SIGNIN_MANUALLY") {
        const doesUserExist = await User.findOne({
          email: email.toLowerCase().trim(),
        });
        if (
          !doesUserExist ||
          !helper.comparePassword(password, doesUserExist.password)
        ) {
          return res.status(404).json({ err: "invalid_account" });
        }
        if (doesUserExist.isBlacklisted) {
          return res.status(403).json({ err: "account_restricted" });
        }
        if (!doesUserExist.isVerified) {
          const newCode = helper.generateVericationCode();
          doesUserExist.verificationCode = newCode;
          await doesUserExist.save();
          await mailer.sendVerificationCode(email.toLowerCase().trim(), newCode);
          const sessionToken = helper.createSessionToken({ userId: doesUserExist._id });
          return res.status(403).json({ err: "account_not_verified", authorization: sessionToken });
        }
        const refreshToken = helper.createRefreshToken({
          userId: doesUserExist._id,
        });
        doesUserExist.lastLogin = new Date();
        doesUserExist.refreshToken = refreshToken;
        await doesUserExist.save();
        const _sessionToken = helper.createSessionToken({
          userId: doesUserExist._id,
        });
        return res.status(200).json({
          msg: "successful",
          authorization: _sessionToken,
          refreshToken,
        });
      }
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async authenticateWithGoogle(req, res) {
    try {
      const { accessToken, fullName, countryType } = req.body;

      if (!accessToken) {
        return res.status(400).json({ err: "missing_google_token" });
      }

      // Verify the access token by fetching Google's userinfo endpoint
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userInfoRes.ok) {
        return res.status(401).json({ err: "invalid_google_token" });
      }
      const googleUser = await userInfoRes.json();
      if (!googleUser.sub) {
        return res.status(401).json({ err: "invalid_google_token" });
      }

      const googleId = googleUser.sub;
      const googleEmail = googleUser.email?.toLowerCase().trim();
      const googleName = fullName || googleUser.name;

      let user = await User.findOne({ googleId });
      if (!user) {
        user = await User.findOne({ email: googleEmail });
        if (user) {
          user.googleId = googleId;
        } else {
          user = new User({
            googleId,
            userName: googleName,
            email: googleEmail,
            isVerified: true,
            demographics: { country: countryType },
          });
        }
      }
      if (user.isBlacklisted) {
        return res.status(403).json({ err: "account_restricted" });
      }
      const refreshToken = helper.createRefreshToken({ userId: user._id });
      user.lastLogin = new Date();
      user.refreshToken = refreshToken;
      await user.save();
      const sessionToken = helper.createSessionToken({ userId: user._id });
      return res.status(200).json({
        msg: "successful",
        authorization: sessionToken,
        refreshToken,
      });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async authenticateWithApple(req, res) {
    try {
      const { idToken, fullName, countryType } = req.body;

      if (!process.env.APPLE_CLIENT_ID) {
        return res.status(500).json({ err: "missing_apple_client_id" });
      }
      const applePayload = await appleSignIn.verifyIdToken(idToken, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: false,
      });
      if (!applePayload) {
        return res.status(401).json({ err: "invalid_apple_token" });
      }
      const appleId = applePayload.sub;
      const appleEmail = applePayload.email?.toLowerCase().trim();

      let user = await User.findOne({ appleId });
      if (!user) {
        user = await User.findOne({ email: appleEmail });
        if (user) {
          user.appleId = appleId;
        } else {
          user = new User({
            appleId,
            userName: fullName,
            email: appleEmail,
            isVerified: true,
            demographics: { country: countryType },
          });
        }
      }
      if (user.isBlacklisted) {
        return res.status(403).json({ err: "account_restricted" });
      }
      const refreshToken = helper.createRefreshToken({ userId: user._id });
      user.lastLogin = new Date();
      user.refreshToken = refreshToken;
      await user.save();
      const sessionToken = helper.createSessionToken({ userId: user._id });
      return res.status(200).json({
        msg: "successful",
        authorization: sessionToken,
        refreshToken,
      });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async refreshAccessToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ err: "refresh_token_required" });
      }
      const decoded = helper.decodeSessionToken(refreshToken);
      const user = await User.findOne({ _id: decoded.userId, refreshToken });
      if (!user) {
        return res.status(401).json({ err: "invalid_refresh_token" });
      }
      if (user.isBlacklisted) {
        return res.status(403).json({ err: "account_restricted" });
      }
      const newAccessToken = helper.createSessionToken({ userId: user._id });
      const newRefreshToken = helper.createRefreshToken({ userId: user._id });
      user.refreshToken = newRefreshToken;
      await user.save();
      return res.status(200).json({
        msg: "successful",
        authorization: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      if (err.isAuthError)
        return res.status(401).json({ err: "invalid_refresh_token" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async logoutUser(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      await User.findByIdAndUpdate(decodeToken.userId, {
        $set: { refreshToken: null },
      });
      res.status(200).json({ msg: "successful" });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async verifyUser(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const { verificationCode } = req.body;
      const query = await User.findOne({
        _id: decodeToken.userId,
        verificationCode,
      });
      if (query) {
        query.isVerified = true;
        await query.save();
        res.status(200).json({ msg: "successful" });
      } else {
        res.status(403).json({ msg: "invalid_code" });
      }
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async resendVerification(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const user = await User.findById(decodeToken.userId);
      if (!user) return res.status(404).json({ err: "user_not_found" });
      if (user.isVerified) return res.status(400).json({ err: "already_verified" });
      const newCode = helper.generateVericationCode();
      user.verificationCode = newCode;
      await user.save();
      await mailer.sendVerificationCode(user.email, newCode);
      res.status(200).json({ msg: "successful" });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async getAllUserData(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const query = await User.findOne({ _id: decodeToken.userId }).select(
        "-password -googleId -appleId -verificationCode -refreshToken",
      );
      res.status(200).json({ msg: "successful", data: query });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async updateUserData(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const { userName, demographics, phone, preference } = req.body;
      const updatedUser = await User.findByIdAndUpdate(
        decodeToken.userId,
        { $set: { userName, demographics, phone, preference } },
        { new: true, runValidators: true },
      ).select("-password -refreshToken");
      res.status(200).json({ msg: "successful", data: updatedUser });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email?.toLowerCase().trim() });
      if (user) {
        const code = helper.generateVericationCode();
        user.verificationCode = code;
        await user.save();
        await mailer.sendPasswordResetCode(email.toLowerCase().trim(), code);
      }
      // Always return success to prevent email enumeration
      res.status(200).json({ msg: "successful" });
    } catch (err) {
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email, verificationCode, newPassword } = req.body;
      const user = await User.findOne({
        email: email.toLowerCase().trim(),
        verificationCode,
      });
      if (!user) {
        return res.status(404).json({ err: "user_not_found" });
      }
      user.password = helper.encryptPassword(newPassword);
      await user.save();
      res.status(200).json({ msg: "successful" });
    } catch (err) {
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async listAllNotification(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const query = await User.findOne({ _id: decodeToken.userId });
      const notifications = query.notifications || [];
      res.status(200).json({ msg: "successful", data: notifications });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async createNewMedication(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const { name, dosage, time, supply, frequent } = req.body;
      const user = await User.findByIdAndUpdate(
        decodeToken.userId,
        {
          $push: {
            medications: {
              id: helper.generateId(4),
              name,
              dosage,
              time,
              frequent,
              supply,
              status: true,
              startedAt: new Date(),
            },
          },
        },
        { new: true },
      );
      res.status(200).json({ msg: "successful", data: user.medications });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async checkMedicationProcess(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const user = await User.findById(decodeToken.userId);
      res.status(200).json({ msg: "successful", data: user.medications || [] });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async stopMedicationProcess(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const { medicationId } = req.body;
      const query = await User.findOne({ _id: decodeToken.userId });
      if (!query) return res.status(404).json({ err: "user_not_found" });
      let itemFound = false;
      for (let _medicine of query.medications) {
        if (medicationId === _medicine["id"]) {
          _medicine.status = false;
          _medicine.stoppedAt = new Date();
          itemFound = true;
          break;
        }
      }
      if (!itemFound) {
        return res.status(404).json({ err: "medication_not_found" });
      }
      await query.save();
      res.status(200).json({ msg: "successful", data: query.medications });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async deleteUserAccount(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      await Triage.deleteMany({ userId: decodeToken.userId });
      await SymptomLog.deleteMany({ userId: decodeToken.userId });
      await User.findByIdAndDelete(decodeToken.userId);
      res.status(200).json({ msg: "account completely purged" });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async getHistory(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const skip = (page - 1) * limit;
      const [triageHistory, symptomHistory] = await Promise.all([
        Triage.find({ userId: decodeToken.userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        SymptomLog.find({ userId: decodeToken.userId })
          .sort({ loggedAt: -1 })
          .skip(skip)
          .limit(limit),
      ]);
      res.status(200).json({
        msg: "successful",
        data: { triage: triageHistory, symptoms: symptomHistory },
        page,
        limit,
      });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async listAllTriage(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const skip = (page - 1) * limit;
      const triageHistory = await Triage.find({ userId: decodeToken.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      res
        .status(200)
        .json({ msg: "successful", data: triageHistory, page, limit });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async listAllSymptoms(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const skip = (page - 1) * limit;
      const symptomHistory = await SymptomLog.find({
        userId: decodeToken.userId,
      })
        .sort({ loggedAt: -1 })
        .skip(skip)
        .limit(limit);
      res
        .status(200)
        .json({ msg: "successful", data: symptomHistory, page, limit });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async createNewTriage(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const { symptoms, duration, severity, notes } = req.body;
      const normalizedSeverity =
        severity?.trim().charAt(0).toUpperCase() +
        severity?.trim().slice(1).toLowerCase();
      let level = "Non-Urgent";
      let actionPlan = "Rest at home and monitor metrics.";
      const checkSeverity = severity?.trim().toLowerCase();
      if (checkSeverity === "severe") {
        level = "Emergency";
        actionPlan = "Proceed directly to your local Emergency Room.";
      } else if (checkSeverity === "moderate") {
        level = "Urgent";
        actionPlan = "Contact your clinician for a swift appointment.";
      }
      const record = await Triage.create({
        userId: decodeToken.userId,
        symptoms,
        duration,
        severity: normalizedSeverity,
        notes,
        triageStatus: { level },
        actionPlan,
      });
      res.status(201).json({ msg: "successful", data: record });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async createNewSymptoms(req, res) {
    try {
      const { authorization } = req.headers;
      const decodeToken = helper.decodeSessionToken(authorization);
      const { symptomName, severity, notes } = req.body;
      const log = await SymptomLog.create({
        userId: decodeToken.userId,
        symptomName,
        severity,
        notes,
      });
      res.status(201).json({ msg: "successful", data: log });
    } catch (err) {
      if (err.isAuthError) return res.status(401).json({ err: "auth_failed" });
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  // @ADMIN CENTERED
  async listAllUsers(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const skip = (page - 1) * limit;
      const systemUsers = await User.find()
        .select("-password -refreshToken")
        .skip(skip)
        .limit(limit);
      res
        .status(200)
        .json({ msg: "successful", data: systemUsers, page, limit });
    } catch (err) {
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async changeRole(req, res) {
    try {
      const { role, userId } = req.body;
      const query = await User.findOne({ _id: userId }).select("-password");
      if (!query) {
        return res.status(404).json({ err: "user_not_found" });
      }
      query.role = role;
      await query.save();
      res.status(200).json({ msg: "successful" });
    } catch (err) {
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async blacklistUser(req, res) {
    try {
      const { targetUserId } = req.body;
      const blacklistedUser = await User.findByIdAndUpdate(
        targetUserId,
        {
          $set: { isBlacklisted: true, isVerified: false, refreshToken: null },
        },
        { new: true },
      );
      res
        .status(200)
        .json({ msg: "user restricted successfully", data: blacklistedUser });
    } catch (err) {
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }

  async getSpecificUserById(req, res) {
    try {
      const { id } = req.params;
      const clientRecord = await User.findById(id).select(
        "-password -refreshToken",
      );
      if (!clientRecord) {
        return res.status(404).json({ err: "user records unresolvable" });
      }
      res.status(200).json({ msg: "successful", data: clientRecord });
    } catch (err) {
      res.status(500).json({ err: "something went wrong" });
      Logger.ERROR(err);
    }
  }
}

export const RouteHandler = new routeHandler();

export default RouteHandler;
