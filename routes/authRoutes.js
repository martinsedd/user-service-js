const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const User = require("../models/User");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { check, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", loginUser);

const resetRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message:
    "Too many password reset requests from this IP, please try again after 10 minutes",
});

const resetRequestMiddlewares = [
  resetRequestLimiter,
  check("email", "Please provide a valid email").isEmail(),
];

// @route POST /api/auth/request-reset
// @desc Request password reset
// @access Public
router.post("/request-reset", resetRequestMiddlewares, async (req, res) => {
  const clientIP = req.ip;
  console.log(`Password reset requested from IP: ${clientIP}`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const resetToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `http://localhost:5000/reset-password?token=${resetToken}`;

    await sendResetEmail(user.email, resetUrl);
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Error in requestPasswordReset: ", error);
    res.status(500).json({ message: "Server error", error: error });
  }
});

const sendResetEmail = async (email, resetUrl) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: "no-reply@user-service.com",
    to: email,
    subject: "Password Reset Request",
    text: `You requested a password reset. Please click the link to reset your password: ${resetUrl}`,
  };

  await transporter.sendMail(mailOptions);
};

const resetPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message:
    "Too many password reset requests from this IP, please try again after 10 minutes",
});

const resetPasswordMiddlewares = [
  resetPasswordLimiter,
  check(
    "password",
    "Password must be at least 8 characters long and contain a number"
  )
    .isLength({ min: 8 })
    .matches(/\d/),
];

// @route PUT /api/auth/reset-password
// @desc Reset user password
// @access Public
router.put("/reset-password", resetPasswordMiddlewares, async (req, res) => {
  const clientIP = req.ip;
  console.log(`Password reset requested from IP: ${clientIP}`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  console.log("Query received: ", req.query);

  const { token } = req.query;
  const { password } = req.body;

  console.log("Token received: ", token);

  if (!token) {
    return res.status(400).json({ message: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT: ", decoded);

    const user = await User.findOne({
      _id: decoded._id,
      resetPasswordToken: token,
    });
    console.log("User found: ", user);

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res
        .status(400)
        .json({ message: "Account locked due to too many failed attempts" });
    }

    if (!user || user.resetPasswordExpire < Date.now()) {
      user.failedResetAttempts += 1;

      if (user.failedResetAttempts >= 3) {
        user.lockUntil = Date.now() + 30 * 60 * 1000;
        await user.save();
        return res.status(400).json({
          message: "Too many failed attempts. Account locked for 30 minutes",
        });
      }

      await user.save();
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.password = password;
    user.failedResetAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    res.status(200).json({ message: "Password successfully updated" });
  } catch (err) {
    console.error("Error in resetPassword: ", err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
