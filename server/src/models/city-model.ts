import mongoose from "mongoose";
const { Schema, model } = mongoose;

const restaurantSummarySchema = new Schema({
  name: String,
  link: String,
  image: String,
  description: String,
  rating: String,
  dollarCount: String,
});

const citySchema = new Schema({
  city: String,
  restaurants: [restaurantSummarySchema],
  stores: [restaurantSummarySchema],
});

const City = model("City", citySchema);
export default City;
