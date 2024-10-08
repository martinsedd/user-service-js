const app = require("./app");
const PORT = process.env.PORT || 5001;

/**
 * @description Starts the Express server on the specified port.
 * If the `PORT` environment variable is set, the server uses that, otherwise it defaults to port 5001.
 * Once the server is running, a message is logged to the console with the active port number.
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
