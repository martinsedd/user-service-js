const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const User = require("../models/User");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", loginUser);

// @route POST /api/auth/request-reset
// @desc Request password reset
// @access Public
router.post("/request-reset", async (req, res) => {
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

// @route PUT /api/auth/reset-password
// @desc Reset user password
// @access Public
router.put("/reset-password", async (req, res) => {
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

    if (!user || user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.password = password;
    await user.save();

    res.status(200).json({ message: "Password successfully updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

module.exports = router;
