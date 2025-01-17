import mongoose, { Types } from "mongoose";
import { IRestaurant } from "./restaurant-model";
const { Schema, model } = mongoose;

export interface ICity extends Document {
  _id: Types.ObjectId;
  city: string;
  restaurants: RestaurantType[];
  stores: StoresType[];
}

interface StoresType {
  name: string;
  link: string;
  image: string;
  description: string;
  estimatedDeliveryTime: { min: number; max: number };
  rating: number;
  dollarCount: "$" | "$$" | "$$$" | "$$$$";
  label: { deliveryFee: string; storeType: string };
}

interface RestaurantType extends StoresType {
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
    },
    rating: { type: Number },
    dollarCount: { type: String },
    label: { deliveryFee: { type: String }, storeType: { type: String } },
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
