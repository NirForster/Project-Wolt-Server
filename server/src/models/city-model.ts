import mongoose, { Types } from "mongoose";

const { Schema, model } = mongoose;

// Unified PlaceSummary for both stores and restaurants
export interface PlaceSummary {
  _id: Types.ObjectId;
  name: string;
  link: string;
  image: string;
  description: string;
  estimatedDeliveryTime: { min: number; max: number };
  rating: number;
  dollarCount: "$" | "$$" | "$$$" | "$$$$";
  label: { deliveryFee: string; storeType: string };
}

// City model interface
export interface ICity extends Document {
  _id: Types.ObjectId;
  city: string;
  restaurants: PlaceSummary[];
  stores: PlaceSummary[];
}

// Schema for the place summary (used for both restaurants and stores)
const placeSummarySchema = new Schema({
  name: { type: String, required: true },
  link: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String },
  estimatedDeliveryTime: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  rating: { type: Number, default: 0 },
  dollarCount: {
    type: String,
    enum: ["$", "$$", "$$$", "$$$$"],
    default: "$$",
  },
  label: {
    deliveryFee: { type: String, default: "0₪" },
    storeType: { type: String, default: "Unknown" },
  },
});

// Main city schema
const citySchema = new Schema({
  city: { type: String, required: true },
  restaurants: [placeSummarySchema], // Contains only summary data
  stores: [placeSummarySchema], // Contains only summary data
});

export default model<ICity>("City", citySchema);
