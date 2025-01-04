// Libraries
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Import Request and Response types using ES Modules
import { Request, response, Response } from "express";

// Models
import Shop from "./models/Shop-model";
import Order from "./models/Order-model";
import Item from "./models/Item-model";

// Routes
const authRoutes = require("./routes/authRoute.ts");
const userRoutes = require("./routes/userRoutes.ts");

// Environment variables
dotenv.config();

// App variables
const BASE_URL = "/api/v1/";
const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mongoose connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("MongoDB connected");
    });
  })
  .catch((err: Error) => console.log(err));

{
  // app.get("/", async (req: Request, res: Response) => {
  //   try {
  //     const newShop = await Shop.create({
  //       name: "BabaBaba",
  //       phone: "0987654321",
  //       locations: { lon: 44.333, lat: 33.444 },
  //       avgDeliveryTime: 25,
  //     });
  //     res.send(newShop);
  //   } catch (err) {
  //     console.log(err);
  //   }
  //   res.send("Hello, TypeScript with Node.js!");
  // });
  // app.get("/", async (req: Request, res: Response) => {
  //   try {
  //     const newOrder = await Order.create({
  //       user: "67763f44137c31ed9ace939e",
  //       shop: "6775a198e86e54f39ce52596",
  //       deliveringTime: 30,
  //     });
  //     res.send(newOrder);
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).send("bad");
  //   }
  // });
  // app.get("/", async (req: Request, res: Response) => {
  //   try {
  //     const newItem = await Item.create({
  //       shop: "6775a198e86e54f39ce52596",
  //       currentPrice: 50.4,
  //       foodName: "pizza",
  //       description: "its a fucking pizza",
  //     });
  //     res.send(newItem);
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).send("bad");
  //   }
  // });
}

// TODO: do logout
app.use(`${BASE_URL}auth`, authRoutes);

// TODO: add JWT
app.use(`${BASE_URL}user`, userRoutes);
