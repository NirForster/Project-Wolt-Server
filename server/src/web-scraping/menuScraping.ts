import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as cheerio from "cheerio";
import Restaurant from "../models/new-restaurant-model";
import Item from "../models/new-items-modal";

const woltURL = "https://wolt.com/en/isr";
const cityToScrape = "TLV - Herzliya area";
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * ✅ Scrape Wolt Menu Data and Print Results Before Saving to MongoDB
 */
export const scrapeWoltMenuData = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(woltURL, { waitUntil: "networkidle2" });

  const cityLinks = await page.$$eval(
    '[data-test-id^="front-city-link-ISR"]',
    (links) =>
      links.map((link) => ({
        city: link.querySelector("span")?.textContent?.trim() ?? "Unknown",
        url: link.getAttribute("href") ?? "",
      }))
  );

  const normalizedCityLinks = cityLinks.map((city) => ({
    ...city,
    cityNormalized: city.city.toLowerCase().replace(/\s+/g, ""),
  }));

  const normalizedTargetCity = cityToScrape.toLowerCase().replace(/\s+/g, "");
  const targetCity = normalizedCityLinks.find(
    (city) => city.cityNormalized === normalizedTargetCity
  );

  if (!targetCity) {
    console.error("❌ City not found. Exiting...");
    await browser.close();
    return;
  }

  console.log(`✅ City found: ${targetCity.city}`);
  await page.goto(`https://wolt.com${targetCity.url}`, {
    waitUntil: "networkidle2",
  });

  /**
   * ✅ Fetch Restaurants from MongoDB for Menu Scraping
   */
  const restaurants = await Restaurant.find();
  if (!restaurants.length) {
    console.error("❌ No restaurants found in the database.");
    await browser.close();
    return;
  }

  for (const restaurant of restaurants) {
    try {
      console.log(`🔍 Scraping menu for restaurant: ${restaurant.name}`);
      const sections = await extractMenuData(
        page,
        restaurant.link ?? "",
        restaurant._id.toString()
      );

      // ✅ Print the full scraped data to the console
      console.log("🚀 Scraped Menu Data: ", JSON.stringify(sections, null, 2));

      // ✅ Save grouped data with forms to MongoDB
      await Item.updateOne(
        { restaurant: restaurant._id },
        { $set: { restaurant: restaurant._id, sections } },
        { upsert: true }
      );
      console.log(
        `✅ Menu sections and items with forms saved for ${restaurant.name}`
      );
    } catch (error) {
      console.error(`❌ Error scraping menu for ${restaurant.name}`, error);
    }
  }

  await browser.close();
  console.log("✅ Menu scraping completed successfully!");
};

/**
 * ✅ Extract Menu Data Grouped by Sections with Form Data
 */
const extractMenuData = async (
  page: Page,
  link: string,
  restaurantId: string
) => {
  await page.goto(`https://wolt.com${link}`, { waitUntil: "networkidle2" });
  await delay(2000);

  const sections = await page.$$('div[data-test-id="MenuSection"]');
  const sectionData: any[] = []; // ✅ Holds grouped sections and items

  const initialModalCloseButton = await page.$('button[aria-label="Close"]');
  if (initialModalCloseButton) {
    await initialModalCloseButton.click();
  }

  for (const section of sections) {
    const sectionTitle = await section.$eval(
      '[data-test-id="MenuSectionTitle"] h2',
      (el) => el.textContent?.trim() || "No Title"
    );

    const sectionDescription = await section
      .$eval(".pihaots", (el) => el.textContent?.trim())
      .catch(() => "");

    const items = [];

    const menuItems = await section.$$("div.d1wyvslh");
    for (const menuItem of menuItems) {
      const statusText = await menuItem
        .$eval(".cb_typographyClassName_bodyBase_b1fq", (el) =>
          el.textContent?.trim()
        )
        .catch(() => "");

      const isUnavailable = statusText?.includes("Not available") ?? false;
      const isPopular = statusText?.includes("Popular") ?? false;

      if (isUnavailable) {
        console.warn("⚠️ Item is unavailable, skipping...");
        continue;
      }

      delay(3000);
      await menuItem.click();
      await page.waitForSelector('[data-test-id="product-modal"]').catch(() => {
        console.warn("❌ Modal did not open properly. Skipping item.");
        return;
      });

      const modalContent = await page.content();
      const $$ = cheerio.load(modalContent);

      const itemName = $$("h2.h1m8nnah").text().trim();
      const itemImage =
        $$("div.s1s3b2lb img.s1siin91").attr("src") || "No Image";
      const itemPrice = $$('span[data-test-id="product-modal.price"]')
        .text()
        .trim();
      const itemDescription = $$("#product-description").text().trim();

      // ✅ Extract Form Data for Each Item
      const formData: any[] = [];
      $$("fieldset[data-test-id='product-option-group']").each((_, field) => {
        const optionTitle = $$(field)
          .find('[data-test-id="product-option-group-name"]')
          .text()
          .trim();

        const optionDescription = $$(field)
          .find('p[class*="oh0kvro"]')
          .text()
          .trim();

        const options = $$(field)
          .find("input")
          .map((_, input) => ({
            optionLabel: $$(input)
              .parent()
              .next()
              .find("span.n1h7omf3")
              .text()
              .trim(),
            optionPrice:
              $$(input)
                .parent()
                .next()
                .find('span[data-test-id="PriceColumn.Price"]')
                .text()
                .trim() || "Included",
          }))
          .get();

        formData.push({
          title: optionTitle,
          description: optionDescription,
          type:
            $$(field).find("input").attr("type") === "radio"
              ? "radio"
              : "checkbox",
          options,
        });
      });

      items.push({
        name: itemName,
        image: itemImage,
        price: itemPrice,
        description: itemDescription,
        isPopular,
        formData,
      });

      const closeModal = await page.$(
        'button[data-test-id="modal-close-button"]'
      );
      if (closeModal) await closeModal.click();
      await delay(1000);
    }

    sectionData.push({
      sectionTitle,
      sectionDescription,
      items,
    });
  }

  return sectionData; // ✅ Return sections with forms grouped
};

export default scrapeWoltMenuData;
