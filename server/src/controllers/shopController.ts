import { Request, Response } from "express";
import { RequestWithUserID } from "../types/expressType";
import Shop from "../models/Shop-model";
import Item, { IItem } from "../models/Item-model";
import User, { IUser } from "../models/User-model";
import Order, { IOrder } from "../models/Order-model";
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
    return res.send(shop);
  } catch (err: any) {
    return res.status(500).send({
      message: err?.message || "An unknown error occurred",
      status: "Error",
    });
  }
}; // Send: 200, 400, 404, 500 ({ message: string, status: "Success" | "Error" })

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
};

module.exports = {
  getShopData,
  editOrder,
};
