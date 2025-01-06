import express from "express";
import userAuth from "../middlewares/userAuth";

const {
  getShopData,
  editOrder,
  addNewReview,
} = require("../controllers/shopController.ts");

const router = express.Router();

//* Middleware to check the user authentication using JWT
// router.use(userAuth); // Send: 401, 404

//* Add new review on shop
//! POST http://localhost:3000/api/v1/shop/:id/review
router.post("/:id/review", userAuth, addNewReview);

//* Get the data of the given store
//! GET http://localhost:3000/api/v1/shop/:id
router.get("/:id", getShopData);

//* Update the user's cart
//! PUT http://localhost:3000/api/v1/shop
router.put("/", userAuth, editOrder);

module.exports = router;
