/**
 * connectDB - A function to connect to the MongoDB database using Mongoose.
 * It checks the current environment and skips the database connection if running in a test environment.
 * The connection string is obtained from the `MONGO_URI` environment variable.
 *
 * In case of a connection failure, the application logs an error and terminates the process with an exit code of 1.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} - Returns a resolved promise if connected successfully, or terminates the process on failure.
 */
const mongoose = require("mongoose");

const connectDB = async () => {
  // Skip DB connection in test environment
  if (process.env.NODE_ENV === "test") {
    return;
  }

  try {
    // Connect to the MongoDB instance using the connection string from environment variables
    await mongoose.connect(process.env.MONGO_URI, {});

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error: ", error);

    // Exit process with failure code if connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
