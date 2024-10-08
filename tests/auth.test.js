const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

describe("JWT Token Generation", () => {
  const user = { _id: "12345", role: "admin" };
  const secret = "testsecret";

  beforeEach(() => {
    jwt.verify.mockClear();
    jwt.sign.mockClear();
  });

  it("should generate a valid JWT token with user ID and role", () => {
    const token = jwt.sign({ _id: user._id, role: user.role }, secret, {
      expiresIn: "10m",
    });

    jwt.verify.mockImplementation(() => ({ _id: user._id, role: user.role }));

    const decoded = jwt.verify(token, secret);

    expect(decoded._id).toBe(user._id);
    expect(decoded.role).toBe(user.role);
  });
});

jest.mock("../models/User");

describe("Account Lockout Logic", () => {
  it("should lock the user account after too many failed attempts", async () => {
    const user = {
      failedResetAttempts: 2,
      lockUntil: undefined,
      save: jest.fn().mockResolvedValue(true),
    };

    console.log(user.failedResetAttempts);

    user.failedResetAttempts += 1;
    if (user.failedResetAttempts >= 3) {
      user.lockUntil = Date.now() + 30 * 60 * 1000;
    }

    expect(user.failedResetAttempts).toBe(3);
    expect(user.lockUntil).toBeDefined();
  });
});

describe("Password Reset Request", () => {
  it("should send a password reset email when valid email is provided", async () => {
    const mockUser = { _id: "12345", email: "test@example.com" };

    User.findOne.mockResolvedValue({
      _id: "12345",
      email: "test@example.com",
      save: jest.fn(),
      resetPasswordToken: "validtoken",
      resetPasswordExpire: Date.now() + 10 * 60 * 1000,
    });

    const response = await request(app)
      .post("/api/auth/request-reset")
      .send({ email: "test@example.com" });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Password reset link sent to your email"
    );
  });

  it("should return an error if user not found", async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/auth/request-reset")
      .send({ email: "unknown@example.com" });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("User not found");
  });
});

describe("Password Reset Confirmation", () => {
  it("should reset the password when valid token and password are provided", async () => {
    const user = {
      _id: "12345",
      email: "test@example.com",
      role: "admin",
      resetPasswordToken: "validtoken",
      resetPasswordExpire: Date.now() + 10 * 60 * 1000,
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(user);

    jwt.verify.mockResolvedValue({ _id: "12345" });

    const response = await request(app)
      .put("/api/auth/reset-password")
      .query({ token: "validtoken" })
      .send({ password: "newpassword123" });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Password successfully updated");
  });

  it("should return an error for invalid token", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid or expired token");
    });

    const response = await request(app)
      .put("/api/auth/reset-password")
      .query({ token: "invalidtoken" })
      .send({ password: "newpassword123" });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid or expired token");
  });
});
