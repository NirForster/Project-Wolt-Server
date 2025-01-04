import express from "express";
import userAuth from "../middlewares/userAuth";
const { signup, login, logout } = require("../controllers/authController");

const router = express.Router();

//* Sign up with new user
//! POST http://localhost:3000/api/v1/auth/signup
router.post("/signup", signup); // Send: 201, 400, 500 ({ message: string, status: "Success" | "Error", user?: User })

//* Log in with registered user
//! POST http://localhost:3000/api/v1/auth/login
router.post("/login", login); // Send: 200, 401, 404,  500 ({ message: string, status: "Success" | "Error", user?: User })

//* Log out from registered user
//! GET http://localhost:3000/api/v1/auth/logout
router.get("/logout", userAuth, logout); // Send: 200 ({ message: string, status: "Success" })

module.exports = router;
