import { Request, Response } from "express";
import { RequestWithUserID } from "../types/expressType";
import Shop, { IShop } from "../models/Shop-model";
import Item, { IItem } from "../models/Item-model";
import User, { IUser } from "../models/User-model";
import Order, { IOrder } from "../models/Order-model";
import { Types } from "mongoose";
import Review from "src/types/reviewType";

//* Get the data of the given store
//! GET http://localhost:3000/api/v1/shop/:id
const getShopData = async (req: Request, res: Response) => {
  try {
    const shopId = req.params.id;
    const shop = await Shop.findById(shopId).populate("menu");
    if (!shop) {
      return res
        .status(404)
        .send({ status: "Error", message: "There is no shop with that id" });
    }
    return res.send({ status: "Success", shop });
  } catch (err: any) {
    return res.status(500).send({
      message: err.message || "An unknown error occurred",
      status: "Error",
    });
  }
}; // Send: 200, 404, 500 ({ message?: string, status: "Success" | "Error", shop?: Shop })

//* Adding new review on shop
//! POST http://localhost:3000/api/v1/shop/:id/review
const addNewReview = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = await User.findById(userID).populate({
        path: "lastOrders",
        select: "shop",
      });
      if (!user) {
        return res.status(404).send({
          status: "Error",
          message: `There is no user with that id`,
        });
      }
      const shopID = req.params.id;
      const isShopInUsersOrders = user.lastOrders.some((order) => {
        const currentOrder = order as IOrder;
        return currentOrder.shop.toString() === shopID;
      });
      if (!isShopInUsersOrders) {
        return res.status(403).send({
          status: "Error",
          message: "User must first order from that shop before adding reviews",
        });
      }
      const shop = (await Shop.findById(shopID)) as IShop;
      const { rating, comment } = req.body;
      if (!rating || rating > 10 || rating < 1) {
        return res.status(400).send({
          status: "Error",
          message: "Rating must be valid number between 1 to 10",
        });
      }
      const newReview: Review = { user: new Types.ObjectId(userID), rating };
      if (comment) {
        newReview.comment = comment;
      }
      shop.reviews.push(newReview);
      res.status(201).send({
        status: "Success",
        message: "New review was added successfully",
      });
      shop.save();
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
}; // Send: 201, 400, 401, 403, 404 500 ({ message: string, status: "Success" | "Error" })

//* Get the last order the user made from this shop
//! GET http://localhost:3000/api/v1/shop/:id/last-order
const getShopLastOrder = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;

  if (userID) {
    const shopID = req.params.id;

    try {
      const shop = await Shop.findById(shopID);

      if (!shop) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no shop with that id" });
      }
      const orders = (await Order.find({
        user: userID,
        shop: shopID,
      })
        .sort({ date: -1 })
        .populate({
          path: "items.product",
          model: "Item",
        })) as IOrder[];
      if (orders.length === 0) {
        return res.status(204).send();
      }
      res.send({ status: "Success", order: orders[0] });
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
}; // Send: 200, 204, 401 404, 500 ({ message?: string, status?: "Success" | "Error", order?: Order })

//* Get all the shops
//! GET http://localhost:3000/api/v1/shop/all
const getAllShops = async (req: RequestWithUserID, res: Response) => {
  try {
    res.send({ status: "Success", shops: await Shop.find() });
  } catch (err: any) {
    return res.status(500).send({
      message: err.message || "An unknown error occurred",
      status: "Error",
    });
  }
}; // Send: 200, 500 ({ message?: string, status: "Success" | "Error", shops?: Shop[] })

//* Get all the shops in a category
//! GET http://localhost:3000/api/v1/shop/category/:category
const getShopsByCategory = async (req: RequestWithUserID, res: Response) => {
  const { category } = req.params;
  if (category) {
    try {
      const shops = await Shop.find({ categories: category });

      if (shops.length === 0) {
        return res.status(404).send({
          status: "Error",
          message: `No shops found for the category: ${category}`,
        });
      }

      return res.send({ status: "Success", shops });
    } catch (err: any) {
      return res.status(500).send({
        message: err.message || "An unknown error occurred",
        status: "Error",
      });
    }
  } else {
    res.status(400).send({ status: "Error", message: "No category was given" });
  }
}; // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", shops?: shop[] })

module.exports = {
  getShopData,
  addNewReview,
  getShopLastOrder,
  getAllShops,
  getShopsByCategory,
};

// return res
// .status(401)
// .send({ message: "User not authenticated", status: "Error" });
