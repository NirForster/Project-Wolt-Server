import { Request, Response } from "express";
import User from "../models/User-model";
import { emailValidate, phoneValidate } from "../utils/dataValidate";
import { RequestWithUserID } from "src/types/expressType";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//* Sign up with new user
//! POST http://localhost:3000/api/v1/auth/signup
const signup = async (req: Request, res: Response) => {
  const { email, password, fname, lname, phone } = req.body;
  if (!email || !password || !fname || !phone) {
    return res.status(400).send({
      message: `Some fields (${email ? "" : " email "}${
        password ? "" : " password "
      }${fname ? "" : " first name "}${phone ? "" : " phone "}) are missing!`,
      status: "Error",
    });
  }
  // Validate data
  if (!emailValidate(email)) {
    return res
      .status(400)
      .send({ message: "Email must have the '@' character", status: "Error" });
  }
  if (!phoneValidate(phone)) {
    return res.status(400).send({
      message: "Phone must be made of 10 digits only",
      status: "Error",
    });
  }
  if (password.length < 5) {
    return res.status(400).send({
      message: "Password must contain at least 5 letters (minimum)",
      status: "Error",
    });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      fname,
      phone,
    });
    if (lname) {
      newUser.lname = lname;
      newUser.save();
    }
    const jwtSecret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ userID: newUser._id }, jwtSecret, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      // httpOnly: true,
      sameSite: "strict",
    });
    res.status(201).send({
      status: "Success",
      user: newUser,
    });
  } catch (err: any) {
    res.status(500).send({
      message: err?.message || "An unknown error occurred",
      status: "Error",
    });
  }
}; // Send: 201, 400, 500 ({ message?: string, status: "Success" | "Error", user?: User })

//* Log in with registered user
//! POST http://localhost:3000/api/v1/auth/login
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({
      message: `Some fields (${email ? "" : " email "}${
        password ? "" : " password "
      }) are missing!`,
      status: "Error",
    });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .send({ message: "There is no user with that email", status: "Error" });
  }
  try {
    bcrypt.compare(password, user.password, (err: Error, result: boolean) => {
      const jwtSecret = process.env.JWT_SECRET as string;
      const token = jwt.sign({ userID: user._id }, jwtSecret, {
        expiresIn: "1d",
      });
      if (err) {
        throw err;
      }
      if (result) {
        res.cookie("token", token, {
          // httpOnly: true,
          sameSite: "strict",
        });
        res.send({
          status: "Success",
          user,
        });
      } else {
        res.status(401).send({ message: "Invalid password!", status: "Error" });
      }
    });
  } catch (err: any) {
    res.status(500).send({
      message: err?.message || "An unknown error occurred",
      status: "Error",
    });
  }
}; // Send: 200, 401, 404,  500 ({ message: string, status: "Success" | "Error", user?: User })

//* Log out from registered user
//! GET http://localhost:3000/api/v1/auth/logout
const logout = async (req: Request, res: Response) => {
  res.cookie("token", "", {
    maxAge: 1, // Expires immediately
    httpOnly: true,
    sameSite: "strict",
  });
  res
    .status(200)
    .send({ message: "Logged out successfully", status: "Success" });
}; // Send: 200 ({ message: string, status: "Success" })

//* Fetch the current logged-in user
//! GET http://localhost:3000/api/v1/auth/me
const getCurrentUser = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID; // userID is set by the userAuth middleware
  if (!userID) {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }

  try {
    const user = await User.findById(userID).select("-password"); // Avoid sending password in response
    if (!user) {
      return res
        .status(404)
        .send({ message: "User not found", status: "Error" });
    }
    res.status(200).send({ status: "Success", user });
  } catch (error: any) {
    res.status(500).send({
      message: error.message || "An error occurred while fetching the user",
      status: "Error",
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
};
