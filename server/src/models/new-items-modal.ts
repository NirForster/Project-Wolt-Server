import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const formOptionSchema = new Schema({
  optionLabel: String,
  optionPrice: String,
});

const formDataSchema = new Schema({
  title: String,
  description: String,
  type: String,
  options: [formOptionSchema],
});

const itemSchema = new Schema({
  restaurant: { type: Types.ObjectId, ref: "Restaurant" }, // ✅ Reference to the Restaurant
  name: String,
  image: String,
  price: String,
  description: String,
  isPopular: Boolean,
  formData: [formDataSchema],
});

const Item = model("Item", itemSchema);
export default Item;
