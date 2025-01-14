import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as cheerio from "cheerio";
import City from "../models/city-model";
import Item from "../models/new-items-modal";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * ✅ Scrape Wolt Menu Data for Existing Restaurants and Save to MongoDB
 */
export const scrapeWoltMenuData = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // ✅ Fetch all stored restaurants from City model
  const cities = await City.find();
  if (!cities.length) {
    console.error("❌ No cities found in the database. Exiting...");
    await browser.close();
    return;
  }

  for (const city of cities) {
    console.log(`🔍 Scraping menus for city: ${city.city}`);

    for (const restaurant of city.restaurants) {
      try {
        if (!restaurant.link) {
          console.warn(
            `⚠️ No link provided for restaurant: ${restaurant.name}. Skipping...`
          );
          continue;
        }

        console.log(`🔍 Scraping menu for restaurant: ${restaurant.name}`);

        // ✅ Go to the restaurant page
        await page.goto(`https://wolt.com${restaurant.link}`, {
          waitUntil: "networkidle2",
        });

        const sections = await extractMenuData(
          page,
          restaurant.link ?? "",
          restaurant._id?.toString() || "",
          restaurant.name || "Unknown Restaurant"
        );

        await Item.updateOne(
          { restaurant: restaurant._id },
          {
            $set: {
              restaurant: restaurant._id,
              restaurantName: restaurant.name,
              sections,
            },
          },
          { upsert: true }
        );

        console.log(`✅ Menu items saved for ${restaurant.name}`);
      } catch (error) {
        console.error(`❌ Error scraping menu for ${restaurant.name}:`, error);
      }
    }
  }

  await browser.close();
  console.log("✅ Menu scraping completed successfully!");
};

/**
 * ✅ Extract Menu Data with Sections and Items
 */
const extractMenuData = async (
  page: Page,
  link: string,
  restaurantId: string,
  restaurantName: string
) => {
  await page.goto(`https://wolt.com${link}`, { waitUntil: "networkidle2" });
  await delay(2000);

  const initialModalCloseButton = await page.$('button[aria-label="Close"]');
  if (initialModalCloseButton) {
    await initialModalCloseButton.click();
    await delay(1000);
  }

  const sections = await page.$$('div[data-test-id="MenuSection"]');
  const menuSections: any[] = [];

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

      const isUnavailable = statusText?.includes("Not available");
      const isPopular = statusText?.includes("Popular");

      if (isUnavailable) {
        console.warn("⚠️ Item is unavailable, skipping...");
        continue;
      }

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

      // ✅ Extracting Form Data
      const formData: any[] = [];
      $$("fieldset[data-test-id='product-option-group']").each((_, field) => {
        const optionTitle = $$(field)
          .find('[data-test-id="product-option-group-name"]')
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
      await delay(500);
    }

    menuSections.push({
      sectionTitle,
      sectionDescription,
      items,
    });
  }

  return menuSections;
};

export default scrapeWoltMenuData;
