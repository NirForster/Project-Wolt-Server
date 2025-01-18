import { Request, Response } from "express";
import Business from "../models/Business-model";
import Item from "../models/items-modal";
import City from "../models/city-model";

// Fetch all stores or restaurants
export const getAllBusinesses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.query; // "store" or "restaurant"
    if (!type || (type !== "store" && type !== "restaurant")) {
      res.status(400).json({ error: "Invalid business type" });
      return;
    }

    const businesses = await Business.find({ type }).lean();
    const mappedBusinesses = businesses.map((business) => ({
      ...business,
      id: business._id.toString(), // Map _id to id
    }));
    res.status(200).json(mappedBusinesses);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
};

// Fetch business details by ID
export const getBusinessDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const business = await Business.findById(id);

    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    res.status(200).json(business);
  } catch (error) {
    console.error("Error fetching business details:", error);
    res.status(500).json({ error: "Failed to fetch business details" });
  }
};

// Fetch menu for a specific business
export const getMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessId } = req.params;
    const menu = await Item.findOne({ business: businessId }); // Updated from "restaurant" to "business"

    if (!menu) {
      res.status(404).json({ error: "Menu not found" });
      return;
    }

    res.status(200).json(menu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
};

// Fetch restaurants summary data for a specific city
export const getRestaurantsSummaryByCity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cityName } = req.params;

    // Fetch city data and use `.lean()` to convert Mongoose documents to plain JavaScript objects
    const city = await City.findOne({ city: cityName }).lean();

    if (!city || !city.restaurants || city.restaurants.length === 0) {
      res.status(404).json({
        success: false,
        message: `No restaurants found for city: ${cityName}`,
      });
      return;
    }

    // Map over restaurants to add `id` field and remove `_id`
    const restaurants = city.restaurants.map((r) => ({
      ...r,
      id: r._id.toString(), // Add `id` field
    }));

    res.status(200).json({ success: true, data: restaurants });
  } catch (error) {
    console.error("Error fetching restaurants by city:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch restaurants." });
  }
};

// Fetch stores summary data for a specific city
export const getStoresSummaryByCity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cityName } = req.params;
    const city = await City.findOne({ city: cityName }, "stores");

    if (!city || !city.stores.length) {
      res.status(404).json({
        success: false,
        message: `No stores found for city: ${cityName}`,
      });
      return;
    }

    res.status(200).json({ success: true, data: city.stores });
  } catch (error) {
    console.error("Error fetching stores by city:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch stores." });
  }
};
