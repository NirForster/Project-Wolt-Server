// Libraries
import express from "express";

// Middlewares
import userAuth from "../middlewares/userAuth";

// Functions
const {
  getUserFavoritesShops,
  addToFavorites,
  removeFromFavorites,
  isInFavorites,
} = require("../controllers/favoritesController");

const router = express.Router();

//* Middleware to check the user authentication using JWT
router.use(userAuth); // Send: 401, 500 ({ message: string, status: "Error" })

router.get("/:id", isInFavorites);

//* Get all the user's favorites shops (populated together)
//! GET http://localhost:3000/api/v1/favorites
router.get("/", getUserFavoritesShops); // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error",  favoritesShops?: Restaurant[] })

//* Add new shop to the user favorites
//! PUT http://localhost:3000/api/v1/favorites/add
router.put("/add", addToFavorites); // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

//* Remove a shop from the user favorites
//! PUT http://localhost:3000/api/v1/favorites/remove
router.put("/remove", removeFromFavorites); // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

module.exports = router;
