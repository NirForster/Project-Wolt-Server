import mongoose, { Types } from "mongoose";
import { IUser } from "./User-model";
import { IOrder } from "./Order-model";
import Review from "../types/reviewType";
const { Schema, model } = mongoose;

export interface IBusiness extends Document {
  _id: Types.ObjectId;
  type: "restaurant" | "store"; // Differentiates between stores and restaurants
  name: string;
  description?: string;
  coverImage: string;

  // "more info" card data:
  businessDescription?: string;
  address: { name: string; zip: string };
  openingTimes: TimeType[];
  deliveryTimes: TimeType[];
  deliveryFeeStructure: { text: string; spanText: string }[];
  phoneNumber: string;
  website: string;

  // virtuals
  reviews: Review[];
  rating: number;
  order: Types.ObjectId[] | IOrder[];
}

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

const businessSchema = new Schema(
  {
    type: { type: String, enum: ["restaurant", "store"], required: true },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    coverImage: { type: String, required: true },

    // "more info" card data:
    businessDescription: { type: String },
    address: {
      type: {
        name: { type: String, required: true },
        zip: { type: String, required: true },
      },
      required: true,
    },
    openingTimes: [
      {
        type: TimeSchema,
        required: true,
      },
    ],
    deliveryTimes: [
      {
        type: TimeSchema,
        required: true,
      },
    ],
    deliveryFeeStructure: {
      type: [
        {
          text: { type: String, required: true },
          spanText: { type: String, required: true },
        },
      ],
    },
    phoneNumber: { type: String, required: true },
    website: { type: String },

    // virtuals:
    rating: { type: Number },
    reviews: {
      type: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          comment: {
            type: String,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

businessSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "restaurant",
  options: { sort: { createdAt: -1 }, match: { hasSent: true } },
});

export default model<IBusiness>("Business", businessSchema);
