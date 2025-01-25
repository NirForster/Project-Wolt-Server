import mongoose, { Types } from "mongoose";
import Review from "../types/reviewType";
import { IUser } from "./User-model";
import { IOrder } from "./Order-model";

const { Schema, model } = mongoose;

// Business Schema Interfaces
export interface BusinessSummary {
  _id: Types.ObjectId;
  type: "restaurant" | "store";
  location: { city: string; address: string };
  name: string;
  link: string;
  image: string;
  shortDescription: string;
  estimatedDeliveryTime: { min: number; max: number };
  rating: number;
  dollarCount: "$" | "$$" | "$$$" | "$$$$";
  label: { deliveryFee: string; storeType: string };
}

export interface BusinessAdditionalInfo {
  coverImage: string;
  businessDescription?: string;
  address: { name: string; zip: string };
  openingTimes: TimeType[];
  deliveryTimes: TimeType[];
  deliveryFeeStructure: { text: string; spanText: string }[];
  phoneNumber: string;
  website: string;
}

export interface IBusiness extends Document {
  summary: BusinessSummary; // Summary information
  additionalInfo: BusinessAdditionalInfo; // Additional details
  categories: string[]; // Categories for the business
  reviews: Review[]; // Virtuals
  rating: number;
  orders: Types.ObjectId[] | IOrder[];
}

// TimeType Schema
interface TimeType {
  day:
    | "Sunday"
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday";
  time: string;
}

const TimeSchema = new Schema({
  day: {
    type: String,
    enum: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    required: true,
  },
  time: { type: String, required: true },
});

// Main Business Schema
const businessSchema = new Schema(
  {
    summary: {
      _id: { type: Schema.Types.ObjectId, auto: true },
      type: { type: String, enum: ["restaurant", "store"], required: true },
      location: {
        city: { type: String, required: true },
        address: { type: String, required: true },
      },
      name: { type: String, required: true, unique: true },
      link: { type: String, required: true },
      image: { type: String, required: true },
      shortDescription: { type: String, required: true },
      estimatedDeliveryTime: {
        min: { type: Number, required: false },
        max: { type: Number, required: false },
      },
      rating: { type: Number, default: null, required: false },
      dollarCount: { type: String, enum: ["$", "$$", "$$$", "$$$$"] },
      label: {
        deliveryFee: { type: String, required: false },
        storeType: { type: String, required: true },
      },
    },
    additionalInfo: {
      coverImage: { type: String },
      businessDescription: { type: String },
      address: {
        name: { type: String, required: true },
        zip: { type: String, required: true },
      },
      openingTimes: [TimeSchema],
      deliveryTimes: [TimeSchema],
      deliveryFeeStructure: [
        {
          text: { type: String, required: true },
          spanText: { type: String, required: true },
        },
      ],
      phoneNumber: { type: String },
      website: { type: String },
    },
    categories: [{ type: String }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for Reviews and Orders
businessSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "business",
});

businessSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "business",
});

export default model<IBusiness>("Business", businessSchema);
