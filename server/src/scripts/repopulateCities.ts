import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../utils/db";
import City from "../models/new-city-model";
import Business from "../models/new-business-model";

dotenv.config();

const repopulateCities = async () => {
  try {
    await connectDB();

    console.log("Connected to the database.");

    // Fetch businesses grouped by city
    const businessesByCity = await Business.aggregate([
      {
        $group: {
          _id: "$summary.location.city", // Group by city
          businesses: {
            $push: { name: "$summary.name", id: "$_id" }, // Collect business names and IDs
          },
        },
      },
    ]);

    // Prepare data for City model
    const cityData = businessesByCity.map((group) => ({
      name: group._id,
      businesses: group.businesses,
    }));

    // Clear existing City data (if needed)
    await City.deleteMany({});

    // Insert new data into City model
    await City.insertMany(cityData);

    console.log("City data repopulated successfully!");
  } catch (err) {
    console.error("Error refilling cities collection:", err);
  } finally {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed.");
  }
};

repopulateCities();
