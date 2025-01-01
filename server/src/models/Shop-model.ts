import mongoose, { Document, Schema, Types } from "mongoose";
import LocationType from "../types/location-type";

interface IShop extends Document {
  phone: string;
  name: string;
  photo: string;
  description?: string;
  locations: [LocationType];
  categories?: [string];
  tags?: [string];
  deliveryFee: number;
  workingTime: [
    {
      day:
        | "Sunday"
        | "Monday"
        | "Tuesday"
        | "Wednesday"
        | "Thursday"
        | "Friday"
        | "Saturday";
      opening: string;
      closing: string;
    }
  ];
  menu: Types.ObjectId;
  orders: Types.ObjectId;
  avgDeliveryTime: number;
  reviews: [
    {
      user: Types.ObjectId;
      rating: number;
      comment: string;
    }
  ];
}

const shopSchema = new Schema({
  //! Shop data
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10}$/, "Phone number must be 10 digits"],
  },

  name: { type: String, required: true, unique: true },

  photo: {
    type: String,
    required: true,
    default:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEM-vsJGYRxX0_EI2S6KDFKSuryQirn0LDcQ&s",
  },

  description: { type: String },

  locations: {
    type: [
      {
        lat: { type: Number, min: -90, max: 90, required: true },
        lon: { type: Number, min: -180, max: 180, required: true },
      },
    ],
    default: [],
    required: true,
    validate: {
      validator: function (v: LocationType[]) {
        return v.length > 0; // Ensures at least one element in the array
      },
      message: "At least one location is required.",
    },
  }, //* List of all the shop's branches locations with validating of at list 1 location

  categories: [{ type: String }],

  tags: [{ type: String }],

  deliveryFee: {
    type: Number,
    default: 0,
    min: 0,
  },

  workingTime: {
    type: [
      {
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
        opening: { type: String, required: true },
        closing: { type: String, required: true },
      },
    ],
  },

  menu: {
    type: [{ type: Schema.Types.ObjectId, ref: "Item", required: true }],
    required: [],
  },

  //! Shop activity / history
  orders: {
    type: [Schema.Types.ObjectId],
    ref: "Order",
    default: [],
  }, //* List of all the orders of the restaurant

  avgDeliveryTime: { type: Number, required: true },

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
});

shopSchema.pre<IShop>("save", function (next) {
  if (this.isModified("locations") && !Array.isArray(this.locations)) {
    this.locations = [this.locations];
  }
  next();
}); // Allow to save new store using only single location object
export default mongoose.model<IShop>("Shop", shopSchema);
