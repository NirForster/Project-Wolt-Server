import connectDB from "../utils/db"; // Adjust the path as needed
import mongoose from "mongoose";
import Item from "../models/items-modal";
import Business from "../models/new-business-model";
const dotenv = require("dotenv");

dotenv.config();

const checkUnscrapedBusinesses = async () => {
  try {
    // Use your connectDB utility
    await connectDB();

    // Find businesses whose menus have not been scraped
    const unscrapedBusinesses = await Business.find({
      _id: { $nin: await Item.distinct("business") },
    });

    if (unscrapedBusinesses.length > 0) {
      console.log(
        `🚨 Found ${unscrapedBusinesses.length} businesses without menus scraped:`
      );
      unscrapedBusinesses.forEach((business, index) => {
        console.log(
          `${index + 1}. ${business.summary.name} - Link: ${
            business.summary.link
          }`
        );
      });
    } else {
      console.log("✅ All businesses have their menus scraped.");
    }
  } catch (error) {
    console.error("❌ Error while checking unscraped businesses:", error);
  } finally {
    // Ensure connection is closed
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed.");
  }
};

// Activate the script
checkUnscrapedBusinesses();
