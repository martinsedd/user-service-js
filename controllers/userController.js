const User = require("../models/User");

/**
 * @function bulkRegisterUsers
 * @description Registers multiple users in bulk by processing an array of user data.
 * For each user, it checks if the user already exists. If not, the user is created and added to the database.
 * A summary of results (success or failure) for each user is returned at the end of the operation.
 *
 * @async
 * @param {Object} req - Express request object containing an array of user data in `req.body`.
 * @param {Object} res - Express response object used to send the results.
 * @returns {void} - Sends a status of 200 with an array of results for each user registration attempt.
 */
const bulkRegisterUsers = async (req, res) => {
  const users = req.body; // Array of user data objects
  let results = [];

  // Iterate through each user data object and attempt to register the user
  for (let userData of users) {
    const { firstName, lastName, email, password, dob, role } = userData;

    try {
      // Check if a user with the same email already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        // If the user exists, record a failed result
        results.push({
          email,
          status: "failed",
          message: "User already exists",
        });
        continue; // Skip to the next user
      }

      // Create a new user object and save to the database
      const newUser = new User({
        firstName,
        lastName,
        email,
        password,
        dob,
        role: role || "user", // Default role is "user" if not provided
      });

      await newUser.save();

      // Record a success result for the newly created user
      results.push({
        email,
        status: "success",
        message: "User created successfully",
      });
    } catch (error) {
      // Handle any errors during the user creation process
      console.error(`Error creating user ${email}: ${error}`);
      results.push({
        email,
        status: "failed",
        message: "Server error",
      });
    }
  }

  // Return the results of the bulk registration
  res.status(200).json({
    message: "Bulk user registration complete",
    results,
  });
};

module.exports = { bulkRegisterUsers };
