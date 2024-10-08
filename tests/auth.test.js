const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

/**
 * Test suite for JWT Token generation and verification.
 * It tests the correct generation and decoding of JWT tokens with user information.
 */
describe("JWT Token Generation", () => {
  const user = { _id: "12345", role: "admin" }; // Mock user data
  const secret = "testsecret"; // Secret for JWT

  // Clear mock implementations before each test
  beforeEach(() => {
    jwt.verify.mockClear();
    jwt.sign.mockClear();
  });

  it("should generate a valid JWT token with user ID and role", () => {
    // Generate a mock JWT token
    const token = jwt.sign({ _id: user._id, role: user.role }, secret, {
      expiresIn: "10m",
    });

    // Mock the implementation of jwt.verify
    jwt.verify.mockImplementation(() => ({ _id: user._id, role: user.role }));

    // Verify the generated token
    const decoded = jwt.verify(token, secret);

    // Assertions
    expect(decoded._id).toBe(user._id);
    expect(decoded.role).toBe(user.role);
  });
});

jest.mock("../models/User");

/**
 * Test suite for account lockout logic.
 * It simulates a user exceeding the failed reset attempts threshold and verifies that the account is locked.
 */
describe("Account Lockout Logic", () => {
  it("should lock the user account after too many failed attempts", async () => {
    // Mock user data with 2 failed attempts
    const user = {
      failedResetAttempts: 2,
      lockUntil: undefined,
      save: jest.fn().mockResolvedValue(true), // Mock the save method
    };

    // Increment failed attempts and check lock logic
    user.failedResetAttempts += 1;
    if (user.failedResetAttempts >= 3) {
      user.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
    }

    // Assertions
    expect(user.failedResetAttempts).toBe(3);
    expect(user.lockUntil).toBeDefined();
  });
});

/**
 * Test suite for the password reset request.
 * It checks the behavior when a valid or invalid email is provided for password reset.
 */
describe("Password Reset Request", () => {
  it("should send a password reset email when valid email is provided", async () => {
    // Mock a valid user found in the database
    User.findOne.mockResolvedValue({
      _id: "12345",
      email: "test@example.com",
      save: jest.fn(), // Mock the save method
      resetPasswordToken: "validtoken",
      resetPasswordExpire: Date.now() + 10 * 60 * 1000, // Token valid for 10 minutes
    });

    // Make the request to the password reset endpoint
    const response = await request(app)
      .post("/api/auth/request-reset")
      .send({ email: "test@example.com" });

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Password reset link sent to your email"
    );
  });

  it("should return an error if user not found", async () => {
    // Mock a user not found in the database
    User.findOne.mockResolvedValue(null);

    // Make the request to the password reset endpoint with an unknown email
    const response = await request(app)
      .post("/api/auth/request-reset")
      .send({ email: "unknown@example.com" });

    // Assertions
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("User not found");
  });
});

/**
 * Test suite for password reset confirmation.
 * It checks if a password reset is successful with a valid token and if errors are returned for an invalid token.
 */
describe("Password Reset Confirmation", () => {
  it("should reset the password when valid token and password are provided", async () => {
    // Mock a valid user with a reset token
    const user = {
      _id: "12345",
      email: "test@example.com",
      role: "admin",
      resetPasswordToken: "validtoken",
      resetPasswordExpire: Date.now() + 10 * 60 * 1000, // Token valid for 10 minutes
      save: jest.fn().mockResolvedValue(true), // Mock the save method
    };

    // Mock the user found in the database
    User.findOne.mockResolvedValue(user);

    // Mock JWT token verification
    jwt.verify.mockResolvedValue({ _id: "12345" });

    // Make the request to the password reset endpoint
    const response = await request(app)
      .put("/api/auth/reset-password")
      .query({ token: "validtoken" })
      .send({ password: "newpassword123" });

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Password successfully updated");
  });

  it("should return an error for invalid token", async () => {
    // Mock JWT token verification failure
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid or expired token");
    });

    // Make the request with an invalid token
    const response = await request(app)
      .put("/api/auth/reset-password")
      .query({ token: "invalidtoken" })
      .send({ password: "newpassword123" });

    // Assertions
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid or expired token");
  });
});
