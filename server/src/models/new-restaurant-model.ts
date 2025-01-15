import mongoose, { Types } from "mongoose";
import { IUser } from "./User-model";
import { IOrder } from "./Order-model";
const { Schema, model } = mongoose;

export interface IRestaurant extends Document {
  _id: Types.ObjectId;
  name: string;
  image: string;
  description?: string;
  dollarCount: "$" | "$$" | "$$$" | "$$$$";
  link?: string;
  backgroundImage: string;
  fullDescription?: string;
  address: { name: string; zip: string };
  openingTimes: TimeType[];
  deliveryTimes: TimeType[];
  deliveryFeeStructure: { text: string; spanText: string }[];
  phoneNumber: string;
  deliveryFee: number;
  minTotal: number;
  deliveryTime: number;
  reviews: {
    user: Types.ObjectId | IUser;
    rating: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    comment?: string;
    createdAt: Date;
  }[];
  // Virtual properties
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

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    description: { type: String },
    dollarCount: {
      type: String,
      enum: ["$", "$$", "$$$", "$$$$"],
      default: "$$",
    },
    link: { type: String },
    backgroundImage: { type: String, required: true },
    fullDescription: { type: String },
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
    phoneNumber: { type: String, required: true, unique: true },
    deliveryFee: { type: Number, required: true },
    minTotal: { type: Number, required: true },
    deliveryTime: { type: Number, required: true },
    reviews: {
      type: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          rating: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
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
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

restaurantSchema.virtual("rating").get(function () {
  if (this && this.reviews) {
    const reviewsAmount = this.reviews.length;
    if (reviewsAmount > 0) {
      const totalRating = this.reviews.reduce((sum, currentReview) => {
        return sum + currentReview.rating;
      }, 0);
      return parseFloat((totalRating / reviewsAmount).toFixed(1));
    }
  }
  return 0;
});

restaurantSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "restaurant",
  options: { sort: { createdAt: -1 }, match: { hasSent: true } },
});

export default model<IRestaurant>("Restaurant", restaurantSchema);
