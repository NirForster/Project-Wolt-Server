import { Request, Response } from "express";

// Libraries
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/authRoute.ts");
const userRoutes = require("./routes/userRoutes.ts");
const shopRoutes = require("./routes/shopRoutes.ts");
const favoritesRoutes = require("./routes/favoritesRoutes.ts");

import Shop from "./models/Shop-model";
import Item from "./models/Item-model";
import Order from "./models/Order-model";

// Environment variables
dotenv.config();

// App variables
const BASE_URL = "/api/v1/";
const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173", // Specify the allowed origin
    credentials: true, // Allow credentials (cookies, headers)
  })
);
app.use(express.json());

// Mongoose connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("MongoDB connected");
    });
  })
  .catch((err: Error) => console.log(err));

{
  // app.get("/", async (req: Request, res: Response) => {
  //   try {
  //     const newShop = await Shop.create({
  //       name: "BabaBaba",
  //       phone: "0987654321",
  //       locations: { lon: 44.333, lat: 33.444 },
  //       avgDeliveryTime: 25,
  //     });
  //     res.send(newShop);
  //   } catch (err) {
  //     console.log(err);
  //   }
  //   res.send("Hello, TypeScript with Node.js!");
  // });
  // app.get("/", async (req: Request, res: Response) => {
  //   try {
  //     const newOrder = await Order.create({
  //       user: "67763f44137c31ed9ace939e",
  //       shop: "6775a198e86e54f39ce52596",
  //       deliveringTime: 30,
  //     });
  //     res.send(newOrder);
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).send("bad");
  //   }
  // });
  // app.get("/", async (req: Request, res: Response) => {
  //   try {
  //     const newItem = await Item.create({
  //       shop: "6775a198e86e54f39ce52596",
  //       currentPrice: 50.4,
  //       foodName: "pizza",
  //       description: "its a fucking pizza",
  //     });
  //     res.send(newItem);
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).send("bad");
  //   }
  // });
  // app.get("/", async (req: Request, res: Response) => {
  //   console.log("mama");
  //   const shopsData = [
  //     {
  //       phone: "1234567890",
  //       name: "Coffee Haven",
  //       description: "A cozy coffee shop with the best espresso in town.",
  //       locations: [{ lon: 34.7818, lat: 32.0853 }],
  //       categories: ["Coffee", "Breakfast"],
  //       tags: ["Cozy", "Local Favorite"],
  //       deliveryFee: 10,
  //       workingTime: [
  //         { day: "Sunday", opening: "08:00", closing: "22:00" },
  //         { day: "Monday", opening: "08:00", closing: "22:00" },
  //       ],
  //       avgDeliveryTime: 25,
  //     },
  //     {
  //       phone: "0987654321",
  //       name: "Pizza Paradise",
  //       description: "Authentic Italian pizza made with fresh ingredients.",
  //       locations: [{ lon: 34.7922, lat: 32.0694 }],
  //       categories: ["Pizza", "Italian"],
  //       tags: ["Family Friendly", "Takeaway"],
  //       deliveryFee: 15,
  //       workingTime: [
  //         { day: "Friday", opening: "10:00", closing: "23:00" },
  //         { day: "Saturday", opening: "10:00", closing: "23:00" },
  //       ],
  //       avgDeliveryTime: 30,
  //     },
  //     {
  //       phone: "1122334455",
  //       name: "Burger Blast",
  //       description: "Gourmet burgers with a modern twist.",
  //       locations: [{ lon: 34.8888, lat: 32.1111 }],
  //       categories: ["Burgers", "Fast Food"],
  //       tags: ["Quick Service", "Outdoor Seating"],
  //       deliveryFee: 20,
  //       workingTime: [
  //         { day: "Tuesday", opening: "11:00", closing: "22:00" },
  //         { day: "Wednesday", opening: "11:00", closing: "22:00" },
  //       ],
  //       avgDeliveryTime: 15,
  //     },
  //     {
  //       phone: "5566778899",
  //       name: "Sushi Supreme",
  //       description: "Premium sushi made by skilled chefs.",
  //       locations: [{ lon: 34.8012, lat: 32.0628 }],
  //       categories: ["Sushi", "Japanese"],
  //       tags: ["Fine Dining", "Healthy"],
  //       deliveryFee: 25,
  //       workingTime: [
  //         { day: "Thursday", opening: "12:00", closing: "23:00" },
  //         { day: "Friday", opening: "12:00", closing: "23:00" },
  //       ],
  //       avgDeliveryTime: 20,
  //     },
  //     {
  //       phone: "9988776655",
  //       name: "Taco Town",
  //       description: "Authentic Mexican tacos and sides.",
  //       locations: [{ lon: 34.7768, lat: 32.0562 }],
  //       categories: ["Mexican", "Tacos"],
  //       tags: ["Spicy", "Affordable"],
  //       deliveryFee: 12,
  //       workingTime: [
  //         { day: "Monday", opening: "10:00", closing: "20:00" },
  //         { day: "Tuesday", opening: "10:00", closing: "20:00" },
  //       ],
  //       avgDeliveryTime: 18,
  //     },
  //     {
  //       phone: "1111111111",
  //       name: "Baker's Delight",
  //       description:
  //         "Freshly baked goods every morning, straight from the oven.",
  //       locations: [{ lon: 34.7654, lat: 32.0543 }],
  //       categories: ["Bakery", "Desserts"],
  //       tags: ["Fresh", "Homemade"],
  //       deliveryFee: 8,
  //       workingTime: [
  //         { day: "Monday", opening: "06:00", closing: "18:00" },
  //         { day: "Tuesday", opening: "06:00", closing: "18:00" },
  //       ],
  //       avgDeliveryTime: 10,
  //     },
  //     {
  //       phone: "2222222222",
  //       name: "Vegan Vibes",
  //       description: "Delicious vegan meals packed with flavor and nutrition.",
  //       locations: [{ lon: 34.8011, lat: 32.0712 }],
  //       categories: ["Vegan", "Healthy"],
  //       tags: ["Plant-Based", "Eco-Friendly"],
  //       deliveryFee: 12,
  //       workingTime: [
  //         { day: "Wednesday", opening: "09:00", closing: "21:00" },
  //         { day: "Thursday", opening: "09:00", closing: "21:00" },
  //       ],
  //       avgDeliveryTime: 15,
  //     },
  //     {
  //       phone: "3333333333",
  //       name: "Pasta Palace",
  //       description: "Authentic Italian pasta dishes with a modern twist.",
  //       locations: [{ lon: 34.789, lat: 32.0789 }],
  //       categories: ["Italian", "Pasta"],
  //       tags: ["Authentic", "Family Recipes"],
  //       deliveryFee: 18,
  //       workingTime: [
  //         { day: "Friday", opening: "11:00", closing: "23:00" },
  //         { day: "Saturday", opening: "11:00", closing: "23:00" },
  //       ],
  //       avgDeliveryTime: 20,
  //     },
  //     {
  //       phone: "4444444444",
  //       name: "Grill Masters",
  //       description: "Perfectly grilled steaks and BBQ delights.",
  //       locations: [{ lon: 34.7844, lat: 32.0822 }],
  //       categories: ["BBQ", "Steakhouse"],
  //       tags: ["Grilled", "Juicy"],
  //       deliveryFee: 20,
  //       workingTime: [
  //         { day: "Sunday", opening: "12:00", closing: "22:00" },
  //         { day: "Monday", opening: "12:00", closing: "22:00" },
  //       ],
  //       avgDeliveryTime: 25,
  //     },
  //     {
  //       phone: "5555555555",
  //       name: "Smoothie Stop",
  //       description: "Freshly blended smoothies made from real fruits.",
  //       locations: [{ lon: 34.7756, lat: 32.0667 }],
  //       categories: ["Drinks", "Healthy"],
  //       tags: ["Fresh", "Fruity"],
  //       deliveryFee: 5,
  //       workingTime: [
  //         { day: "Tuesday", opening: "08:00", closing: "20:00" },
  //         { day: "Wednesday", opening: "08:00", closing: "20:00" },
  //       ],
  //       avgDeliveryTime: 10,
  //     },
  //     {
  //       phone: "6666666666",
  //       name: "The Spice Rack",
  //       description:
  //         "Exotic spices and flavorful dishes from around the world.",
  //       locations: [{ lon: 34.7689, lat: 32.0623 }],
  //       categories: ["Indian", "Spices"],
  //       tags: ["Flavorful", "Exotic"],
  //       deliveryFee: 18,
  //       workingTime: [
  //         { day: "Monday", opening: "11:00", closing: "22:00" },
  //         { day: "Tuesday", opening: "11:00", closing: "22:00" },
  //       ],
  //       avgDeliveryTime: 20,
  //     },
  //     {
  //       phone: "7777777777",
  //       name: "Crepe Corner",
  //       description: "Sweet and savory crepes for every taste.",
  //       locations: [{ lon: 34.7891, lat: 32.0745 }],
  //       categories: ["Desserts", "Breakfast"],
  //       tags: ["Sweet", "Savory"],
  //       deliveryFee: 10,
  //       workingTime: [
  //         { day: "Wednesday", opening: "09:00", closing: "20:00" },
  //         { day: "Thursday", opening: "09:00", closing: "20:00" },
  //       ],
  //       avgDeliveryTime: 15,
  //     },
  //     {
  //       phone: "8888888888",
  //       name: "Noodle Nirvana",
  //       description: "Asian noodle bowls and stir-fries, made to perfection.",
  //       locations: [{ lon: 34.7815, lat: 32.0688 }],
  //       categories: ["Asian", "Noodles"],
  //       tags: ["Comfort Food", "Customizable"],
  //       deliveryFee: 15,
  //       workingTime: [
  //         { day: "Friday", opening: "10:00", closing: "23:00" },
  //         { day: "Saturday", opening: "10:00", closing: "23:00" },
  //       ],
  //       avgDeliveryTime: 22,
  //     },
  //     {
  //       phone: "9999999999",
  //       name: "Donut Den",
  //       description: "Delicious donuts in a variety of flavors and toppings.",
  //       locations: [{ lon: 34.775, lat: 32.079 }],
  //       categories: ["Desserts", "Snacks"],
  //       tags: ["Sweet Treats", "Colorful"],
  //       deliveryFee: 8,
  //       workingTime: [
  //         { day: "Sunday", opening: "07:00", closing: "17:00" },
  //         { day: "Monday", opening: "07:00", closing: "17:00" },
  //       ],
  //       avgDeliveryTime: 10,
  //     },
  //     {
  //       phone: "1010101010",
  //       name: "Salad Station",
  //       description: "Fresh, crisp salads made with local produce.",
  //       locations: [{ lon: 34.7722, lat: 32.0733 }],
  //       categories: ["Healthy", "Salads"],
  //       tags: ["Fresh", "Vegan Options"],
  //       deliveryFee: 5,
  //       workingTime: [
  //         { day: "Tuesday", opening: "10:00", closing: "21:00" },
  //         { day: "Wednesday", opening: "10:00", closing: "21:00" },
  //       ],
  //       avgDeliveryTime: 12,
  //     },
  //     {
  //       phone: "1112121212",
  //       name: "Bagel Bliss",
  //       description: "Bagels baked fresh daily with a variety of spreads.",
  //       locations: [{ lon: 34.7744, lat: 32.066 }],
  //       categories: ["Breakfast", "Bakery"],
  //       tags: ["To-Go", "Fresh"],
  //       deliveryFee: 7,
  //       workingTime: [
  //         { day: "Monday", opening: "06:00", closing: "14:00" },
  //         { day: "Tuesday", opening: "06:00", closing: "14:00" },
  //       ],
  //       avgDeliveryTime: 8,
  //     },
  //   ];
  //   try {
  //     await Shop.insertMany(shopsData);
  //     res.send("good");
  //   } catch (err: any) {
  //     console.log("bbaba");
  //     res.status(500).send(err?.message);
  //   }
  // });
  // app.get("/", async (req: Request, res: Response) => {
  //   const items = [
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 50.0,
  //       foodName: "Pad Thai",
  //       description:
  //         "Classic Thai stir-fried rice noodles with tamarind sauce, peanuts, and shrimp.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 45.0,
  //       foodName: "Ramen Bowl",
  //       description:
  //         "Rich miso broth with ramen noodles, soft-boiled egg, and roasted pork.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 40.0,
  //       foodName: "Lo Mein",
  //       description:
  //         "Stir-fried egg noodles with mixed vegetables and chicken in soy-based sauce.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 55.0,
  //       foodName: "Pho Noodle Soup",
  //       description:
  //         "Vietnamese soup with rice noodles, herbs, and your choice of beef or chicken.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 60.0,
  //       foodName: "Drunken Noodles",
  //       description:
  //         "Spicy and savory flat rice noodles stir-fried with basil and chili.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 50.0,
  //       foodName: "Cold Sesame Noodles",
  //       description:
  //         "Chilled noodles tossed in a creamy sesame and peanut sauce.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 45.0,
  //       foodName: "Udon Stir Fry",
  //       description:
  //         "Thick udon noodles stir-fried with vegetables and teriyaki sauce.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 70.0,
  //       foodName: "Laksa",
  //       description:
  //         "Spicy coconut curry soup with rice noodles, shrimp, and tofu.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 55.0,
  //       foodName: "Yakisoba",
  //       description:
  //         "Japanese stir-fried noodles with vegetables and your choice of protein.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b45",
  //       currentPrice: 65.0,
  //       foodName: "Tom Yum Noodle Soup",
  //       description:
  //         "Hot and sour Thai soup with rice noodles, shrimp, and lime leaves.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 10.0,
  //       foodName: "Classic Glazed Donut",
  //       description: "A fluffy donut coated in a sweet, glossy glaze.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 12.0,
  //       foodName: "Chocolate Sprinkles Donut",
  //       description:
  //         "A chocolate-covered donut topped with colorful sprinkles.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 15.0,
  //       foodName: "Boston Cream Donut",
  //       description:
  //         "A filled donut with creamy custard and a chocolate glaze.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 8.0,
  //       foodName: "Sugar-Coated Donut",
  //       description: "A simple donut generously coated in fine sugar.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 20.0,
  //       foodName: "Maple Bacon Donut",
  //       description:
  //         "A sweet and savory donut topped with maple glaze and crispy bacon.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 18.0,
  //       foodName: "Cinnamon Twist Donut",
  //       description: "A twisted donut with a cinnamon-sugar coating.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 22.0,
  //       foodName: "Filled Jelly Donut",
  //       description: "A soft donut filled with sweet raspberry jelly.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 25.0,
  //       foodName: "Cookies and Cream Donut",
  //       description: "A donut topped with Oreo crumbles and a creamy glaze.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 30.0,
  //       foodName: "Donut Holes (12-pack)",
  //       description: "A dozen bite-sized glazed donut holes.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 15.0,
  //       foodName: "Strawberry Frosted Donut",
  //       description: "A pink frosted donut with a sweet strawberry flavor.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 12.0,
  //       foodName: "Vanilla Bean Donut",
  //       description: "A fluffy donut glazed with real vanilla bean frosting.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 18.0,
  //       foodName: "Red Velvet Donut",
  //       description: "Rich red velvet donut topped with cream cheese frosting.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 10.0,
  //       foodName: "Old-Fashioned Donut",
  //       description:
  //         "Classic cake donut with a hint of nutmeg and a light glaze.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 15.0,
  //       foodName: "Blueberry Donut",
  //       description: "A soft donut filled with fresh blueberry glaze.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 20.0,
  //       foodName: "Double Chocolate Donut",
  //       description:
  //         "Chocolate donut topped with chocolate icing and chocolate chips.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 22.0,
  //       foodName: "S'mores Donut",
  //       description:
  //         "Topped with marshmallows, chocolate, and graham cracker crumbs.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 25.0,
  //       foodName: "Caramel Pecan Donut",
  //       description: "A sweet caramel glaze with crunchy pecan topping.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 18.0,
  //       foodName: "Pumpkin Spice Donut",
  //       description:
  //         "Seasonal donut with warm pumpkin spice flavor and cinnamon sugar.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 28.0,
  //       foodName: "Matcha Donut",
  //       description:
  //         "Light and fluffy donut with a matcha glaze and sesame seeds.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b49",
  //       currentPrice: 30.0,
  //       foodName: "Donut Tower (6-pack)",
  //       description:
  //         "An assortment of six donuts in various flavors and toppings.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 40.0,
  //       foodName: "Caesar Salad",
  //       description:
  //         "Crisp romaine lettuce, Parmesan, croutons, and Caesar dressing.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 50.0,
  //       foodName: "Greek Salad",
  //       description:
  //         "A refreshing mix of cucumbers, tomatoes, feta cheese, and olives.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 55.0,
  //       foodName: "Quinoa Salad",
  //       description:
  //         "Protein-packed quinoa with roasted vegetables and a lemon vinaigrette.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 45.0,
  //       foodName: "Cobb Salad",
  //       description:
  //         "A hearty salad with chicken, avocado, egg, bacon, and blue cheese.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 35.0,
  //       foodName: "Garden Salad",
  //       description:
  //         "Fresh greens with carrots, tomatoes, cucumbers, and a choice of dressing.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 60.0,
  //       foodName: "Asian Chicken Salad",
  //       description:
  //         "Grilled chicken with shredded cabbage, carrots, and a sesame dressing.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 50.0,
  //       foodName: "Mediterranean Salad",
  //       description:
  //         "A blend of greens, hummus, chickpeas, and a tangy tahini dressing.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 55.0,
  //       foodName: "Caprese Salad",
  //       description:
  //         "Sliced mozzarella, tomatoes, and basil drizzled with balsamic glaze.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 40.0,
  //       foodName: "Fruit Salad",
  //       description: "A mix of fresh seasonal fruits with a drizzle of honey.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b4d",
  //       currentPrice: 65.0,
  //       foodName: "Grilled Shrimp Salad",
  //       description:
  //         "Fresh greens topped with grilled shrimp and a citrus vinaigrette.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 15.0,
  //       foodName: "Classic Bagel with Cream Cheese",
  //       description:
  //         "Freshly baked bagel topped with a generous layer of cream cheese.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 18.0,
  //       foodName: "Everything Bagel",
  //       description:
  //         "A savory bagel topped with a mix of sesame, poppy seeds, and dried garlic.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 20.0,
  //       foodName: "Smoked Salmon Bagel",
  //       description:
  //         "A hearty bagel filled with smoked salmon, cream cheese, and capers.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 12.0,
  //       foodName: "Cinnamon Raisin Bagel",
  //       description:
  //         "A sweet bagel packed with raisins and a hint of cinnamon.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 22.0,
  //       foodName: "Bagel Sandwich",
  //       description:
  //         "A toasted bagel filled with egg, cheese, and your choice of bacon or avocado.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 16.0,
  //       foodName: "Blueberry Bagel",
  //       description: "A sweet bagel loaded with fresh blueberries.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 25.0,
  //       foodName: "Lox and Dill Bagel",
  //       description:
  //         "A bagel topped with lox, dill cream cheese, and fresh cucumbers.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 14.0,
  //       foodName: "Plain Bagel with Butter",
  //       description: "A simple toasted bagel with a layer of melted butter.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 28.0,
  //       foodName: "Bagel Platter",
  //       description:
  //         "A platter of assorted bagels served with a variety of spreads.",
  //     },
  //     {
  //       shop: "677a63689a501924d5bf1b51",
  //       currentPrice: 18.0,
  //       foodName: "Sesame Bagel with Hummus",
  //       description: "A sesame bagel served with creamy hummus for dipping.",
  //     },
  //   ];
  //   //  677a63689a501924d5bf1b45 Noodle Nirvana
  //   //  677a63689a501924d5bf1b49 Donut Den
  //   //  677a63689a501924d5bf1b4d Salad Station
  //   //  677a63689a501924d5bf1b51 Bagel Bliss
  //   try {
  //     await Item.insertMany(items);
  //     res.send(`${items.length} items was inserted!`);
  //   } catch (err: any) {
  //     res.status(500).send(err?.message);
  //   }
  // });
  // app.get("/", async (req: Request, res: Response) => {
  //   // console.log(Shop);
  //   // console.log(Item);
  //   const shops = await Shop.find().populate("menu");
  //   const menus = shops.map((s) => {
  //     return s.menu;
  //   });
  //   console.log(menus); //prints the menus
  //   res.send(shops); // return without menus
  // });
}

app.use(`${BASE_URL}auth`, authRoutes); //✅

app.use(`${BASE_URL}user`, userRoutes); //✅

app.use(`${BASE_URL}favorites`, favoritesRoutes); //✅

app.use(`${BASE_URL}shop`, shopRoutes);
