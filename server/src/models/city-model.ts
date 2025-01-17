import mongoose, { Types } from "mongoose";
import { IRestaurant } from "./new-restaurant-model";
const { Schema, model } = mongoose;

export interface ICity extends Document {
  _id: Types.ObjectId;
  city: string;
  restaurants: RestaurantType[];
  shops: PlaceToBuyFrom[];
}

interface PlaceToBuyFrom {
  name: string;
  link: string;
  image: string;
  description: string;
  estimatedDeliveryTime: { min: number; max: number }; // Change from `number` to an object
  rating: number;
  dollarCount: "$" | "$$" | "$$$" | "$$$$";
}

interface RestaurantType extends PlaceToBuyFrom {
  restaurant: Types.ObjectId | IRestaurant;
}

const restaurantSummarySchema = new Schema(
  {
    name: { type: String },
    link: { type: String },
    image: { type: String },
    description: { type: String },
    estimatedDeliveryTime: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    }, // Updated to store a range
    rating: { type: Number },
    dollarCount: { type: String },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant" },
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

const citySchema = new Schema(
  {
    city: { type: String },
    restaurants: [restaurantSummarySchema],
    stores: [restaurantSummarySchema],
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

export default model<ICity>("City", citySchema);
