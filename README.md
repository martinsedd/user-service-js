# User Management Microservice

This is a user management microservice built using Node.js, Express, MongoDB, and JWT for user authentication and role-based access control. It supports user registration, login, password reset requests, and secure password updates. Rate limiting, validation, and account lockout mechanisms are also implemented to enhance security.

## Features

- **User Registration and Login** with JWT-based authentication.
- **Role-based Access Control** to restrict access to certain routes based on user roles (`admin` and `user`).
- **Password Reset Flow** with email verification.
- **Rate Limiting** to protect against brute force attacks.
- **Account Lockout Mechanism** after multiple failed password reset attempts.
- **Password Hashing** with bcrypt to ensure password security.

## Tech Stack

- **Node.js**
- **Express**
- **MongoDB**
- **JWT (JSON Web Token)**
- **bcrypt** for password hashing.
- **Nodemailer** for sending password reset emails.
- **express-validator** for input validation.
- **express-rate-limit** for rate limiting requests.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14 or higher)
- **MongoDB** (running locally or a MongoDB Atlas cluster)
- **npm** (Node package manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/user-management-microservice.git
   cd user-management-microservice

   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a .env file in the root directory with the following environment variables:

   - MONGO_URI=mongodb://localhost:27017/user-management
   - JWT_SECRET
   - SMTP_USER
   - SMTP_PASSWORD
   - PORT=5001
   - NODE_ENV=development

4. Start the MongoDB server locally, or configure a MongoDB Atlas cluster

5. Start the development server:

   ```bash
   npm start
   ```

   The server will start at http://localhost:5001

### Running Tests

To run the tests, use the following command:

```bash
npm test
```

## API Endpoints

### Authentication

    - POST /api/auth/register
    -- Registers a new user.
    -- Request body example:
        {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "password": "password123",
            "dob": "1990-01-01",
            "role": "admin"
        }

    - POST /api/auth/login
    -- Logs in a user and returns a JWT token.
    -- Request body example:
        {
            "email": "john.doe@example.com",
            "password": "password123"
        }

### Password Reset

    - POST /api/auth/request-reset
    -- Initiates a password reset by sending an email with a reset link
    -- Request body example:
        {
            "email": "john.doe@example.com"
        }

    - PUT /api/auth/reset-password
    -- Resets the user's password using the reset token
    -- URL example: http://localhost:5001/api/auth/reset-password?token=<validToken>
    -- Request body example:
        {
            "password": "newpassword123"
        }

### Security Features

    - Password Hashing: User passwords are hashed using bcrypt before being stored in the database.
    - JWT Authentication: Secure JWT-based authentication for routes.
    - Rate Limiting: Password reset requests are rate-limited to prevent abuse.
    - Account Lockout: After three failed password reset attempts, the account is locked for 30 minutes.
    - Input Validation: Requests are validated using express-validator.

## Project Structure

├── app.js # Main app configuration
├── server.js # Server entry point
├── config
│ └── db.js # MongoDB connection configuration
├── controllers
│ └── authController.js # Authentication controllers
├── models
│ └── User.js # User schema and model
├── routes
│ └── authRoutes.js # Authentication routes
├── tests
│ └── auth.test.js # Unit tests for authentication
├── .env.example # Example of environment variables
└── README.md # Documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

If you have any questions, feel free to reach out at [martins.edd04@gmail.com].
