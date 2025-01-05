import { Request, Response } from "express";
import User from "../models/User-model";
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
        res.send({ status: "Success", message: "User updated", user });
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
}; // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error", user? : User})

const getUserData = async (req: RequestWithUserID, res: Response) => {
  const id = req.userID;
  if (id) {
    try {
      const user = await User.findById(id);
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

module.exports = {
  deleteUser,
  updateUser,
  getUserData,
};
