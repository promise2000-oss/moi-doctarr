/**
 * MoiDoctor API – Integration Tests
 * ---------------------------------
 * Run with: npm test
 */

import request from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helper from "./utils/helper.mjs";
import Logger from "./utils/logger.mjs";
import app from "./index.mjs";

dotenv.config({ quiet: true });

const testUser = {
  email: "testuser@example.com",
  fullName: "Test User",
  password: "Password123!",
  countryType: "US",
};

let authToken = "";
let userId = "";
let medicationId = "";
let triageId = "";
let symptomId = "";

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});

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
  if (res.body.userId) userId = res.body.userId;
}

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

// Additional test suites (user profile, medication, triage, admin, etc.) can be added here as needed.
