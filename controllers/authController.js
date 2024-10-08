const User = require("../models/User");
const jwt = require("jsonwebtoken");

/**
 * @function registerUser
 * @description Registers a new user by creating a user record in the database.
 * It first checks if the user already exists based on the provided email.
 * If the user doesn't exist, it creates a new user, saves them to the database,
 * and returns a success response.
 *
 * @async
 * @param {Object} req - Express request object containing user details in `req.body`.
 * @param {Object} res - Express response object to send the response.
 * @returns {void} - Sends a 201 status with a success message if successful, or an error status if registration fails.
 */
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, dob, role } = req.body;

  try {
    // Check if user already exists based on the email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a new user instance
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      dob,
      role: role || "user", // Default role is "user"
    });

    // Save the user to the database
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @function loginUser
 * @description Authenticates a user by checking their credentials (email and password).
 * If the credentials are valid, it generates a JWT token, sets it in an HTTP-only cookie,
 * and returns a success message.
 *
 * @async
 * @param {Object} req - Express request object containing login credentials in `req.body`.
 * @param {Object} res - Express response object to send the response.
 * @returns {void} - Sends a 200 status with a success message if authentication is successful, or an error status if authentication fails.
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if the provided password matches the user's hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token with the user's ID and role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Token expires in 24 hours
    );

    // Set the token in an HTTP-only cookie for secure session management
    res.cookie("token", token, {
      httpOnly: true, // Accessible only by the web server
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };
