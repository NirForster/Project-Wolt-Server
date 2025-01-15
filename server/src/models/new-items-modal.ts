import mongoose, { Types } from "mongoose";
import { IRestaurant } from "./new-restaurant-model";
const { Schema, model } = mongoose;

export interface IMenu {
  _id: Types.ObjectId;
  restaurant: Types.ObjectId | IRestaurant;
  restaurantName: string;
  sections: {
    sectionTitle: string;
    sectionDescription?: string;
    items: IItem[];
  }[];
}

export interface IItem {
  name: string;
  image: string;
  price: string;
  description?: string;
  isPopular: boolean;
  formData?: IFormData;
}

interface IFormData {
  title: string;
  description: string;
  type: "radio" | "checkbox"; // Limit to allowed types
  options: { optionLabel: string; optionPrice: string }[];
}

// Option Schema for Form Data
const formOptionSchema = new Schema({
  optionLabel: { type: String },
  optionPrice: { type: String },
});

// Form Data Schema
const formDataSchema = new Schema({
  title: { type: String },
  description: { type: String },
  type: {
    type: String,
    required: true,
    enum: ["radio", "checkbox"],
  }, // radio or checkbox
  options: [formOptionSchema],
});

// Item Schema inside Section
const itemSchema = new Schema({
  name: { type: String },
  image: { type: String },
  price: { type: String },
  description: { type: String },
  isPopular: { type: Boolean, default: false },
  formData: [formDataSchema],
});

// Section Schema with Items
const sectionSchema = new Schema({
  sectionTitle: { type: String },
  sectionDescription: { type: String },
  items: [itemSchema],
});

// Main Model Schema with Restaurant Name as a String (not ref)
const newItemSchema = new Schema(
  {
    restaurant: { type: Types.ObjectId, ref: "Restaurant" },
    restaurantName: { type: String }, // ✅ Restaurant name as a string, not a reference
    sections: [sectionSchema],
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

const Item = model("newItem", newItemSchema);
export default Item;
