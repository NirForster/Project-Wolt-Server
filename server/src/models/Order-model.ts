import mongoose, { Document, Schema, Types } from "mongoose";

import { IRestaurant } from "./new-restaurant-model";
import { IUser } from "./User-model";
import { IOrderItem } from "./Order-item-model";
import { IItem } from "./new-items-modal";

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  shop: Types.ObjectId | IRestaurant;
  createdAt: Date;
  deliveringTime?: number;
  items: Types.ObjectId[] | IOrderItem[];
  hasSent: boolean;
  totalPrice: number; // Virtual property
}

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    shop: {
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

    items: { type: [Schema.Types.ObjectId], ref: "OrderItem", default: [] },

    hasSent: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

orderSchema.virtual("totalPrice").get(async function () {
  const id = this._id;
  const thisOrder = (await mongoose
    .model("Order")
    .findById(id)
    .populate("items")) as IOrder;
  const items = thisOrder.items as IOrderItem[];
  if (items.length > 0) {
    return items.reduce((sum, item) => {
      return item ? item.totalPrice + sum : 0;
    }, 0);
  }
  return 0;
});

orderSchema.pre("save", async function (next) {
  const allOrdersOfShop = await mongoose
    .model("Order")
    .find({ shop: this.shop }, "deliveringTime"); // Retrieving all that restaurant's orders

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
      .findByIdAndUpdate(this.shop, { avgDeliveryTime });
    next();
  } catch (err: any) {
    next(err);
  }
}); // Update the restaurant's avg delivery time

export default mongoose.model<IOrder>("Order", orderSchema);
