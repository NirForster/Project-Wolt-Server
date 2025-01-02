import express from "express";
const {
  deleteUser, //✅
  updateUser, //✅
  getUserData,
} = require("../controllers/userController");

const router = express();

// TODO: add JWT
//* Delete a registered user
//! DELETE http://localhost:3000/api/v1/user/:id
router.delete("/:id", deleteUser); // Send: 200, 404, 500

// TODO: add JWT
//* Update a registered user
//! PUT http://localhost:3000/api/v1/user/:id
router.put("/:id", updateUser);

router.get("/:id", getUserData);

module.exports = router;
