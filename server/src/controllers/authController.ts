// Libraries
import { Request, Response } from "express";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Request type
import { RequestWithUserID } from "src/types/expressType";

// Models
import User, { IUser } from "../models/User-model";

// Handler functions
import { emailValidate, phoneValidate } from "../utils/dataValidate";

// Generic function
function getToken(userID: string, expiresIn: string = "1d") {
  const jwtSecret = process.env.JWT_SECRET as string;
  return jwt.sign({ userID }, jwtSecret, {
    expiresIn,
  });
}

function getDecoded(token: string) {
  const jwtSecret = process.env.JWT_SECRET as string;
  if (!jwtSecret) {
    return "";
  }
  const decoded = jwt.verify(token, jwtSecret) as { userID: string };
  return decoded.userID;
}

//* Sign up with new user
//! POST http://localhost:3000/api/v1/auth/signup
const signup = async (req: Request, res: Response) => {
  const { email, fname, lname, phone } = req.body;
  if (!email || !fname || !phone) {
    return res.status(400).send({
      message: `Some fields (${email ? "" : " email "}
      ${fname ? "" : " first name "}${phone ? "" : " phone "}) are missing!`,
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

  try {
    const newUser = await User.create({
      email,
      // password: hashedPassword,
      fname,
      phone: `0${phone}`,
    });
    if (lname) {
      newUser.lname = lname;
      newUser.save();
    }
    const token = getToken(newUser.id.toString());
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
    });
    res.status(201).send({
      status: "Success",
      user: { ...newUser.toObject(), password: "" },
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
  console.log(req.body);

  const { token } = req.body;
  if (!token) {
    res.status(404).send({ status: "Error", message: "No token was supplied" });
  }
  const email = getDecoded(token);
  if (!email) {
    return res.status(400).send({
      message: `missing email field`,
      status: "Error",
    });
  }
  console.log(email);

  const user = (await User.findOne({ email })) as IUser;
  if (!user) {
    return res
      .status(400)
      .send({ message: "There is no user with that email", status: "Error" });
  }

  try {
    const token = getToken(user.id.toString());
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
    });
    res.send({
      status: "Success",
      user,
    });
  } catch (err: any) {
    res.status(500).send({
      message: err?.message || "An unknown error occurred",
      status: "Error",
    });
  }
}; // Send: 200, 400, 401, 500 ({ message?: string, status: "Success" | "Error", user?: User })

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
    res.send({ status: "Success", user });
  } catch (error: any) {
    res.status(500).send({
      message: error.message || "An error occurred while fetching the user",
      status: "Error",
    });
  }
}; // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", user?: User })

const sendEmail = async (req: Request, res: Response) => {
  const BASE_URL = "http://localhost:5173";
  const { email, lastURL } = req.body;
  try {
    const token = getToken(email, "15m");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "wolt8767@gmail.com", // Replace with your Gmail
        pass: "nvlv ffxt hfdm jxxo", // Replace with your App Password
      },
    });
    const isNewUser = await User.exists({ email: email });

    let htmlBuild = "";
    const signupURL = `${BASE_URL}${lastURL}?email=${email}`;
    const loginURL = `${BASE_URL}/login?token=${token}&lasturl=${encodeURIComponent(
      lastURL
    )}`;
    if (!isNewUser) {
      htmlBuild = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: space-around border-top: 2px solid #039DE0;">
        <img src="../assets/photos/wolt-logo.png" alt="wolt logo"/>
        <p>היי, גם אנחנו רעבים אז נעשה את זה קצר: לחיצה אחת על הכפתור למטה וכבר יהיה לך חשבון ב-Wolt</p>
        <a styles="height: 50px; width: 140px; background-color: #039DE0; color: white" href="${signupURL}">Create new profile in Wolt</a>
        </div>`;
    } else {
      htmlBuild = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: space-around border-top: 2px solid #039DE0;">
        <img src="../assets/photos/wolt-logo.png" alt="wolt logo"/>
        <p>היי, גם אנחנו רעבים אז נעשה את זה קצר: כדי להיכנס לאפליקציה צריך ללחוץ על הכפתור. משלוח Wolt שמח! משלוח Wolt שמח!</p>
        <a styles="height: 50px; width: 140px; background-color: #039DE0; color: white" href="${loginURL}">Enter your profile</a>
      </div>`;
    }
    const mailOptions = {
      from: "wolt8767@gmail.com",
      to: email,
      subject: isNewUser ? "Happy to see you" : "Enter your Wolt account",
      html: htmlBuild,
    };

    await transporter.sendMail(mailOptions);
    res.send({ message: "Email sent", status: "Success" });
  } catch (err: any) {
    res.status(500).send({ message: "Email was not sent", status: "Error" });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  sendEmail,
};
