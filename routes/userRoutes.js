const express = require("express");
const { protect, roleCheck } = require("../middlewares/authMiddleware");
const { bulkRegisterUsers } = require("../controllers/userController");
const router = express.Router();
const User = require("../models/User");

// @route  GET /api/users/profile
// @desc   Get current user profile
// @access Protected (User only)
router.get("/profile", protect, (req, res) => {
  res.json({
    id: req.user.id,
    role: req.user.role,
    message: "This is your profile",
  });
});

// @route PUT /api/users/profile
// @desc Update user profile (self-service)
// @access Protected (User only)
router.put("/profile", protect, async (req, res) => {
  const { firstName, lastName, email, dob } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.dob = dob || user.dob;

    const updatedUser = await user.save();
    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route GET /api/admin/users
// @desc Get all users(Admin only)
// @access Private/Admin
router.get("/", protect, roleCheck(["admin"]), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route DELETE /api/admin/users/:id
// @desc Delete a user(Admin only)
// @access Private/Admin
router.delete("/:id", protect, roleCheck(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// @route POST /api/users/bulk-register
// @desc Bulk register users(Admin only)
// @access Private/Admin
router.post("/bulk-register", protect, roleCheck(["admin"]), bulkRegisterUsers);

module.exports = router;
