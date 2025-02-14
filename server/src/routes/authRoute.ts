// Libraries
import express from "express";

// Middlewares
import userAuth from "../middlewares/userAuth";

// Functions
const {
  signup,
  login,
  logout,
  getCurrentUser,
  sendEmail,
} = require("../controllers/authController");

const router = express.Router();

//* Fetch the current logged-in user
//! GET http://localhost:3000/api/v1/auth/me
router.get("/me", userAuth, getCurrentUser); // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", user?: User })

//* Sign up with new user
//! POST http://localhost:3000/api/v1/auth/signup
router.post("/signup", signup); // Send: 201, 400, 500 ({ message?: string, status: "Success" | "Error", user?: User })

//* Log in with registered user
//! POST http://localhost:3000/api/v1/auth/login/:token
router.post("/login", login); // Send: 200, 400, 401, 500 ({ message?: string, status: "Success" | "Error", user?: User })

//* Log out from registered user
//! GET http://localhost:3000/api/v1/auth/logout
router.get("/logout", userAuth, logout); // Send: 200 ({ message: string, status: "Success" })

router.post("/sendemail", sendEmail);

module.exports = router;
