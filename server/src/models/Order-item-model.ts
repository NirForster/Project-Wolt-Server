import mongoose, { Document, Schema, Types } from "mongoose";

import { IItem, IMenu } from "./new-items-modal";
import { IOrder } from "./Order-model";

export interface IOrderItem extends Document {
  _id: Types.ObjectId;
  order: Types.ObjectId | IOrder;
  menu: Types.ObjectId | IMenu;
  item: {
    name: string;
    image: string;
    description?: string;
  };
  sectionTitle: String;
  pricePerUnit: number;
  quantity: number;
  extras: {
    added: string;
    quantity: number;
  }[];
  totalPrice: number; // Virtual
}

const OrderItemSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },

    menu: { type: Schema.Types.ObjectId, ref: "NewItem", required: true },

    item: {
      name: { type: String },
      image: { type: String },
      description: { type: String },
    },

    sectionTitle: { type: String },

    pricePerUnit: { type: Number, required: true },

    quantity: { type: Number, default: 1 },

    extras: {
      type: [
        {
          added: { type: String, required: true },
          quantity: { type: Number, default: 1 },
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

OrderItemSchema.virtual("totalPrice").get(function () {
  return this.pricePerUnit * this.quantity;
});

export default mongoose.model<IOrderItem>("OrderItem", OrderItemSchema);
