import express from "express";
import userAuth from "../middlewares/userAuth";

const { getShopData, editOrder } = require("../controllers/shopController.ts");

const router = express.Router();

//* Middleware to check the user authentication using JWT
router.use(userAuth); // Send: 401, 404

router.put("/", editOrder);

//* Get the data of the given store
//! GET http://localhost:3000/api/v1/shop/:id
router.get("/:id", getShopData);

module.exports = router;
