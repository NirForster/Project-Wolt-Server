// Libraries
import { Response } from "express";
const bcrypt = require("bcrypt");

// Request type
import { RequestWithUserID } from "src/types/expressType";

// Models
import User, { IUser } from "../models/User-model";
import OrderItem, { IOrderItem } from "../models/Order-item-model";

// Handler functions
import { emailValidate, phoneValidate } from "../utils/dataValidate";

//* Delete a registered user
//! DELETE http://localhost:3000/api/v1/user/:id
const deleteUser = async (req: RequestWithUserID, res: Response) => {
  const id = req.userID;
  if (id) {
    try {
      const user = await User.findByIdAndDelete(id);
      if (user) {
        res.cookie("token", "", {
          maxAge: 1,
          // httpOnly: true,
          sameSite: "strict",
        });
        res.send({ status: "Success", message: "User deleted!" });
      } else {
        res
          .status(404)
          .send({ status: "Error", message: "There is no user with that id" });
      }
    } catch (err: any) {
      res.status(500).send({
        message: err?.message || "An unknown error occurred",
        status: "Error",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 401 404, 500 ({ message: string, status: "Success" | "Error" })

//* Update a registered user
//! PUT http://localhost:3000/api/v1/user/:id
const updateUser = async (req: RequestWithUserID, res: Response) => {
  const id = req.userID;
  if (id) {
    try {
      const user = await User.findById(id);

      if (user) {
        const { email, fname, lname, photo, phone } = req.body;
        if (email) {
          if (emailValidate(email)) {
            user.email = email;
          } else {
            return res.status(400).send({
              status: "Error",
              message: "Email must have the '@' character ",
            });
          }
        }
        // if (password) {
        //   if (password.length >= 5) {
        //     const hashedPassword = await bcrypt.hash(password, 10);
        //     user.password = hashedPassword;
        //   } else {
        //     return res.status(400).send({
        //       status: "Error",
        //       message: "Password must contain at least 5 letters (minimum)",
        //     });
        //   }
        // }
        if (phone) {
          if (phoneValidate(phone)) {
            user.phone = `0${phone}`;
          } else {
            return res.status(400).send({
              status: "Error",
              message: "Phone must be made of 10 digits only",
            });
          }
        }
        user.fname = fname ? fname : user.fname;
        user.lname = lname ? lname : user.lname;
        user.photo = photo ? photo : user.photo;

        await user.save();
        res.send({
          status: "Success",
          user: { ...user.toObject(), password: "" },
        });
      } else {
        res
          .status(404)
          .send({ status: "Error", message: "There is no user with that id" });
      }
    } catch (err: any) {
      res.status(500).send({
        message: err?.message || "An unknown error occurred",
        status: "Error",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 400, 401, 404, 500 ({ message?: string, status: "Success" | "Error", user? : User })

//* Get the data of a user
//! GET http://localhost:3000/api/v1/user
const getUserData = async (req: RequestWithUserID, res: Response) => {
  const id = req.userID;
  if (id) {
    try {
      const user = (await User.findById(id)) as IUser;
      if (user) {
        return res.send({
          status: "Success",
          user: { ...user.toObject(), password: "" },
        });
      } else {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that id" });
      }
    } catch (err: any) {
      return res.status(500).send({
        message: err.message || "An unknown error occurred",
        status: "Error",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", user?: User })

//* get the orders in the users cart
//! GET http://localhost:3000/api/v1/user/cart
const getCart = async (req: RequestWithUserID, res: Response) => {
  // const baba = OrderItem;
  const userID = req.userID;
  if (userID) {
    try {
      console.log("my name");

      const user = (await User.findById(userID).populate({
        path: "cart",
        populate: [
          {
            path: "shop",
            model: "newBusiness",
            select: "-deliveryFeeStructure -deliveryTimes -openingTimes",
          }, // Populate shop details
          { path: "items", model: "OrderItem" }, // Populate items array
        ],
      })) as IUser;
      console.log("is jeff");
      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that ID" });
      }
      res.send({ status: "Success", cart: user.cart });
    } catch (err: any) {
      return res.status(500).send({
        status: "Error",
        message: err.message || "Unknown error has accrued",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", cart?: Order[] })

//* add new location to the user locations
//! PUT http://localhost:3000/api/v1/user/locations/add
const addNewLocation = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = (await User.findById(userID)) as IUser;
      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that ID" });
      }
      const { type, address } = req.body;
      if (!type || !address) {
        return res.status(400).send({
          status: "Error",
          message: `Missing the ${type ? "address" : "type"} field`,
        });
      }
      user.locations.push({ type, address, isLast: false });
      await user.save();
      return res.send({ status: "Success", message: "Location was added" });
    } catch (err: any) {
      return res.status(500).send({
        status: "Error",
        message: err.message || "Unknown error has accrued",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

//* remove a location from the user locations
//! PUT http://localhost:3000/api/v1/user/locations/remove
const removeLocation = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = (await User.findById(userID)) as IUser;
      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that ID" });
      }
      const { address } = req.body;
      if (!address) {
        return res.send({ status: "Error", message: "Missing address field" });
      }
      const locIndex = user.locations.findIndex((loc) => {
        return loc.address.toLowerCase() === address.toLowerCase();
      });
      if (locIndex === -1) {
        return res.status(400).send({
          status: "Error",
          message: "The user don't have a location with that address",
        });
      }
      user.locations.splice(locIndex, 1);
      await user.save();
      return res.send({ status: "Success", message: "Location was removed" });
    } catch (err: any) {
      return res.status(500).send({
        status: "Error",
        message: err.message || "Unknown error has accrued",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

//* get all the user's locations
//! GET http://localhost:3000/api/v1/user/locations
const getLocations = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = (await User.findById(userID)) as IUser;
      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that ID" });
      }
      return res.send({ status: "Success", locations: user.locations });
    } catch (err: any) {
      return res.status(500).send({
        status: "Error",
        message: err.message || "Unknown error has accrued",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", locations?: {type: "Home" | "Work" | "Other", address: string, isLast: boolean }[] })

//* Set the last location to the one that was received
//! PUT http://localhost:3000/api/v1/user/locations/last
const setLastLocation = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = await User.findById(userID);
      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that ID" });
      }
      const { currentAddress } = req.body;
      let hasFound = false;
      const newLocations = user.locations.map((loc) => {
        const address = loc.address;
        if (address === currentAddress) {
          hasFound = true;
          return { type: loc.type, address, isLast: true };
        }
        return { type: loc.type, address, isLast: false };
      });
      if (hasFound) {
        user.locations = newLocations;
        user.save();
        return res.send({
          status: "Success",
          message: `The address ${currentAddress} was saved as Last location`,
        });
      } else {
        return res.status(404).send({
          status: "Error",
          message: "There is no such address in the user locations",
        });
      }
    } catch (err: any) {
      return res.status(500).send({
        status: "Error",
        message: err.message || "An unknown error had accrued",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

module.exports = {
  deleteUser,
  updateUser,
  getUserData,
  getCart,
  addNewLocation,
  removeLocation,
  getLocations,
  setLastLocation,
};
