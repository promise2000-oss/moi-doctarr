/**
 * MoiDoctor API – Integration Tests
 * ---------------------------------
 * Run with: npm test
 *
 * Prerequisites:
 *   npm install --save-dev jest supertest
 *
 * Add to package.json:
 *   "scripts": { "test": "jest --detectOpenHandles --forceExit" }
 *
 * IMPORTANT:
 *   In `index.mjs` the server must be exported instead of calling
 *   `listen()` directly.  The last lines of `index.mjs` should now be:
 *
 *       export default server;
 *
 *   This allows SuperTest to use the Express app instance directly
 *   without opening a real network port.
 */

import request from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helper from "./utils/helper.mjs";
import Logger from "./utils/logger.mjs";

// Load environment variables (MongoDB URI, JWT secret, etc.)
dotenv.config({ quiet: true });

// Import the Express app (exported from index.mjs)
import app from "./index.mjs";

/* -------------------------------------------------------------------------- */
/*  Test data & shared variables                                              */
/* -------------------------------------------------------------------------- */
const testUser = {
  email: "testuser@example.com",
  fullName: "Test User",
  password: "Password123!",
  countryType: "US",
};

let authToken = ""; // JWT returned after sign‑up / sign‑in
let userId = ""; // MongoDB _id of the created user
let medicationId = "";
let triageId = "";
let symptomId = "";

/* -------------------------------------------------------------------------- */
/*  Global setup / teardown                                                   */
/* -------------------------------------------------------------------------- */
beforeAll(async () => {
  // Ensure DB connection is ready (index.mjs already called connectDB())
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  // Start with a clean DB for the test run
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});

/* -------------------------------------------------------------------------- */
/*  Helper: manual sign‑up (used by several tests)                           */
/* -------------------------------------------------------------------------- */
async function manualSignUp() {
  const res = await request(app)
    .post("/api/v1/auth/manualAuthentication")
    .send({
      email: testUser.email,
      password: testUser.password,
      type: "SIGNUP_MANUALLY",
      fullName: testUser.fullName,
      countryType: testUser.countryType,
    });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("authorization");
  authToken = res.body.authorization;
  // Some implementations may also return the user id – capture if present
  if (res.body.userId) userId = res.body.userId;
}

/* -------------------------------------------------------------------------- */
/*  Test suites                                                               */
/* -------------------------------------------------------------------------- */
describe("Health Check", () => {
  test("GET /api/v1/checkHealth returns success", async () => {
    const res = await request(app).get("/api/v1/checkHealth");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "successful" });
  });
});

describe("Authentication (Manual)", () => {
  test("Sign‑up a new user", async () => {
    await manualSignUp();
  });

  test("Sign‑in an existing user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/manualAuthentication")
      .send({
        email: testUser.email,
        password: testUser.password,
        type: "SIGNIN_MANUALLY",
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("authorization");
    authToken = res.body.authorization;
  });
});

describe("User Profile", () => {
  test("GET /api/v1/user/listData returns user data", async () => {
    const res = await request(app)
      .get("/api/v1/user/listData")
      .set("authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.email).toBe(testUser.email.toLowerCase().trim());
    userId = res.body.data._id;
  });

  test("PUT /api/v1/user/updateProfile updates profile", async () => {
    const newName = "Updated Name";
    const res = await request(app)
      .put("/api/v1/user/updateProfile")
      .set("authorization", authToken)
      .send({ userName: newName, demographics: { country: "CA" } });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.userName).toBe(newName);
  });

  test("GET /api/v1/user/notifications (empty list)", async () => {
    const res = await request(app)
      .get("/api/v1/user/notifications")
      .set("authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("Medication Management", () => {
  test("POST /api/v1/medication/create adds a medication", async () => {
    const med = {
      name: "Aspirin",
      dosage: "100mg",
      time: "08:00",
      supply: 30,
      frequent: "daily",
    };
    const res = await request(app)
      .post("/api/v1/medication/create")
      .set("authorization", authToken)
      .send(med);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    const meds = res.body.data;
    expect(Array.isArray(meds)).toBe(true);
    const created = meds.find((m) => m.name === med.name);
    expect(created).toBeDefined();
    medicationId = created.id;
  });

  test("GET /api/v1/medication returns medications", async () => {
    const res = await request(app)
      .get("/api/v1/medication")
      .set("authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("PUT /api/v1/medication/stop stops a medication", async () => {
    const res = await request(app)
      .put("/api/v1/medication/stop")
      .set("authorization", authToken)
      .send({ medicationId });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    const stopped = res.body.data.find((m) => m.id === medicationId);
    expect(stopped.status).toBe(false);
  });
});

describe("Triage & Symptom Logging", () => {
  test("POST /api/v1/triage creates a triage record", async () => {
    const payload = {
      symptoms: ["cough", "fever"],
      duration: "2 days",
      severity: "moderate",
      notes: "Feeling a bit weak",
    };
    const res = await request(app)
      .post("/api/v1/triage")
      .set("authorization", authToken)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    triageId = res.body.data._id;
  });

  test("GET /api/v1/triage/history returns triage & symptom history", async () => {
    const res = await request(app)
      .get("/api/v1/triage/history")
      .set("authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("triage");
    expect(res.body.data).toHaveProperty("symptoms");
  });

  test("GET /api/v1/triage/list returns all triage records", async () => {
    const res = await request(app)
      .get("/api/v1/triage/list")
      .set("authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/v1/symptom creates a symptom log", async () => {
    const payload = {
      symptomName: "headache",
      severity: "mild",
      notes: "Occasional",
    };
    const res = await request(app)
      .post("/api/v1/symptom")
      .set("authorization", authToken)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    symptomId = res.body.data._id;
  });

  test("GET /api/v1/symptom/list returns all symptom logs", async () => {
    const res = await request(app)
      .get("/api/v1/symptom/list")
      .set("authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("Admin Routes (protected)", () => {
  // Promote the test user to admin before hitting admin endpoints
  beforeAll(async () => {
    const res = await request(app)
      .put("/api/v1/admin/user/role")
      .set("authorization", authToken)
      .send({ role: "admin", userId });
    expect(res.status).toBe(200);
  });

  test("GET /api/v1/admin/users returns all users", async () => {
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("PUT /api/v1/admin/user/blacklist blacklists a user", async () => {
    const res = await request(app)
      .put("/api/v1/admin/user/blacklist")
      .set("authorization", authToken)
      .send({ targetUserId: userId });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.isBlacklisted).toBe(true);
  });

  test("GET /api/v1/admin/user/:id returns specific user", async () => {
    const res = await request(app)
      .get(`/api/v1/admin/user/${userId}`)
      .set("authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data._id).toBe(userId);
  });
});

describe("Account Deletion", () => {
  test("DELETE /api/v1/user removes the account", async () => {
    const res = await request(app)
      .delete("/api/v1/user")
      .set("authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.msg).toBe("account completely purged");
  });
});
