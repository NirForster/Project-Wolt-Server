// Import the centralized MongoDB connection
import connectDB from "./utils/db";

// Libraries
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
// import { Request, Response } from "express";
// const mongoose = require("mongoose");

// Routes
const authRoutes = require("./routes/authRoute.ts");
const userRoutes = require("./routes/userRoutes.ts");
const shopRoutes = require("./routes/shopRoutes.ts");
import businessRoutes from "./routes/businessRoute";
const favoritesRoutes = require("./routes/favoritesRoutes.ts");
const ordersRoutes = require("./routes/ordersRoutes.ts");

// Web Scrapers
// import { scrapeWoltBusinessData } from "./web-scraping/businessFullData";
import { scrapeWoltMenuData } from "./web-scraping/menuScraping";

// App variables
dotenv.config();
const BASE_URL = "";
const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Specify the allowed origin
    credentials: true, // Allow credentials (cookies, headers)
  })
);
app.use(express.json());

// ✅ Connect to MongoDB Once
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
    // scrapeWoltBusinessData();
    // scrapeWoltMenuData();
  })
  .catch(console.error);

// app.use(`${BASE_URL}auth`, authRoutes);

// app.use(`${BASE_URL}user`, userRoutes);

// app.use(`${BASE_URL}favorites`, favoritesRoutes);

// app.use(`${BASE_URL}shop`, shopRoutes);

// app.use(`${BASE_URL}orders`, ordersRoutes);

app.use(`/auth`, authRoutes);
app.use(`/user`, userRoutes);
app.use(`/favorites`, favoritesRoutes);
app.use(`/shop`, shopRoutes);
app.use(`/business`, businessRoutes);
app.use(`/orders`, ordersRoutes);
