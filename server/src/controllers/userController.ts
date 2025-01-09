import { Response } from "express";
import User, { IUser } from "../models/User-model";
import { emailValidate, phoneValidate } from "../utils/dataValidate";
import { RequestWithUserID } from "src/types/expressType";

const bcrypt = require("bcrypt");

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
    res
      .status(400)
      .send({ status: "Error", message: "No user ID was provided" });
  }
}; // Send: 200, 400 404, 500 ({ message: string, status: "Success" | "Error" })

//* Update a registered user
//! PUT http://localhost:3000/api/v1/user/:id
const updateUser = async (req: RequestWithUserID, res: Response) => {
  const id = req.userID;
  if (id) {
    try {
      const user = await User.findById(id);

      if (user) {
        const { email, password, fname, lname, photo, phone } = req.body;
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
        if (password) {
          if (password.length >= 5) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
          } else {
            return res.status(400).send({
              status: "Error",
              message: "Password must contain at least 5 letters (minimum)",
            });
          }
        }
        if (phone) {
          if (phoneValidate(phone)) {
            user.phone = phone;
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
        res.send({ status: "Success", user });
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
    res
      .status(400)
      .send({ status: "Error", message: "No user ID was provided" });
  }
}; // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", user? : User})

//* Get the data of a user
//! GET http://localhost:3000/api/v1/user
const getUserData = async (req: RequestWithUserID, res: Response) => {
  const id = req.userID;
  if (id) {
    try {
      const user = (await User.findById(id)) as IUser;
      if (user) {
        return res.send({ status: "Success", user });
      } else {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that id" });
      }
    } catch (err: any) {
      return res.status(500).send({
        message: err?.message || "An unknown error occurred",
        status: "Error",
      });
    }
  } else {
    return res
      .status(400)
      .send({ status: "Error", message: "No  user ID was provided" });
  }
}; // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", user?: User })

//* get the orders in the users cart
//! GET http://localhost:3000/api/v1/user/cart
const getCart = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = (await User.findById(userID).populate({
        path: "cart",
        populate: [
          { path: "shop", select: "name photo description" },
          { path: "items.product" },
        ],
      })) as IUser;
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
    res.status(400).send({ status: "Error", message: "No id was provided" });
  }
}; // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", cart?: Order[] })

//* add new location to the user
//! PUT http://localhost:3000/api/v1/user/location/add
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
      const { name, address } = req.body;
      if (!name || !address) {
        return res.status(400).send({
          status: "Error",
          message: `Missing the ${name ? "address" : "name"} field`,
        });
      }
      const hasThisName = user.locations.find((loc) => {
        return loc.name.toLowerCase() === name.toLowerCase();
      });
      if (hasThisName) {
        return res.status(400).send({
          status: "Error",
          message: "The user already have a location with that name",
        });
      }
      user.locations.push({ name, address });
      await user.save();
      return res.send({ status: "Success", message: "Location was added" });
    } catch (err: any) {
      return res.status(500).send({
        status: "Error",
        message: err.message || "Unknown error has accrued",
      });
    }
  } else {
    res.status(400).send({ status: "Error", message: "No id was provided" });
  }
}; // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error" })

//* remove a location based on his name from the user locations array
//! PUT http://localhost:3000/api/v1/user/location/remove
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
      const { name } = req.body;
      if (!name) {
        return res.send({ status: "Error", message: "Missing name field" });
      }
      const locIndex = user.locations.findIndex((loc) => {
        return loc.name.toLowerCase() === name.toLowerCase();
      });
      if (locIndex === -1) {
        return res.status(400).send({
          status: "Error",
          message: "The user don't have a location with that name",
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
    res.status(400).send({ status: "Error", message: "No id was provided" });
  }
}; // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error" })

module.exports = {
  deleteUser,
  updateUser,
  getUserData,
  getCart,
  addNewLocation,
  removeLocation,
};
