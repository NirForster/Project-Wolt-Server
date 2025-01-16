// Libraries
import express from "express";

// Middlewares
import userAuth from "../middlewares/userAuth";

// Functions
const {
  getShopData,
  addNewReview,
  getShopLastOrder,
  getAllShops,
  // getShopsByCategory,
} = require("../controllers/shopController.ts");

const router = express.Router();

//* Add new review on shop
//! POST http://localhost:3000/api/v1/shop/:id/review
router.post("/:id/review", userAuth, addNewReview); // Send: 201, 400, 401, 403, 404 500 ({ message: string, status: "Success" | "Error" })

//* Get the last order the user made from this shop
//! GET http://localhost:3000/api/v1/shop/:id/last-order
router.get("/:id/last-order", userAuth, getShopLastOrder); // Send: 200, 204, 401 404, 500 ({ message?: string, status?: "Success" | "Error", orders?: Order[] })

//* Get all the shops
//! GET http://localhost:3000/api/v1/shop/all
router.get("/all", getAllShops); // Send: 200, 500 ({ message?: string, status: "Success" | "Error", shops?: Shop[] })

// //* Get all the shops in a category
// //! GET http://localhost:3000/api/v1/shop/category/:category
// router.get("/category/:category", getShopsByCategory); // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", shops?: shop[] })

//* Get the data of the given store
//! GET http://localhost:3000/api/v1/shop/:id
router.get("/:id", getShopData); // Send: 201, 400, 403, 404, 500 ({ message?: string, status: "Success" | "Error", shop?: Restaurant, menu?: NewItem })

module.exports = router;
