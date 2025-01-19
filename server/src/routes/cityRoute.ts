import express from "express";
import { getAllRestaurants, getAllStores } from "../controllers/cityController";

const router = express.Router();

// Route to fetch all restaurants across all cities
router.get("/restaurants", getAllRestaurants);

// Route to fetch all stores across all cities
router.get("/stores", getAllStores);

export default router;
