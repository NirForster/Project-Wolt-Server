import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as cheerio from "cheerio";
import Restaurant from "../models/new-restaurant-model";
import City from "../models/city-model";

const woltURL = "https://wolt.com/en/isr";
const cityToScrape = "TLV - Herzliya area";
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * ✅ Scrape Wolt Business Data and Save to MongoDB with Detailed Information
 */
export const scrapeWoltBusinessData = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(`${woltURL}/tel-aviv`, { waitUntil: "networkidle2" });

    // ✅ Scrape both Restaurants and Stores
    const restaurants = await scrapeSection(page, "Restaurants");
    const stores = await scrapeSection(page, "Stores");

    // ✅ Save Basic City Information with Restaurants & Stores
    await City.updateOne(
      { city: cityToScrape },
      { $set: { city: cityToScrape, restaurants, stores } },
      { upsert: true }
    );

    // ✅ Scrape Detailed Data for Each Restaurant and Save
    for (const restaurant of restaurants) {
      console.log(`🔍 Extracting detailed data for: ${restaurant.name}`);
      const detailedData = await extractDetailedData(page, restaurant.link);
      await Restaurant.updateOne(
        { name: restaurant.name },
        { $set: { ...restaurant, ...detailedData } },
        { upsert: true }
      );
      console.log(`✅ Saved detailed data for: ${restaurant.name}`);
    }

    await browser.close();
    console.log(`✅ All restaurants and stores for ${cityToScrape} saved.`);
  } catch (error) {
    console.error("❌ Error occurred while scraping data:", error);
  }
};

/**
 * ✅ Extract Basic Restaurant and Store Links
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
      cards.slice(0, 5).map((card) => ({
        name: card.querySelector(".dllhz82")?.textContent?.trim() ?? "",
        link: card.querySelector("a")?.getAttribute("href") ?? "",
        image: card.querySelector("img")?.getAttribute("src") ?? "",
        description: card.querySelector(".d14x35kv")?.textContent?.trim() ?? "",
        rating: card.querySelector(".fhkxgqi")?.textContent?.trim() ?? "N/A",
        dollarCount:
          card
            .querySelector(".fhkxgqi span:first-child")
            ?.textContent?.trim() ?? "N/A",
      }))
  );
};

/**
 * ✅ Extract Detailed Restaurant Information
 */
const extractDetailedData = async (page: Page, link: string) => {
  await page.goto(`https://wolt.com${link}`, { waitUntil: "networkidle2" });
  await delay(2000);

  const initialModalCloseButton = await page.$('button[aria-label="Close"]');
  if (initialModalCloseButton) {
    await initialModalCloseButton.click();
    await delay(1000);
  }

  const moreInfoButton = await page.$(
    '[data-test-id="venue-more-info-button"]'
  );
  if (moreInfoButton) {
    await moreInfoButton.click();
    await delay(2000);
  }

  const pageContent = await page.content();
  const $ = cheerio.load(pageContent);

  // ✅ Data Extraction with Fallbacks
  const backgroundImage =
    $(".itul5qe .i1wyuf56.r1j6es2w img").attr("src") || "No Image";
  const fullDescription =
    $("p.v13orw9u").text().trim() || "No description available";

  const addressElement = $(".rhmhbf p");
  const address = {
    name: addressElement.eq(0).text().trim() || "No Address Available",
    zip: addressElement.eq(1).text().trim() || "No Zip Code Available",
  };

  const openingTimes = $("table.v1s3d5xv")
    .first()
    .find("tr")
    .map((_, row) => ({
      day: $(row).find("td").first().text().trim() || "N/A",
      time: $(row).find("td").last().text().trim() || "N/A",
    }))
    .get();

  const deliveryTimes = $("table.v1s3d5xv")
    .last()
    .find("tr")
    .map((_, row) => ({
      day: $(row).find("td").first().text().trim() || "N/A",
      time: $(row).find("td").last().text().trim() || "N/A",
    }))
    .get();

  const deliveryFeeStructure = $("div.v2wnspg p")
    .map((_, el) => ({
      text: $(el).clone().children("span").remove().end().text().trim(),
      spanText: $(el).find("span").text().trim(),
    }))
    .get();

  const phoneNumber =
    $("a.cbc_TextButton_rootCss_7cfd4")
      .text()
      .trim()
      .match(/(\+?\d{10,15})/)?.[0] ?? "";

  return {
    backgroundImage,
    fullDescription,
    address,
    openingTimes,
    deliveryTimes,
    deliveryFeeStructure,
    phoneNumber,
  };
};

export default scrapeWoltBusinessData;
