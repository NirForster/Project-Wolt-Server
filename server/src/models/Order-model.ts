import mongoose, { Document, Schema, Types } from "mongoose";

import { IRestaurant } from "./new-restaurant-model";
import { IUser } from "./User-model";
import { IItem } from "./new-items-modal";

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  shop: Types.ObjectId | IRestaurant;
  createdAt: Date;
  deliveringTime?: number;
  items: Types.ObjectId[] | IItem[];
  hasSent: boolean;
  totalPrice: number; // Virtual property
}

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    deliveringTime: {
      type: Number,
    },

    items: {
      type: [
        {
          name: { type: String, required: true }, // Item name
          image: { type: String, required: true }, // Item image
          price: { type: String, required: true }, // Item price
          description: { type: String }, // Optional description
          isPopular: { type: Boolean, default: false }, // Popularity flag
          formData: [
            {
              title: { type: String },
              description: { type: String },
              type: {
                type: String,
                required: true,
                enum: ["radio", "checkbox"], // Only allow "radio" or "checkbox"
              },
              options: [
                {
                  optionLabel: { type: String, required: true }, // Label for the option
                  optionPrice: { type: String, required: true }, // Price for the option
                },
              ],
            },
          ],
        },
      ],
      required: true,
      default: [],
    },

    hasSent: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

orderSchema.virtual("totalPrice").get(function () {
  const itemsAmount = this.items.length;

  if (itemsAmount > 0) {
    return this.items.reduce((sum: number, currentItem: any) => {
      const currentPrice = currentItem.price;

      // Extract the numeric part of the price string
      const numericPrice = parseFloat(currentPrice.replace(/[^\d.-]/g, "")); // Remove "₪" and any non-numeric characters
      return numericPrice + sum;
    }, 0);
  }

  return 0;
});

orderSchema.pre("save", async function (next) {
  const allOrdersOfShop = await mongoose
    .model("Order")
    .find({ restaurant: this.restaurant }, "deliveringTime"); // Retrieving all that restaurant's orders

  const totalDeliveryTime = allOrdersOfShop.reduce((sum, order) => {
    if (order.hasSent) {
      return sum + order.deliveringTime;
    }
    return sum;
  }, this.deliveringTime || 0); // Calculating the total delivery time

  const avgDeliveryTime = totalDeliveryTime / (allOrdersOfShop.length + 1); // Calculating the avg delivering time

  try {
    await mongoose
      .model("Restaurant")
      .findByIdAndUpdate(this.restaurant, { avgDeliveryTime });
    next();
  } catch (err: any) {
    next(err);
  }
}); // Update the restaurant's avg delivery time

export default mongoose.model<IOrder>("Order", orderSchema);
