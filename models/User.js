const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * @schema userSchema
 * @description Defines the structure of the User model using Mongoose.
 * It includes user details such as name, email, password, date of birth, and role, along with fields for handling password reset functionality and account lockout due to too many failed attempts.
 */
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true }, // User's first name (required)
    lastName: { type: String, required: true }, // User's last name (required)
    email: { type: String, unique: true, required: true }, // User's email, must be unique (required)
    password: { type: String, required: true }, // User's hashed password (required)
    dob: { type: Date, required: true }, // User's date of birth (required)
    role: {
      type: String,
      enum: ["user", "admin"], // User's role, restricted to "user" or "admin"
      required: true,
      default: "user", // Default role is "user"
    },
    resetPasswordToken: String, // Token used for password reset functionality
    resetPasswordExpire: Date, // Expiration date of the password reset token
    failedResetAttempts: { type: Number, default: 0 }, // Track failed password reset attempts
    lockUntil: { type: Number }, // Account lock timestamp due to too many failed attempts
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

/**
 * @pre-save hook
 * @description This pre-save hook hashes the user's password using bcrypt before saving it to the database.
 * It only hashes the password if it has been modified.
 *
 * @param {Function} next - Calls the next middleware function in the stack.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password hasn't changed

  const salt = await bcrypt.genSalt(10); // Generate salt for hashing
  this.password = await bcrypt.hash(this.password, salt); // Hash the password
  next(); // Continue to the next middleware
});

/**
 * @method comparePassword
 * @description Compares the provided plain text password with the hashed password stored in the database.
 *
 * @param {string} enteredPassword - The plain text password to be compared.
 * @returns {Promise<boolean>} - Returns true if the passwords match, otherwise false.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password); // Compare passwords
};

module.exports = mongoose.model("User", userSchema);
