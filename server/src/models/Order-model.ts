import mongoose, { Document, Schema, Types } from "mongoose";

import { IBusiness } from "./Business-model";
import { IUser } from "./User-model";
import { IOrderItem } from "./Order-item-model";
import { IItem } from "./items-modal";

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  shop: Types.ObjectId | IBusiness;
  createdAt: Date;
  deliveringTime?: number;
  items: (Types.ObjectId | IOrderItem)[];
  hasSent: boolean;
  totalPrice: number;
}

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    shop: {
      type: Schema.Types.ObjectId,
      ref: "Business",
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

    totalPrice: { type: Number, default: 0 },
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

// orderSchema.virtual("totalPrice").get(async function () {
//   const id = this._id;
//   const thisOrder = (await mongoose
//     .model("Order")
//     .findById(id)
//     .populate("items")) as IOrder;
//   const items = thisOrder.items as IOrderItem[];
//   if (items.length > 0) {
//     return items.reduce((sum, item) => {
//       return item ? item.totalPrice + sum : 0;
//     }, 0);
//   }
//   return 0;
// });

orderSchema.post("save", async function () {
  // const allOrdersOfShop = await mongoose
  //   .model("Order")
  //   .find({ shop: this.shop }, "deliveringTime"); // Retrieving all that restaurant's orders

  // const totalDeliveryTime = allOrdersOfShop.reduce((sum, order) => {
  //   if (order.hasSent) {
  //     return sum + order.deliveringTime;
  //   }
  //   return sum;
  // }, this.deliveringTime || 0); // Calculating the total delivery time

  // const avgDeliveryTime = totalDeliveryTime / (allOrdersOfShop.length + 1); // Calculating the avg delivering time

  // try {
  //   await mongoose
  //     .model("Business")
  //     .findByIdAndUpdate(this.shop, { avgDeliveryTime });
  //   } catch (err: any) {
  //     return next(err);
  //   }

  const id = this._id;
  const thisOrder = (await mongoose
    .model("Order")
    .findById(id)
    .populate("items")) as IOrder;
  const items = thisOrder.items as IOrderItem[];
  // await this.populate("items");
  // const items = this.items as IOrderItem[];
  let totalPrice = 0;
  if (items.length > 0) {
    totalPrice = items.reduce((sum, item) => {
      const currentItem = item as IOrderItem;
      return item ? item.totalPrice + sum : 0;
    }, 0);
  }
  await mongoose.model("Order").findByIdAndUpdate(id, { totalPrice });
}); // Update the restaurant's avg delivery time

export default mongoose.model<IOrder>("Order", orderSchema);
