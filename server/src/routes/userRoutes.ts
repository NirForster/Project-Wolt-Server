import express from "express";
import userAuth from "../middlewares/userAuth";

const {
  deleteUser,
  updateUser,
  getUserData,
  getCart,
  addNewLocation,
  removeLocation,
  getLocations,
  setLastLocation,
} = require("../controllers/userController");

const router = express.Router();

//* Middleware to check the user authentication using JWT
router.use(userAuth); // Send: 401, 404

//* get all the user's locations
//! GET http://localhost:3000/api/v1/user/locations
router.get("/locations", getLocations); // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", locations?: {type: "Home" | "Work" | "Other", address: string, isLast: boolean }[] })
//* add new location to the user locations
//! PUT http://localhost:3000/api/v1/user/locations/add
router.put("/locations/add", addNewLocation); // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

//* remove a location from the user locations
//! PUT http://localhost:3000/api/v1/user/locations/remove
router.put("/locations/remove", removeLocation); // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

//* Set the last location to the one that was received
//! PUT http://localhost:3000/api/v1/user/locations/last
router.put("/locations/last", setLastLocation); // Send: 200, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

//* get the orders in the users cart
//! GET http://localhost:3000/api/v1/user/cart
router.get("/cart", getCart); // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", cart?: Order[] })

//* Delete a registered user
//! DELETE http://localhost:3000/api/v1/user
router.delete("/", deleteUser); // Send: 200, 401 404, 500 ({ message: string, status: "Success" | "Error" })

//* Update a registered user
//! PUT http://localhost:3000/api/v1/user
router.put("/", updateUser); // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error", user? : User })

//* Get the data of a user
//! GET http://localhost:3000/api/v1/user
router.get("/", getUserData); // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", user?: User })

module.exports = router;
