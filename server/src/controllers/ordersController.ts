// importing req and res types
import { Response } from "express";
import { RequestWithUserID } from "../types/expressType";

// models
import User, { IUser } from "../models/User-model";
import Order, { IOrder } from "../models/Order-model";
import { IShop } from "../models/Shop-model";
import Item, { IItem } from "../models/Item-model";

import { Types } from "mongoose";

async function newOrderHandle(
  user: IUser,
  userID: string,
  shop: string,
  product: string,
  quantity: number,
  pricePerUnit: number
) {
  const newOrder = await Order.create({
    user: userID,
    shop,
    items: { product, quantity, pricePerUnit },
  }); // Creating new order

  const newCart = [
    newOrder._id as Types.ObjectId,
    ...user.cart.map((order) => {
      return order._id as Types.ObjectId;
    }), // Creating new cart full off orders, including the current new one, so the user could  just save this array as his cart
  ];
  return newCart;
}

function newItemHandler(
  product: Types.ObjectId,
  quantity: number,
  pricePerUnit: number
) {
  return {
    product,
    quantity,
    pricePerUnit,
  };
}

async function deleteOrderHandler(user: IUser, currentOrder: IOrder) {
  const newCart = [
    ...user.cart
      .map((order) => {
        return order._id as Types.ObjectId;
      }) // Converting it back for ObjectId
      .filter((orderID) => {
        return orderID !== currentOrder._id;
      }), // Removing the order
  ];
  user.cart = newCart; // Setting the new cart
  user.save();
  await Order.findByIdAndDelete(currentOrder._id); // Delete the order
}

//* Get the user's last orders
//! GET http://localhost:300/api/v1/orders/last
const getUserLastOrders = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = (await User.findById(userID).populate({
        path: "lastOrders",
        populate: [{ path: "shop" }, { path: "items.product" }],
      })) as IUser;

      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that id" });
      }
      const lastOrders = user.lastOrders.map((order) => {
        const currentOrder = order as IOrder;
        const shop = currentOrder.shop as IShop;

        const result = {
          _id: currentOrder._id,
          shop: {
            name: shop.name,
            photo: shop.photo,
            description: shop.description,
            rate: shop.rate,
          },
          items: currentOrder.items.map((item) => {
            return (item.product as IItem).photo;
          }),
        };

        return result;
      });

      return res.send({ status: "Success", orders: lastOrders });
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
}; // Send: 200, 400, 404, 500 ({ message?: string, status: "Success" | "Error", orders?: Order })

//* Updating the user's cart
//! PUT http://localhost:3000/api/v1/orders/
const editOrder = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const { itemID, quantity } = req.body;
      const user = await User.findById(userID).populate("cart");
      const item = (await Item.findById(itemID)) as IItem;
      if (!user || !item) {
        return res.status(404).send({
          status: "Error",
          message: `There is no ${user ? "item" : "user"} with that id`,
        });
      }
      const shopID = item.shop.toString();
      let orderIndex = user.cart.findIndex((order) => {
        const currentOrder = order as IOrder;
        return currentOrder.shop.toString() === shopID.toString();
      });

      if (orderIndex === -1) {
        // new order
        if (quantity <= 0) {
          return res.status(400).send({
            status: "Error",
            message: "Quantity of items must be above 0 , if its new order",
          });
        }
        user.cart = await newOrderHandle(
          user,
          userID,
          shopID,
          itemID,
          quantity,
          item.currentPrice
        );
        user.save();
      } else {
        // existing order

        const currentOrder = user.cart[orderIndex] as IOrder;
        const itemIndex = currentOrder.items.findIndex((item) => {
          return item.product.toString() === itemID;
        });
        if (itemIndex === -1) {
          if (quantity <= 0) {
            return res.status(400).send({
              status: "Error",
              message: "Quantity of items must be above 0 , if its new item",
            });
          }

          // adding new item to existing order
          currentOrder.items.push(
            newItemHandler(itemID, quantity, item.currentPrice)
          );
          currentOrder.save();
        } else {
          // updating quantity of item in an order
          if (quantity * -1 > currentOrder.items[itemIndex].quantity) {
            return res.status(400).send({
              status: "Error",
              message:
                "Invalid quantity number - absolute value of quantity is bigger than actual quantity ",
            });
          }
          if (
            quantity === 0 ||
            quantity * -1 === currentOrder.items[itemIndex].quantity
          ) {
            // remove the item from the order
            const newItems = currentOrder.items.filter((item) => {
              return item.product.toString() !== itemID.toString();
            });
            if (newItems.length === 0) {
              // Deleting the order
              deleteOrderHandler(user, currentOrder);
            } else {
              currentOrder.items = newItems;
              currentOrder.save();
            }
          } else {
            // update the item's quantity
            currentOrder.items[itemIndex].quantity += quantity;
            currentOrder.save();
          }
        }
      }
      res.send({
        status: "Success",
        message: "Order was successfully updated",
      });
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
}; // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error "})

//* "Send" the user orders to the shops
//! PUT http://localhost:3000/api/v1/orders/send
const sendOrders = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = (await User.findById(userID).populate("cart")) as IUser;
      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that id" });
      }
      const ordersAmount = user.cart.length;
      if (ordersAmount === 0) {
        return res.status(400).send({
          status: "Error",
          message:
            "In order to send the orders, tou first need to have orders and you have non!",
        });
      }
      const { currentAddress } = req.body;
      user.locations.forEach((loc) => {
        if (loc.address === currentAddress) {
          loc.isLast = true;
        } else {
          loc.isLast = false;
        }
      });
      user.cart.forEach((order) => {
        const currentOrder = order as IOrder;
        currentOrder.hasSent = true;
        currentOrder.save();
      });
      user.cart = [];
      user.save();
      res.send({
        status: "Success",
        message: `Order${ordersAmount > 1 ? "s was" : " were"} sent!`,
      });
    } catch (err: any) {
      return res.status(500).send({
        message: err.message || "An unknown error occurred",
        status: "Error",
      });
    }
  } else {
    return res
      .status(400)
      .send({ status: "Error", message: "No  user ID was provided" });
  }
}; // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error" })

//* Get the order data
//! GET http://localhost:3000/api/v1/orders/:id
const GetOrderData = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const orderID = req.params.id;
      const order = (await Order.findById(orderID)) as IOrder;
      if (!order) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no order with that ID" });
      }
      console.log(userID);
      console.log(order.user);

      if (userID.toString() !== order.user.toString()) {
        return res.status(403).send({
          status: "Error",
          message: "User can't watch another user's orders",
        });
      }

      const items = await Promise.all(
        order.items.map(async (item) => {
          const currentItem = (await Item.findById(item.product)) as IItem;
          return {
            _id: currentItem._id,
            foodName: currentItem.foodName,
            photo: currentItem.photo,
            description: currentItem.description,
          };
        })
      );
      const result = { ...order.toObject(), items };
      res.send({ status: "Success", order: result });
    } catch (err: any) {
      return res.status(500).send({
        message: err.message || "An unknown error occurred",
        status: "Error",
      });
    }
  } else {
    return res.status(403).send({
      status: "Error",
      message:
        "Unauthorized! user can only watch his orders, not other users' orders",
    });
  }
}; // Send: 200, 400, 403, 404, 500 ({ message?: string, status: "Success" | "Error", order: Order })

module.exports = {
  getUserLastOrders,
  sendOrders,
  editOrder,
  GetOrderData,
};
