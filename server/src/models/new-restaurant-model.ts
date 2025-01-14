import mongoose from "mongoose";
const { Schema, model } = mongoose;

const deliveryFeeStructureSchema = new Schema({
  text: String,
  spanText: String,
});

const addressSchema = new Schema({
  name: String,
  zip: String,
});

const openingTimesSchema = new Schema({
  day: String,
  time: String,
});

const deliveryTimesSchema = new Schema({
  day: String,
  time: String,
});

const newRestaurantSchema = new Schema({
  name: String,
  image: String,
  description: String,
  rating: String,
  dollarCount: String,
  link: String,
  backgroundImage: String,
  fullDescription: String,
  city: String,
  address: addressSchema,
  openingTimes: [openingTimesSchema], // ✅ Added Opening Times
  deliveryTimes: [deliveryTimesSchema], // ✅ Added Delivery Times
  deliveryFeeStructure: [deliveryFeeStructureSchema],
  phoneNumber: String,
});

const Restaurant = model("newRestaurant", newRestaurantSchema);
export default Restaurant;
