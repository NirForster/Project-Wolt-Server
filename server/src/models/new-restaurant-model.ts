import mongoose from "mongoose";

const deliveryFeeStructureSchema = new mongoose.Schema({
  text: String,
  spanText: String,
});

const openingTimesSchema = new mongoose.Schema({
  day: String,
  time: String,
});

const addressSchema = new mongoose.Schema({
  name: String,
  zip: String,
});

const formOptionSchema = new mongoose.Schema({
  optionLabel: String,
  optionPrice: String,
});

const formDataSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: String,
  options: [formOptionSchema],
});

const itemSchema = new mongoose.Schema({
  name: String,
  image: String,
  price: String,
  description: String,
  isPopular: Boolean,
  formData: [formDataSchema],
});

const menuSectionSchema = new mongoose.Schema({
  sectionTitle: String,
  sectionDescription: String,
  items: [itemSchema],
});

const restaurantSchema = new mongoose.Schema({
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
  openingTimes: [openingTimesSchema],
  deliveryTimes: [openingTimesSchema],
  deliveryFeeStructure: [deliveryFeeStructureSchema],
  phoneNumber: String,
  menu: [menuSectionSchema], // ✅ Added Menu Section
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
