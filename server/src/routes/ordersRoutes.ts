import express from "express";
import userAuth from "../middlewares/userAuth";

const { getOrdersByUser } = require("../controllers/ordersController.ts");

const router = express.Router();

//* Middleware to check the user authentication using JWT
router.use(userAuth); // Send: 401, 404

//* Get all the user's orders
//! GET http://localhost:3000/api/v1/user/:id/orders
router.get("/", getOrdersByUser);

module.exports = router;
