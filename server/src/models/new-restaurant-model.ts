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

const restaurantSchema = new Schema({
  city: String,
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

const Restaurant = model("Restaurant", restaurantSchema);
export default Restaurant;
