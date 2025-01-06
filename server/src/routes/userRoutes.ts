import express from "express";
import userAuth from "../middlewares/userAuth";

const {
  deleteUser,
  updateUser,
  getUserData,
  getUserLastOrders,
} = require("../controllers/userController");

const router = express.Router();

//* Middleware to check the user authentication using JWT
router.use(userAuth); // Send: 401, 404

//* Delete a registered user
//! DELETE http://localhost:3000/api/v1/user
router.delete("/", deleteUser); // Send: 200, 400 404, 500 ({ message: string, status: "Success" | "Error" })

//* Update a registered user
//! PUT http://localhost:3000/api/v1/user
router.put("/", updateUser); // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error", user? : User})

//* Get the user's last orders
//! GET http://localhost:300/api/v1/user/last-orders
router.get("last-orders", getUserLastOrders);

//* Get the data of a user
//! GET http://localhost:3000/api/v1/user
router.get("/", getUserData); // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", user?: User})

module.exports = router;
