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
    res.status(401).send({
      status: "Error",
      message: "Access denied, no token provided",
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET as string;

    if (!jwtSecret) {
      res.status(500).send({
        status: "Error",
        message: "Server configuration error: Missing JWT secret",
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { userID: string };

    req.userID = decoded.userID as string;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).send({
        status: "Error",
        message: "Token expired",
      });
      return;
    } else if (err.name === "JsonWebTokenError") {
      res.status(401).send({
        status: "Error",
        message: "Invalid token",
      });
      return;
    } else {
      // General fallback for unexpected errors
      res.status(500).send({
        status: "Error",
        message: err.message || "An error occurred during authentication",
      });
    }
  }
} // Send: 401 500
