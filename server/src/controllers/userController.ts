import { Request, Response } from "express";
import User from "../models/User-model";
import { emailValidate, phoneValidate } from "../utils/dataValidate";

const bcrypt = require("bcrypt");

// TODO: add JWT
//* Delete a registered user
//! DELETE http://localhost:3000/api/v1/user/:id
const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id) {
    try {
      await User.findByIdAndDelete(id);
      res.send("User deleted!");
    } catch (err) {
      res.status(500).send("Server error!");
    }
  } else {
    res.status(404).send("There is no user with that id");
  }
}; // Send: 200, 404, 500

// TODO: add JWT
//* Update a registered user
//! PUT http://localhost:3000/api/v1/user/:id
const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (user) {
      const { email, password, fname, lname, photo, phone } = req.body;
      if (email) {
        if (emailValidate(email)) {
          user.email = email;
        } else {
          return res.status(400).send("Email must have the '@' character ");
        }
      }
      if (password) {
        if (password.length >= 5) {
          const hashedPassword = await bcrypt.hash(password, 10);
          user.password = hashedPassword;
        } else {
          return res
            .status(400)
            .send("Password must contain at least 5 letters (minimum)");
        }
      }
      if (phone) {
        if (phoneValidate(phone)) {
          user.phone = phone;
        } else {
          return res.status(400).send("Phone must be made of 10 digits only");
        }
      }
      user.fname = fname ? fname : user.fname;
      user.lname = lname ? lname : user.lname;
      user.photo = photo ? photo : user.photo;

      await user.save();
      res.send({ message: "User updated", user });
    }
  } catch (err: any) {
    res.status(500).send(err?.message);
  }
}; // Send: 200, 400, 404, 500

const getUserData = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send("There is no user with that id");
    }
  } catch (err: any) {
    res.status(500).send(err?.message);
  }
}; // Send: 200, 404, 500

module.exports = {
  deleteUser, //✅
  updateUser, //✅
  getUserData,
};
