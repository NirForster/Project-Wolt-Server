import mongoose, { Document, Schema, Types } from "mongoose";

interface IOrder extends Document {
  user: Types.ObjectId;
  shop: Types.ObjectId;
  createdAt: Date;
  deliveringTime: number;
  items: [
    {
      product: Types.ObjectId;
      quantity: number;
      pricePerUnit: number;
    }
  ];
}

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },

  shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  deliveringTime: {
    type: Number,
    required: true,
  },

  items: {
    type: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        quantity: { type: Number, default: 1, min: 1 },
        pricePerUnit: { type: Number, required: true, min: 0 },
      },
    ],
    required: true,
    default: [],
  },
});

export default mongoose.model<IOrder>("Order", orderSchema);
