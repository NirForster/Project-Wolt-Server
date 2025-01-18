// Libraries
import { Response } from "express";
import { Types } from "mongoose";

// Request type
import { RequestWithUserID } from "../types/expressType";

// Models
import User, { IUser } from "../models/User-model";
import Order, { IOrder } from "../models/Order-model";
import { IBusiness } from "../models/Business-model";
import OrderItem, { IOrderItem } from "../models/Order-item-model";

// New types
interface RequestWithOrderData extends RequestWithUserID {
  body: {
    shopID: string;
    menuID: string;
    itemName: string;
    itemImg: string;
    itemDesc?: string;
    price: number;
    quantity: number;
    sectionTitle: string;
    extras: string[];
  };
}

// Handler functions
async function newOrderHandle(
  cart: Types.ObjectId[] | IOrder[],
  user: string,
  shop: string,
  menu: string,
  name: string,
  image: string,
  description: string = "",
  sectionTitle: string,
  quantity: number,
  pricePerUnit: number,
  extras: string[]
) {
  try {
    const newOrder = await Order.create({
      user,
      shop,
    }); // Creating new order
    const newOrderItem = await OrderItem.create({
      order: newOrder._id,
      menu,
      item: {
        name,
        image,
        description,
      },
      sectionTitle,
      quantity,
      pricePerUnit,
      extras,
    });
    newOrder.items.push(newOrderItem.id);
    await newOrder.save();
    const newCart = [
      newOrder._id as Types.ObjectId,
      ...cart.map((order) => {
        return order._id as Types.ObjectId;
      }), // Creating new cart full off orders, including the current new one, so the user could just save this array as his cart
    ];
    return newCart;
  } catch (err: any) {
    console.log("my name is baba");
    console.log(err.message);
  }
}

async function newItemHandler(
  order: string,
  menu: string,
  name: string,
  image: string,
  description: string = "",
  sectionTitle: string,
  quantity: number,
  pricePerUnit: number,
  extras: string[]
) {
  const newOrderItem = await OrderItem.create({
    order,
    menu,
    item: { name, image, description },
    sectionTitle,
    quantity,
    pricePerUnit,
    extras,
  });
  return newOrderItem._id;
}

async function deleteOrderHandler(user: IUser, currentOrder: IOrder) {
  const orderID = currentOrder._id;
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
  await OrderItem.deleteMany({ order: orderID }); // Delete all the OrderItem-s that belongs to this order
  await currentOrder.deleteOne(); // Delete the order
}

//* Get the user's last orders
//! GET http://localhost:300/api/v1/orders/last
const getUserLastOrders = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const user = (await User.findById(userID).populate({
        path: "lastOrders",
        populate: [
          { path: "items" },
          {
            path: "shop",
            select: "-deliveryFeeStructure -deliveryTimes -openingTimes",
          },
        ],
      })) as IUser;

      if (!user) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no user with that id" });
      }

      return res.send({ status: "Success", orders: user.lastOrders });
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
}; // Send: 200, 401, 404, 500 ({ message?: string, status: "Success" | "Error", orders?: Order[] })

//* Updating the user's cart
//! PUT http://localhost:3000/api/v1/orders/
const editOrder = async (req: RequestWithOrderData, res: Response) => {
  const userID = req.userID;
  if (userID) {
    const {
      shopID,
      menuID,
      itemName,
      itemImg,
      itemDesc,
      quantity,
      price,
      sectionTitle,
      extras,
    } = req.body;
    if (
      !shopID ||
      !menuID ||
      !itemName ||
      !itemImg ||
      quantity == null ||
      price == null ||
      !sectionTitle
    ) {
      return res
        .status(400)
        .send({ status: "Error", message: "Some fields are missing!" });
    }
    const newQuantity = +quantity;
    if (newQuantity < 0) {
      return res
        .status(400)
        .send({ status: "Error", message: "Quantity must be not negative" });
    }
    try {
      const user = await User.findById(userID).populate("cart");
      if (!user) {
        return res.status(404).send({
          status: "Error",
          message: `There is no user with that id`,
        });
      }
      // From here I know I have all the data and it is valid
      let orderIndex = user.cart.findIndex((order) => {
        const currentOrder = order as IOrder;
        return currentOrder.shop.toString() === shopID;
      }); // orderIndex will save the index of the order: if its -1, it means the user is creating new order from new shop; otherwise (any whole number greater than -1), he is updating an existing order
      if (orderIndex === -1) {
        // new order ⬇️
        if (quantity === 0) {
          return res.status(400).send({
            status: "Error",
            message: "Quantity of items must be above 0 , if its new order",
          });
        }
        user.cart =
          (await newOrderHandle(
            user.cart,
            userID,
            shopID,
            menuID,
            itemName,
            itemImg,
            itemDesc,
            sectionTitle,
            quantity,
            price,
            extras
          )) || [];
        // new order ⬆️
        user.save();
        return res.status(201).send({
          status: "Success",
          message: "New order was created with that item",
        });
      } else {
        {
          // existing order ⬇️
          const currentOrder = await (user.cart[orderIndex] as IOrder).populate(
            "items"
          );
          const itemIndex = currentOrder.items.findIndex((item) => {
            const currentItem = item as IOrderItem;
            if (currentItem.sectionTitle !== sectionTitle) {
              return false;
            }
            const itemInfo = currentItem.item;
            if (itemInfo.name !== itemName) {
              return false;
            }
            return true;
          }); // itemIndex will save the index of the item inside the order's items array: if its -1, it means the user are adding new item to the order; other wise (any whole number greater than -1), the user is changing the quantity of an item in the order
          if (itemIndex === -1) {
            // new item in existing order ⬇️
            if (quantity === 0) {
              return res.status(400).send({
                status: "Error",
                message: "Quantity of items must be above 0 , if its new item",
              });
            }
            currentOrder.items = currentOrder.items.map((item) => {
              return item._id as Types.ObjectId;
            });
            currentOrder.items.push(
              await newItemHandler(
                currentOrder._id.toString(),
                menuID,
                itemName,
                itemImg,
                itemDesc,
                sectionTitle,
                quantity,
                price,
                extras
              )
            );
            currentOrder.save();
            return res.status(201).send({
              status: "Success",
              message: "New item was added to an existing order",
            });
            // new item in existing order ⬆️
          } else {
            // updating quantity of item in an existing order ⬇️
            if (quantity === 0) {
              // remove the item from the order ⬇️
              const newItems = currentOrder.items
                .filter((item) => {
                  const currentItem = item as IOrderItem;
                  if (
                    sectionTitle === currentItem.sectionTitle &&
                    itemName === currentItem.item.name
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((item) => {
                  const currentItem = item as IOrderItem;
                  return currentItem._id;
                });
              if (newItems.length === 0) {
                // Deleting the order ⬇️
                deleteOrderHandler(user, currentOrder);
                return res.send({
                  status: "Success",
                  message:
                    "Order was deleted as you gave to the only item in the order quantity 0",
                });
                // Deleting the order ⬆️
              } else {
                currentOrder.items = newItems;
                currentOrder.save();
                await OrderItem.deleteMany({
                  sectionTitle,
                  "item.name": itemName,
                });
                return res.send({
                  status: "Success",
                  message: "Item was removed from the order",
                });
              }
              // remove the item from the order ⬆️
            } else {
              // update the item's quantity ⬇️
              (currentOrder.items[itemIndex] as IOrderItem).quantity = quantity;
              (currentOrder.items[itemIndex] as IOrderItem).save();
              return res.send({
                status: "Success",
                message: "Item quantity was updated",
              });
              // update the item's quantity ⬆️
            }
            // updating quantity of item in an existing order ⬆️
          }
          // existing order ⬆️
        }
      }
    } catch (err: any) {
      res.status(500).send({
        message: err.message || "An unknown error occurred",
        status: "Error",
      });
    }
  } else {
    return res
      .status(401)
      .send({ message: "User not authenticated", status: "Error" });
  }
}; // Send: 200, 201, 400, 401, 404, 500 ({ message: string, status: "Success" | "Error" })

//* "Send" the user orders to the shops
//! GET http://localhost:3000/api/v1/orders/send
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
      // Setting each order as an order that has sent
      user.cart.forEach((order) => {
        const currentOrder = order as IOrder;
        currentOrder.hasSent = true;
        currentOrder.save();
      });
      user.cart = [];
      user.save();
      res.send({
        status: "Success",
        message: `Order${ordersAmount > 1 ? "s were" : " was"} sent!`,
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

//* Get the order data
//! GET http://localhost:3000/api/v1/orders/:id
const GetOrderData = async (req: RequestWithUserID, res: Response) => {
  const userID = req.userID;
  if (userID) {
    try {
      const orderID = req.params.id;
      const order = (await Order.findById(orderID).populate([
        {
          path: "shop",
          select: "-deliveryFeeStructure -deliveryTimes -openingTimes",
        },
        { path: "items" },
      ])) as IOrder;
      if (!order) {
        return res
          .status(404)
          .send({ status: "Error", message: "There is no order with that ID" });
      }
      if (userID.toString() !== order.user.toString()) {
        return res.status(403).send({
          status: "Error",
          message: "User can't watch another user's orders",
        });
      }
      res.send({ status: "Success", order });
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
}; // Send: 200, 403, 404, 500 ({ message?: string, status: "Success" | "Error", order?: Order })

module.exports = {
  getUserLastOrders,
  sendOrders,
  editOrder,
  GetOrderData,
};
