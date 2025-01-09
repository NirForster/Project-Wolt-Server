import mongoose, { Document, Schema, Types } from "mongoose";

export interface IItem extends Document {
  shop: Types.ObjectId;
  currentPrice: number;
  foodName: string;
  photo: string;
  description?: string;
  category: string;
}

const ItemSchema = new Schema(
  {
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },

    currentPrice: { type: Number, required: true },

    foodName: { type: String, required: true },

    photo: {
      type: String,
      default:
        "encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhxYhCxN6kTzcPLIgcKn2aVpFACiaS15AYQg&s",
    },

    description: { type: String },

    category: { type: String, required: true },
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

export default mongoose.model<IItem>("Item", ItemSchema);
