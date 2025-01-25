import mongoose, { Types } from "mongoose";
import { IBusiness } from "./new-business-model";
const { Schema, model } = mongoose;

// Interfaces
export interface IMenu {
  _id: Types.ObjectId;
  business: Types.ObjectId | IBusiness; // Reference the new business model
  businessName: string;
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

// Main Menu Schema with Business Reference
const menuSchema = new Schema(
  {
    business: { type: Types.ObjectId, ref: "newBusiness", required: true }, // Reference the new business model
    businessName: { type: String, required: true },
    sections: [menuSectionSchema],
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true }, // Include virtuals in Object output
  }
);

export default model<IMenu>("Menu", menuSchema);
