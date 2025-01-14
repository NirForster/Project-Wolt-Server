import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

// Option Schema for Form Data
const formOptionSchema = new Schema({
  optionLabel: String,
  optionPrice: String,
});

// Form Data Schema
const formDataSchema = new Schema({
  title: String,
  description: String,
  type: String, // radio or checkbox
  options: [formOptionSchema],
});

// Item Schema inside Section
const itemSchema = new Schema({
  name: String,
  image: String,
  price: String,
  description: String,
  isPopular: Boolean,
  formData: [formDataSchema],
});

// Section Schema with Items
const sectionSchema = new Schema({
  sectionTitle: String,
  sectionDescription: String,
  items: [itemSchema],
});

// Main Model Schema with Restaurant Name as a String (not ref)
const newItemSchema = new Schema({
  restaurant: { type: Types.ObjectId, ref: "Restaurant" },
  restaurantName: String, // ✅ Restaurant name as a string, not a reference
  sections: [sectionSchema],
});

const Item = model("newItem", newItemSchema);
export default Item;
