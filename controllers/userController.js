const User = require("../models/User");

const bulkRegisterUsers = async (req, res) => {
  const users = req.body;
  let results = [];

  for (let userData of users) {
    const { firstName, lastName, email, password, dob, role } = userData;

    try {
      const userExists = await User.findOne({ email });
      if (userExists) {
        results.push({
          email,
          status: "failed",
          message: "User already exists",
        });
        continue;
      }

      const newUser = new User({
        firstName,
        lastName,
        email,
        password,
        dob,
        role: role || "user",
      });

      await newUser.save();

      results.push({
        email,
        status: "success",
        message: "User created successfully",
      });
    } catch (error) {
      console.error(`Error creating user ${email}: ${error}`);
      results.push({
        email,
        status: "failed",
        message: "Server error",
      });
    }
  }
  res.status(200).json({
    message: "Bulk user registration complete",
    results,
  });
};

module.exports = { bulkRegisterUsers };
