import mongoose, { Document, Schema, Types } from "mongoose";

interface IItem extends Document {
  shop: Types.ObjectId;
  currentPrice: number;
  foodName: string;
  photo: string;
  description?: string;
}

const ItemSchema = new Schema({
  shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },

  currentPrice: { type: Number, required: true },

  foodName: { type: String, required: true },

  photo: {
    type: String,
    default:
      "encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhxYhCxN6kTzcPLIgcKn2aVpFACiaS15AYQg&s",
  },

  description: { type: String },
});

export default mongoose.model<IItem>("Item", ItemSchema);
