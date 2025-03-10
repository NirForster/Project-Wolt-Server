import express from "express";
import {
  getAllBusinesses,
  getBusinessDetails,
  getMenu,
  getBusinessesByCity,
  getBusinessesByCategories,
  getNearbyBusinesses,
} from "../controllers/businessController";

const router = express.Router();

// Get all businesses (filtered by type: "store" or "restaurant")
router.get("/", getAllBusinesses);

// Get businesses within radius of coordinates
router.get("/nearby", getNearbyBusinesses);

// Get businesses in a specific city (filtered by type: "restaurants" or "stores")
router.get("/cities/:cityName/:type", getBusinessesByCity);

// Get full details of a specific business by ID
router.get("/:id", getBusinessDetails);

// Get menu for a specific business
router.get("/:id/menu", getMenu);

//Get Businesses by city and type
router.get("/cities/:city/:type/categories", getBusinessesByCategories);

export default router;
