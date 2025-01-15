// Libraries
import express from "express";

// Middlewares
import userAuth from "../middlewares/userAuth";

// Functions
const {
  getUserLastOrders,
  editOrder,
  sendOrders,
  GetOrderData,
} = require("../controllers/ordersController");

const router = express.Router();

//* Middleware to check the user authentication using JWT
router.use(userAuth); // Send: 401, 500 ({ message: string, status: "Error" })

//* Get the user's last orders
//! GET http://localhost:300/api/v1/orders/last
router.get("/last", getUserLastOrders); // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", orders?: Order })

//* Update the user's cart
//! PUT http://localhost:3000/api/v1/orders
router.put("/", editOrder); // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error "})

//* "Send" the user orders to the shops
//! GET http://localhost:3000/api/v1/orders/send
router.get("/send", sendOrders); // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

//* Get the order data
//! GET http://localhost:3000/api/v1/orders/:id
router.get("/:id", GetOrderData); // Send: 200, 400, 403, 404, 500 ({ message?: string, status: "Success" | "Error", order?: Order })

module.exports = router;
