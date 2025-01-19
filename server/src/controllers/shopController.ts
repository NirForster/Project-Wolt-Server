// Libraries
import { Request, Response } from "express";
import { Types } from "mongoose";

// Request type
import { RequestWithUserID } from "../types/expressType";

// Models
import User from "../models/User-model";
import Order, { IOrder } from "../models/Order-model";
import NewItem from "../models/items-modal";
import Business, { IBusiness } from "../models/Business-model";
// import City from "../models/city-model";

// Other types
import Review from "../types/reviewType";

//* Get the data of the given store
//! GET http://localhost:3000/api/v1/shop/:id
const getShopData = async (req: Request, res: Response) => {
  try {
    const shopId = req.params.id;
    console.log(shopId);

    const shop = await Business.findById(shopId);
    // const menu = NewItem.findOne({ business: shopId });
    // const menu =  await NewItem.findOne({ businessName: shop.name });
    // const results = await Promise.all([shop, menu]);
    // console.log("shop is: ", results[0]);
    // console.log("menu is: ", results[1]);

    // if (!results[0]) {
    if (!shop) {
      return res
        .status(404)
        .send({ status: "Error", message: "There is no shop with that id" });
    }
    const menu = await NewItem.findOne({ businessName: shop.name });
    // return res.send({ status: "Success", shop: results[0], menu: results[1] });
    return res.send({ status: "Success", shop, menu });
  } catch (err: any) {
    console.log(err);

    return res.status(500).send({
      message: err.message || "An unknown error occurred",
      status: "Error",
    });
  }
}; // Send: 200, 404, 500 ({ message?: string, status: "Success" | "Error", shop?: Business, menu?: NewItem })

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
      const shopID = req.params.id;
      const shop = await Business.findById(shopID);
      if (!user || !shop) {
        return res.status(404).send({
          status: "Error",
          message: `There is no ${user ? "shop" : "user"} with that id`,
        });
      }
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
}; // Send: 201, 400, 401, 403, 404, 500 ({ message: string, status: "Success" | "Error" })

//* Get the last order the user made from this shop
//! GET http://localhost:3000/api/v1/shop/:id/last-order
const getShopLastOrder = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;

  if (userID) {
    const shopID = req.params.id;

    try {
      const orders = await Order.find({ shop: shopID, user: userID }).populate(
        "items"
      );
      return res.send({ status: "Success", orders });
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
}; // Send: 200, 401, 500 ({ message?: string, status?: "Success" | "Error", order?: Order[] })

//* Get all the shops
//! GET http://localhost:3000/api/v1/shop/all
const getAllShops = async (req: Request, res: Response) => {
  try {
    res.send({ status: "Success", shops: await Business.find() });
  } catch (err: any) {
    return res.status(500).send({
      message: err.message || "An unknown error occurred",
      status: "Error",
    });
  }
}; // Send: 200, 500 ({ message?: string, status: "Success" | "Error", shops?: Business[] })

// //* Get all the shops in a category
// //! GET http://localhost:3000/api/v1/shop/category/:category
// const getShopsByCategory = async (req: RequestWithUserID, res: Response) => {
//   const { category } = req.params;
//   if (category) {
//     try {
//       const shops = await Shop.find({ categories: category });

//       if (shops.length === 0) {
//         return res.status(404).send({
//           status: "Error",
//           message: `No shops found for the category: ${category}`,
//         });
//       }

//       return res.send({ status: "Success", shops });
//     } catch (err: any) {
//       console.error(err);

//       return res.status(500).send({
//         message: err.message || "An unknown error occurred",
//         status: "Error",
//       });
//     }
//   } else {
//     res.status(400).send({ status: "Error", message: "No category was given" });
//   }
// }; // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", shops?: shop[] })

module.exports = {
  getShopData,
  addNewReview,
  getShopLastOrder,
  getAllShops,
  // getShopsByCategory,
};
