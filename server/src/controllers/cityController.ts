import { Request, Response } from "express";
import City from "../models/city-model";

// Fetch all restaurants across all cities
export const getAllRestaurants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const cities = await City.find({}, "restaurants").lean(); // Fetch only the restaurants field
    const allRestaurants = cities.flatMap((city) =>
      city.restaurants.map((restaurant) => ({
        ...restaurant,
        id: restaurant._id.toString(), // Add id field
      }))
    );

    res.status(200).json({ success: true, data: allRestaurants });
  } catch (error) {
    console.error("Error fetching all restaurants:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch restaurants." });
  }
};

// Fetch all stores across all cities
export const getAllStores = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const cities = await City.find({}, "stores").lean(); // Fetch only the stores field
    const allStores = cities.flatMap((city) =>
      city.stores.map((store) => ({
        ...store,
        id: store._id.toString(), // Add id field
      }))
    );

    res.status(200).json({ success: true, data: allStores });
  } catch (error) {
    console.error("Error fetching all stores:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch stores." });
  }
};
