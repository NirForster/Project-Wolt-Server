import mongoose from "mongoose";
const { Schema, model } = mongoose;

// Delivery Fee Structure Schema
const deliveryFeeStructureSchema = new Schema({
  text: String,
  spanText: String,
});

// Address Schema
const addressSchema = new Schema({
  name: String,
  zip: String,
});

// Opening Times Schema
const openingTimesSchema = new Schema({
  day: String,
  time: String,
});

// Delivery Times Schema
const deliveryTimesSchema = new Schema({
  day: String,
  time: String,
});

// Restaurant Schema
const restaurantSchema = new Schema({
  name: String,
  image: String,
  description: String,
  rating: String,
  dollarCount: String,
  link: String,
  backgroundImage: String,
  fullDescription: String,
  address: addressSchema,
  openingTimes: [openingTimesSchema],
  deliveryTimes: [deliveryTimesSchema],
  deliveryFeeStructure: [deliveryFeeStructureSchema],
  phoneNumber: String,
});

// **City Schema holding multiple Restaurants**
const citySchema = new Schema({
  city: String,
  restaurants: [restaurantSchema], // ✅ Embedded restaurants array
});

const City = model("City", citySchema);
export default City;
