import { NextFunction, Request, Response } from "express";
import User from "../models/User-model";
import { RequestWithUserID } from "src/types/expressType";
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

export default async function userAuth(
  req: RequestWithUserID,
  res: Response,
  next: NextFunction
): Promise<void> {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {}; // ✅ Safely parse cookies
  const token = cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({
      status: "error",
      message: "Access denied, no token provided",
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET as string;

    const decoded = jwt.verify(token, jwtSecret) as { userID: string };
    const user = await User.findById(decoded.userID);

    if (!user) {
      res.status(404).json("User not found");
      return;
    }

    req.userID = user._id as string;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ status: "error", message: "Token expired" });
    } else {
      res.status(401).json({ status: "error", message: "Invalid token" });
    }
  }
} // Send: 401, 404
