import mongoose, { Document, Schema, Types } from "mongoose";

export interface IOrder extends Document {
  user: Types.ObjectId;
  shop: Types.ObjectId;
  createdAt: Date;
  deliveringTime?: number;
  items: {
    product: Types.ObjectId;
    quantity: number;
    pricePerUnit: number;
  }[];
  hasSent: boolean;
  totalPrice: number; // Virtual property
}

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },

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
          product: { type: Schema.Types.ObjectId, ref: "Item", required: true },
          quantity: { type: Number, default: 1, min: 1 },
          pricePerUnit: { type: Number, required: true, min: 0 },
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
  console.log("baba 1");

  const itemsAmount = this.items.length;
  console.log("baba 2");
  if (itemsAmount > 0) {
    const prices = this.items.map((item) => {
      return item.quantity * item.pricePerUnit;
    });
    return prices.reduce((sum, price) => {
      return sum + price;
    }, 0);
  }
  return 0;
});

orderSchema.pre("save", async function (next) {
  const allOrdersOfShop = await mongoose
    .model("Order")
    .find({ shop: this.shop }, "deliveringTime"); // Retrieving all that shop's orders

  const totalDeliveryTime = allOrdersOfShop.reduce((sum, order) => {
    if (order.hasSent) {
      return sum + order.deliveringTime;
    }
    return sum;
  }, this.deliveringTime || 0); // Calculating the total delivery time

  const avgDeliveryTime = totalDeliveryTime / (allOrdersOfShop.length + 1); // Calculating the avg delivering time

  try {
    await mongoose
      .model("Shop")
      .findByIdAndUpdate(this.shop, { avgDeliveryTime });
    next();
  } catch (err: any) {
    next(err);
  }
}); // Update the shop's avg delivery time

export default mongoose.model<IOrder>("Order", orderSchema);
