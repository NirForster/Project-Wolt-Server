import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as cheerio from "cheerio";
import City from "../models/new-restaurant-model";
import Item from "../models/new-items-modal";

const woltURL = "https://wolt.com/en/isr";
const cityToScrape = "TLV - Herzliya area";
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * ✅ Scrape Wolt Menu Data and Save to MongoDB (with City and Nested Data)
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

  // ✅ Scrape restaurants
  const restaurants = await scrapeSection(page, "Restaurants");

  /**
   * ✅ Save City and Nested Restaurants
   */
  // const cityData = {
  //   city: cityToScrape,
  //   restaurants: restaurants.map((r) => ({
  //     ...r, // ✅ Assigning temporary IDs for new restaurants
  //     _id: undefined, // Remove _id if not provided
  //   })),
  // };

  // const existingCity = await City.findOne({ city: cityToScrape });

  // if (existingCity) {
  //   await City.updateOne(
  //     { city: cityToScrape },
  //     { $set: { restaurants: cityData.restaurants } }
  //   );
  // } else {
  //   await City.create(cityData);
  // }

  console.log(
    `✅ City and all restaurants for ${cityToScrape} have been saved.`
  );

  // ✅ Scrape menu for each restaurant
  for (const restaurant of restaurants) {
    const existingRestaurant = await City.findOne({
      city: cityToScrape,
      "restaurants.name": restaurant.name,
    }).select("restaurants.$");

    if (!existingRestaurant) continue;

    try {
      console.log(`🔍 Scraping menu for restaurant: ${restaurant.name}`);
      const restaurantId = existingRestaurant.restaurants[0]._id.toString();
      const sections = await extractMenuData(
        page,
        restaurant.link ?? "",
        restaurantId,
        restaurant.name
      );

      await Item.updateOne(
        { restaurant: restaurantId },
        {
          $set: {
            restaurant: restaurantId,
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

  await browser.close();
  console.log("✅ Menu scraping completed successfully!");
};

/**
 * ✅ Scrape Restaurant Links for a Section
 */
const scrapeSection = async (page: Page, sectionName: string) => {
  await page.$$eval(
    '[data-active="false"].snbpb50 span',
    (tabs, section) => {
      tabs.forEach((tab) => {
        if (tab.textContent?.includes(section)) {
          (tab.closest("a") as HTMLElement)?.click();
        }
      });
    },
    sectionName
  );

  await delay(3000);
  await page.waitForSelector('[data-test-id="VenueVerticalListGrid"]');

  return await page.$$eval(
    ".sq0n3gz.cb-elevated.cb_elevation_elevationXsmall_equ2.a164dpdw.r1bc29i8",
    (cards) =>
      cards.map((card) => ({
        name: card.querySelector(".dllhz82")?.textContent?.trim() ?? "",
        image: card.querySelector("img")?.getAttribute("src") ?? "",
        description: card.querySelector(".d14x35kv")?.textContent?.trim() ?? "",
        rating:
          card.querySelector(".fhkxgqi")?.textContent?.trim() ?? "No Rating",
        dollarCount:
          card
            .querySelector(".fhkxgqi span:first-child")
            ?.textContent?.trim() ?? "",
        link: card.querySelector("a")?.getAttribute("href") ?? "",
      }))
  );
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
