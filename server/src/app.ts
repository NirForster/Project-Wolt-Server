// Import the centralized MongoDB connection
import connectDB from "./utils/db";

// Libraries
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Routes
const authRoutes = require("./routes/authRoute");
const userRoutes = require("./routes/userRoutes");
const shopRoutes = require("./routes/shopRoutes");
const favoritesRoutes = require("./routes/favoritesRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
import businessRoutes from "./routes/businessRoute";
import { request, response } from "express";

import newBusinessModel from "./models/new-business-model";
import axios from "axios";
import { error } from "console";

// Web Scrapers
// import { scrapeWoltBusinessData } from "./web-scraping/scrapeWoltBusinessData";
// import { scrapeWoltMenuData } from "./web-scraping/menuScraping";

// environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// ✅ Connect to MongoDB
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
    // scrapeWoltBusinessData();
    // scrapeWoltMenuData();
  })
  .catch((error) => console.error("❌ MongoDB Connection Failed:", error));

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/shop", shopRoutes);
app.use("/orders", ordersRoutes);
app.use("/business", businessRoutes);
