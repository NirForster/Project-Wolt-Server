import mongoose, { Document, Schema, Types } from "mongoose";
import { IOrder } from "./Order-model";
import { IRestaurant } from "./new-restaurant-model";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  fname: string;
  lname: string;
  phone: string;
  photo: string;
  locations: {
    type: "Home" | "Work" | "Other";
    address: string;
    isLast: boolean;
  }[];
  favoritesShops: Types.ObjectId[] | IRestaurant[];
  cart: Types.ObjectId[] | IOrder[];
  lastOrders: Types.ObjectId[] | IOrder[]; // Virtual property
  fullname: string;
}

const userSchema = new Schema(
  {
    //! User authentication / authorization
    email: {
      type: String,
      required: [true, "Email is a required field in order to create new user"],
      unique: [true, "User with Email already exist"],
      match: [/.+@.+\..+/, "Invalid email format"],
    }, //* the "email" value will be the user's unique username

    password: {
      type: String,
      required: [
        true,
        "Password is a required field in order to create new user",
      ],
      minLength: "5",
    },

    //! User data
    fname: {
      type: String,
      required: [
        true,
        "First name is a required field in order to create new user",
      ],
    },

    lname: {
      type: String,
    },

    phone: {
      type: String,
      required: [true, "Phone is a required field in order to create new user"],
      unique: [true, "User with Phone already exist"],
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },

    photo: {
      type: String,
      default:
        "static-00.iconduck.com/assets.00/user-profile-icon-1024x1024-1l5txyn1.png",
    },

    locations: {
      type: [
        {
          type: {
            type: String,
            enum: ["Home", "Work", "Other"],
            required: true,
          },
          address: { type: String, required: true },
          isLast: { type: Boolean, default: false },
        },
      ],
      default: [],
    }, //* List of all the saved locations of the user

    //! User activity / history
    favoritesShops: {
      type: [Schema.Types.ObjectId],
      ref: "Restaurant",
      default: [],
    }, //* list of all the user favorites shops

    cart: {
      type: [{ type: Schema.Types.ObjectId }],
      ref: "Order",
      default: [],
    },
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

userSchema.virtual("fullname").get(function () {
  if (this.lname) {
    return `${this.fname} ${this.lname}`;
  }
  return this.fname;
});

userSchema.virtual("lastOrders", {
  ref: "Order",
  localField: "_id",
  foreignField: "user",
  options: { sort: { createdAt: -1 }, match: { hasSend: true } },
});

export default mongoose.model<IUser>("User", userSchema);
