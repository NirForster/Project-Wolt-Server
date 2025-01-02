import { Request, Response } from "express";
import User from "../models/User-model";
import { emailValidate, phoneValidate } from "../utils/dataValidate";
const bcrypt = require("bcrypt");

// TODO: add JWT
//* Sign up with new user
//! POST http://localhost:3000/api/v1/auth/signup
const signup = async (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name || !phone) {
    return res
      .status(400)
      .send(
        `Some fields (${email ? "" : "email"} ${password ? "" : "password"} ${
          name ? "" : "name"
        } ${phone ? "" : "phone"}) are missing!`
      );
  }
  // Validate data
  if (!emailValidate(email)) {
    return res.status(400).send("Email must have the '@' character ");
  }
  if (!phoneValidate(phone)) {
    return res.status(400).send("Phone must be made of 10 digits only");
  }
  if (password.length < 5) {
    return res
      .status(400)
      .send("Password must contain at least 5 letters (minimum)");
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
    });
    res
      .status(201)
      .send({ message: "New user was successfully signed up!", user: newUser });
  } catch (err: any) {
    res.status(500).send(err?.message || "An unknown error occurred");
  }
}; // Send: 201, 400, 500

// TODO: add JWT
//* Log in with registered user
//! POST http://localhost:3000/api/v1/auth/login
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .send(
        `Some fields (${email ? "" : "email"} ${
          password ? "" : "password"
        }) are missing!`
      );
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send("There is no user with that email");
  }
  try {
    bcrypt.compare(password, user.password, (err: Error, result: boolean) => {
      console.log("-------------------------------------------");
      console.log(result);
      console.log("-------------------------------------------");
      if (err) {
        throw err;
      }
      if (result) {
        res.send({ message: "User was successfully logged in!", user });
      } else {
        res.status(401).send("Invalid password!");
      }
    });
  } catch (err: any) {
    res.status(500).send(err?.message || "An unknown error occurred");
  }
}; // Send: 200, 401, 404,  500

// TODO
//* Log out from registered user
//! POST http://localhost:3000/api/v1/auth/logout
const logout = async (req: Request, res: Response) => {};

module.exports = {
  signup, //✅
  login, //✅
  logout,
};
