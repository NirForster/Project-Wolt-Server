// Libraries
import { Response } from "express";
import { Types } from "mongoose";

// Request type
import { RequestWithUserID } from "src/types/expressType";

// Models
import User, { IUser } from "../models/User-model";

//* Get all the user's favorites shops (populated together)
//! GET http://localhost:3000/api/v1/favorites
const getUserFavoritesShops = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = await User.findById(userID).populate("favoritesShops");
      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that ID" });
      }
      return res.send({
        status: "Successes",
        favoritesShops: user.favoritesShops,
      });
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
}; // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error",  favoritesShops?: Restaurant[] })

//* Add new shop to the user favorites
//! PUT http://localhost:3000/api/v1/favorites/add
const addToFavorites = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = await User.findById(userID);
      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that ID" });
      }
      const { shopID } = req.body;
      const alreadyIn = user.favoritesShops.some((shop) => {
        return shop.toString() === shopID.toString();
      });
      if (alreadyIn) {
        return res.status(400).send({
          status: "Error",
          message: "This shop already part of the user's favorites shops",
        });
      }
      user.favoritesShops.push(shopID);
      user.save();
      res.send({
        status: "Success",
        message: "Added to this user's favorites shop list",
      });
    } catch (err: any) {
      return res.status(500).send({
        message: err?.message || "An unknown error occurred",
        status: "Error",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 400, 401 404, 500 ({ message: string, status: "Success" | "Error" })

//* Remove a shop from the user favorites
//! PUT http://localhost:3000/api/v1/favorites/remove
const removeFromFavorites = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = (await User.findById(userID)) as IUser;
      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that ID" });
      }
      const { shopID } = req.body;
      const isIn = user.favoritesShops.some((shop) => {
        return shop.toString() === shopID.toString();
      });
      if (isIn) {
        user.favoritesShops = (user.favoritesShops as Types.ObjectId[]).filter(
          (restaurant) => {
            const restaurantId = restaurant as Types.ObjectId;
            return restaurantId.toString() !== shopID.toString();
          }
        );
        user.save();
        return res.send({
          status: "Success",
          message: "Deleted from this user's favorites shops list",
        });
      }
      res.status(400).send({
        status: "Error",
        message: "This shop is not part of the users' favorites shops",
      });
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
}; // Send: 200, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

module.exports = {
  getUserFavoritesShops,
  addToFavorites,
  removeFromFavorites,
};
