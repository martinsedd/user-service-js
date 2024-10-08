const jwt = require("jsonwebtoken");

/**
 * @function protect
 * @description Middleware to protect routes by ensuring that the user is authenticated.
 * It checks for the presence of a JWT token in the request cookies. If a valid token is found, it decodes the token and attaches the user information to `req.user`. If not, it returns a 401 Unauthorized response.
 *
 * @param {Object} req - Express request object containing cookies.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express middleware next function to pass control to the next middleware.
 * @returns {void} - Sends a 401 Unauthorized response if no token or an invalid token is provided.
 */
const protect = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

/**
 * @function roleCheck
 * @description Middleware to restrict access to routes based on user roles.
 * It takes an array of roles and checks if the user's role (from `req.user`) is included. If not, it returns a 403 Forbidden response.
 *
 * @param {Array<string>} roles - Array of allowed roles (e.g., ["admin", "user"]).
 * @returns {Function} Middleware function that checks the user's role and either passes control to the next middleware or sends a 403 response.
 */
const roleCheck = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied, insufficient permissions" });
    }
    next();
  };
};

module.exports = { protect, roleCheck };
