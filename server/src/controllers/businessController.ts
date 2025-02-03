import { Request, Response } from "express";
import newBusiness from "../models/new-business-model";
import Item from "../models/items-modal";
import City from "../models/new-city-model";

/**
 * Fetch all businesses of a specific type across all cities
 * @route GET /business?type=restaurant or /business?type=store
 */
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

    const businesses = await newBusiness.find({ type }).lean();
    const mappedBusinesses = businesses.map((business) => ({
      ...business,
      id: business._id.toString(),
    }));

    res.status(200).json(mappedBusinesses);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
};

/**
 * Fetch all restaurants or stores in a specific city
 * @route GET /business/cities/:cityName/:type
 */
export const getBusinessesByCity = async (
  req: Request<{ cityName: string; type: string }>,
  res: Response
): Promise<void> => {
  try {
    const { cityName, type } = req.params;

    // Validate `type`
    if (type !== "restaurants" && type !== "stores") {
      res.status(400).json({
        error: "Invalid business type. Use 'restaurants' or 'stores'.",
      });
      return;
    }

    // Fetch city data
    const city = await City.findOne({ name: cityName }).lean();

    if (!city || !city.businesses || city.businesses.length === 0) {
      res.status(404).json({
        success: false,
        message: `No businesses found in city: ${cityName}`,
      });
      return;
    }

    // Filter businesses by type
    const businessIds = city.businesses.map((b) => b.id);
    const businesses = await newBusiness
      .find({
        _id: { $in: businessIds },
        "summary.type": type.slice(0, -1), // Convert 'restaurants' to 'restaurant'
      })
      .lean();

    const mappedBusinesses = businesses.map((business) => ({
      ...business.summary,
      id: business._id.toString(),
    }));

    res.status(200).json({ success: true, data: mappedBusinesses });
  } catch (error) {
    console.error("Error fetching businesses by city:", error);
    res.status(500).json({ error: "Failed to fetch businesses." });
  }
};

/**
 * Fetch full details of a specific business
 * @route GET /business/:id
 */
export const getBusinessDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const business = await newBusiness.findById(id);

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

/**
 * Fetch menu for a specific business
 * @route GET /business/:id/menu
 */
export const getMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const menu = await Item.findOne({ business: id });

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

/**
 * Fetch businesses grouped by categories for a specific city and type
 * @route GET /business/cities/:city/:type/categories
 */
export const getBusinessesByCategories = async (
  req: Request<{ city: string; type: string }>,
  res: Response
): Promise<void> => {
  try {
    const { city, type } = req.params;

    // Validate `type`
    if (type !== "restaurant" && type !== "store") {
      res
        .status(400)
        .json({ error: "Invalid type. Use 'restaurant' or 'store'." });
      return;
    }

    // Fetch city data
    const cityData = await City.findOne({ name: city }).lean();

    if (!cityData || !cityData.businesses || cityData.businesses.length === 0) {
      console.error("City data not found or empty:", { city });
      res.status(404).json({
        message: `No businesses found for city: ${city} and type: ${type}`,
      });
      return;
    }

    // Extract business IDs from city data
    const businessIds = cityData.businesses.map((b) => b.id);

    // Fetch businesses matching the IDs and type in a single query
    const businesses = await newBusiness
      .find({
        _id: { $in: businessIds },
        "summary.type": type,
      })
      .lean();

    if (!businesses || businesses.length === 0) {
      console.error("No businesses found:", { businessIds, type });
      res.status(404).json({
        message: `No businesses found for city: ${city} and type: ${type}`,
      });
      return;
    }

    // Group businesses by category
    const groupedBusinesses = businesses.reduce(
      (acc: Record<string, any[]>, business) => {
        business.categories.forEach((category: string) => {
          if (!acc[category]) acc[category] = [];
          acc[category].push(business);
        });
        return acc;
      },
      {}
    );

    res.status(200).json(groupedBusinesses);
  } catch (error) {
    console.error("Error fetching businesses by categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
