import mongoose, { Document, Schema, Types } from "mongoose";
import LocationType from "../types/location-type";
import Review from "../types/reviewType";

export interface IShop extends Document {
  phone: string;
  name: string;
  photo: string;
  description?: string;
  locations: LocationType[];
  categories?: string[];
  tags?: string[];
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
  menu: Types.ObjectId[]; // Virtual property
  orders: Types.ObjectId[]; // Virtual property
  avgDeliveryTime: number;
  reviews: Review[];
  rate: number;
}

const shopSchema = new Schema(
  {
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

    //! Shop activity / history
    avgDeliveryTime: { type: Number, required: true, default: 0 },

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

shopSchema.pre<IShop>("save", function (next) {
  if (this.isModified("locations") && !Array.isArray(this.locations)) {
    this.locations = [this.locations];
  }
  next();
}); // Allow to save new store using only single location object

shopSchema.virtual("rate").get(function () {
  const reviewsAmount = this.reviews.length;
  if (reviewsAmount > 0) {
    const totalRating = this.reviews.reduce((sum, currentReview) => {
      return sum + currentReview.rating;
    }, 0);
    return parseFloat((totalRating / reviewsAmount).toFixed(1));
  }
  return 0;
});

shopSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "shop",
  options: { sort: { createdAt: -1 } },
});

shopSchema.virtual("menu", {
  ref: "Item",
  localField: "_id",
  foreignField: "shop",
});

export default mongoose.model<IShop>("Shop", shopSchema);
