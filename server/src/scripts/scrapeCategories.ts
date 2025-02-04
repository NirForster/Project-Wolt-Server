import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import mongoose from "mongoose";
import Business from "../models/new-business-model";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const scrollToLoadMoreRestaurants = async (
  page: Page,
  selector: string,
  timeout = 15000 // Extend the timeout to allow more time for loading
) => {
  let previousCount = 0;
  let startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentCount = await page.$$eval(
      selector,
      (elements) => elements.length
    );

    if (currentCount > previousCount) {
      console.log(`🔄 Loaded ${currentCount} items. Scrolling for more...`);
      previousCount = currentCount;

      // Reset the timer when new items are detected
      startTime = Date.now();

      // Scroll explicitly to the bottom of the page
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await delay(3000); // Wait for new content to load
    } else {
      console.log(`⏳ Waiting for new items to load...`);
      await delay(500); // Short delay before checking again
    }
  }

  console.log("✅ Finished loading all items.");
};

export const scrapeAndSaveRestaurantCategories = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI; // Use the environment variable
    if (!mongoURI) throw new Error("MONGODB_URI is not defined in environment");

    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Navigate to the discovery page for restaurants
    await page.goto("https://wolt.com/en/isr/petah-tikva/restaurants", {
      waitUntil: "networkidle2",
    });

    // Extract categories
    const categories = await page.$$eval("a.bg0bCc.sf73b8n", (elements) =>
      elements.map((el) => ({
        name:
          el.getAttribute("aria-label")?.replace(", ", "").trim() || "Unknown",
        href: el.href,
      }))
    );

    console.log("Categories found:", categories);

    for (const category of categories) {
      console.log(`🔍 Processing category: ${category.name}`);

      // Navigate to the category page
      await page.goto(category.href, { waitUntil: "networkidle2" });
      await delay(2000);

      // Scroll to load all restaurants
      await scrollToLoadMoreRestaurants(page, "div.d1phuis6.bzrkw9x a");

      // Extract restaurant details
      const restaurants = await page.$$eval("div.d1phuis6.bzrkw9x a", (cards) =>
        cards.map((card) => ({
          name:
            card.querySelector("div.dllhz82")?.textContent?.trim() || "Unknown",
          link: card.getAttribute("href") || "No link",
        }))
      );

      console.log(
        `🍴 Found ${restaurants.length} restaurants in category: ${category.name}`
      );

      for (const restaurant of restaurants) {
        if (!restaurant.name || !restaurant.link) continue;

        // Check if the restaurant exists in the database
        const existingBusiness = await Business.findOne({
          "summary.name": restaurant.name,
        });

        if (existingBusiness) {
          console.log(`✅ Found in DB: ${restaurant.name}`);

          // Add the category if not already present
          if (!existingBusiness.categories) {
            existingBusiness.categories = [];
          }

          if (!existingBusiness.categories.includes(category.name)) {
            existingBusiness.categories.push(category.name);

            // Ensure dollarCount is valid before saving
            if (
              !["$", "$$", "$$$", "$$$$"].includes(
                existingBusiness.summary.dollarCount
              )
            ) {
              existingBusiness.summary.dollarCount = "$"; // Default to the lowest value
            }

            await existingBusiness.save();
            console.log(
              `➕ Added category '${category.name}' to ${restaurant.name}`
            );
          } else {
            console.log(
              `ℹ️ Category '${category.name}' already exists for ${restaurant.name}`
            );
          }
        } else {
          console.warn(`❌ Restaurant not found in DB: ${restaurant.name}`);
        }
      }
    }

    console.log("✅ Scraping and categorization completed successfully!");
  } catch (error) {
    console.error("❌ Error during scraping:", error);
  } finally {
    await browser.close();
    await mongoose.disconnect();
    console.log("✅ Browser closed and MongoDB disconnected");
  }
};

// Run the function
scrapeAndSaveRestaurantCategories();
