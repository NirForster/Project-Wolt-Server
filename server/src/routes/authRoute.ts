import express from "express";
const {
  signup,
  login,
  logout,
  deleteUser,
} = require("../controllers/authController");

const router = express();

//* Sign up with new user
//! POST http://localhost:3000/api/v1/users/signup
router.post("/signup", signup); // Send: 201, 400, 500

//* Log in with registered user
//! POST http://localhost:3000/api/v1/users/login
router.post("/login", login); // Send: 200, 401, 404,  500

//* Log out from registered user
//! POST http://localhost:3000/api/v1/users/logout
router.post("/logout", logout);

//* Delete a registered user
//! DELETE http://localhost:3000/api/v1/users/:id
router.delete("/:id", deleteUser); // Send 200, 404, 500

module.exports = router;
