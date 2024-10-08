require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const cookieParser = require("cookie-parser");

//////////////////// Initialize Express app ////////////////////
const app = express();

////////////////////// Connect to MongoDB //////////////////////
connectDB();

////////////////////////// Middleware //////////////////////////
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
//////////////////////////// Routes ////////////////////////////
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

////////////////////////// Test route //////////////////////////
app.get("/", (req, res) => res.send("API is running..."));

///////////////////////// Start server /////////////////////////
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
