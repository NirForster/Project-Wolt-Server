import mongoose, { Types } from "mongoose";
import { IBusiness } from "./Business-model";
const { Schema, model } = mongoose;

export interface IMenu {
  _id: Types.ObjectId;
  restaurant: Types.ObjectId | IBusiness;
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
  formData?: IFormData[];
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
  },
  options: [formOptionSchema],
});

// Item Schema inside Section
const menuItemSchema = new Schema({
  name: { type: String },
  image: { type: String },
  price: { type: String },
  description: { type: String },
  isPopular: { type: Boolean, default: false },
  formData: [formDataSchema],
});

// Section Schema with Items
const menuSectionSchema = new Schema({
  sectionTitle: { type: String },
  sectionDescription: { type: String },
  items: [menuItemSchema],
});

// Main Model Schema with Restaurant Name as a String (not ref)
const menuSchema = new Schema(
  {
    business: { type: Types.ObjectId, ref: "Business" },
    businessName: { type: String },
    sections: [menuSectionSchema],
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

const Item = model("items", menuSchema);
export default Item;
