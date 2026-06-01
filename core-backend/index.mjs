import dotenv from "dotenv";
dotenv.config({ quiet: true });
import Logger from "./utils/logger.mjs";
import connectDB from "./config/dbConfig.config.mjs";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import routeGuard from "./guard/routeGuard.mjs";
import routeHandler from "./handler/routeHandler.mjs";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import { readFileSync } from "fs";

const server = express();
const port = process.env.PORT || 4455;

//  define middlewares
server.use(express.json());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.disable("x-powered-by");
server.use(cors({
  origin: process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174']
    : true,
  credentials: true,
}));

// ---------- Swagger UI ----------
let swaggerSpec = {};
try {
  const swaggerFile = readFileSync(
    new URL("./swagger.yaml", import.meta.url),
    "utf8",
  );
  swaggerSpec = yaml.load(swaggerFile);
} catch (e) {
  console.error("Failed to load swagger.yaml:", e);
}
server.use("/api-documentation", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// --------------------------------

// define endpoints
// health check
server.get("/api/v1/checkHealth", routeHandler.checkHealth);

// authentication routes
server.post(
  "/api/v1/auth/manualAuthentication",
  routeHandler.authenticateManually,
);
server.post("/api/v1/auth/google", routeHandler.authenticateWithGoogle);
server.post("/api/v1/auth/apple", routeHandler.authenticateWithApple);
server.post("/api/v1/auth/verify", routeHandler.verifyUser);
server.post("/api/v1/auth/resendVerification", routeHandler.resendVerification);
server.post("/api/v1/auth/refresh", routeHandler.refreshAccessToken);
server.post("/api/v1/auth/logout", routeHandler.logoutUser);

// user data routes
server.get("/api/v1/user/listData", routeHandler.getAllUserData);
server.put("/api/v1/user/updateProfile", routeHandler.updateUserData);
server.post("/api/v1/auth/requestPasswordReset", routeHandler.requestPasswordReset);
server.post("/api/v1/user/forgotPassword", routeHandler.forgotPassword);
server.get("/api/v1/user/notifications", routeHandler.listAllNotification);

// medication routes
server.post("/api/v1/medication/create", routeHandler.createNewMedication);
server.get("/api/v1/medication", routeHandler.checkMedicationProcess);
server.put("/api/v1/medication/stop", routeHandler.stopMedicationProcess);

// // triage & symptom routes
server.post("/api/v1/triage", routeHandler.createNewTriage);
server.get("/api/v1/triage/history", routeHandler.getHistory);
server.post("/api/v1/symptom", routeHandler.createNewSymptoms);
server.get("/api/v1/triage/list", routeHandler.listAllTriage);
server.get("/api/v1/symptom/list", routeHandler.listAllSymptoms);

// // admin routes (protected)
server.get(
  "/api/v1/admin/users",
  routeGuard.isUserAdmin,
  routeHandler.listAllUsers,
);
server.put(
  "/api/v1/admin/user/role",
  routeGuard.isUserAdmin,
  routeHandler.changeRole,
);
server.put(
  "/api/v1/admin/user/blacklist",
  routeGuard.isUserAdmin,
  routeHandler.blacklistUser,
);
server.get(
  "/api/v1/admin/user/:id",
  routeGuard.isUserAdmin,
  routeHandler.getSpecificUserById,
);

// // account deletion
server.delete("/api/v1/user", routeHandler.deleteUserAccount);

// Start server when run directly
const _initializeServer = () => {
  Logger.PENDING("Please wait ... Trying to start server");
  server.listen(port, () => {
    Logger.SUCCESSFUL(`Server listening on port ${port}`);
    connectDB();
  });
};
try {
  _initializeServer();
} catch (err) {
  Logger.ERROR("Could not start server");
  setInterval(() => {
    _initializeServer();
  }, 3000);
}
