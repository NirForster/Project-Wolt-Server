import express from "express";
const {
  signup, //✅
  login, //✅
  logout,
} = require("../controllers/authController");

const router = express();

//* Sign up with new user
//! POST http://localhost:3000/api/v1/auth/signup
router.post("/signup", signup); // Send: 201, 400, 500

//* Log in with registered user
//! POST http://localhost:3000/api/v1/auth/login
router.post("/login", login); // Send: 200, 401, 404,  500

//* Log out from registered user
//! POST http://localhost:3000/api/v1/auth/logout
router.post("/logout", logout);

module.exports = router;

// TODO: add JWT to the functions, do logout
