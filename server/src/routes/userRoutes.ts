import express from "express";
import userAuth from "../middlewares/userAuth";

const {
  deleteUser,
  updateUser,
  getUserData,
  getCart,
  addNewLocation,
  removeLocation,
} = require("../controllers/userController");

const router = express.Router();

//* Middleware to check the user authentication using JWT
router.use(userAuth); // Send: 401, 404

//* add new location to the user
//! PUT http://localhost:3000/api/v1/user/location/add
router.put("/location/add", addNewLocation); // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error" })

//* remove a location based on his name from the user locations array
//! PUT http://localhost:3000/api/v1/user/location/remove
router.put("/location/remove", removeLocation); // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error" })

//* get the orders in the users cart
//! GET http://localhost:3000/api/v1/user/cart
router.get("/cart", getCart); // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", cart?: Order[] })

//* Delete a registered user
//! DELETE http://localhost:3000/api/v1/user
router.delete("/", deleteUser); // Send: 200, 400 404, 500 ({ message: string, status: "Success" | "Error" })

//* Update a registered user
//! PUT http://localhost:3000/api/v1/user
router.put("/", updateUser); // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error", user? : User})

//* Get the data of a user
//! GET http://localhost:3000/api/v1/user
router.get("/", getUserData); // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", user?: User})

module.exports = router;
