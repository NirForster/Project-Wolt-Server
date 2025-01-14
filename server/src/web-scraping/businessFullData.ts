import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as cheerio from "cheerio";
import Restaurant from "../models/new-restaurant-model";

const woltURL = "https://wolt.com/en/isr";
const cityToScrape = "TLV - Herzliya area";
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * ✅ Scrape Wolt Business Data and Save to MongoDB
 */
export const scrapeWoltBusinessData = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(woltURL, { waitUntil: "networkidle2" });

    // Fetch city links
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

    // Scrape restaurant links
    const scrapeSection = async (sectionName: string) => {
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
          cards.slice(0, 10).map((card) => ({
            name: card.querySelector(".dllhz82")?.textContent?.trim() ?? "",
            image: card.querySelector("img")?.getAttribute("src") ?? "",
            description:
              card.querySelector(".d14x35kv")?.textContent?.trim() ?? "",
            rating:
              card.querySelector(".fhkxgqi")?.textContent?.trim() ??
              "No Rating",
            dollarCount:
              card
                .querySelector(".fhkxgqi span:first-child")
                ?.textContent?.trim() ?? "",
            link: card.querySelector("a")?.getAttribute("href") ?? "",
          }))
      );
    };

    const restaurants = await scrapeSection("Restaurants");

    /**
     * ✅ Extract Detailed Restaurant Information
     */
    const extractDetailedData = async (page: Page, link: string) => {
      await page.goto(`https://wolt.com${link}`, { waitUntil: "networkidle2" });
      await delay(2000);

      const initialModalCloseButton = await page.$(
        'button[aria-label="Close"]'
      );
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

      // ✅ Fixed Extraction Logic with Fallback Handling
      const backgroundImage =
        $(".itul5qe .i1wyuf56.r1j6es2w img").attr("src") ?? "No Image";

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

    /**
     * ✅ Save Data to MongoDB
     */
    for (const restaurant of restaurants) {
      console.log(`🔍 Scraping details for restaurant: ${restaurant.name}`);
      const detailedData = await extractDetailedData(page, restaurant.link);

      // Ensure MongoDB Schema Matches
      const restaurantData = {
        ...restaurant,
        ...detailedData,
        address: detailedData.address,
        openingTimes: detailedData.openingTimes,
        deliveryTimes: detailedData.deliveryTimes,
        deliveryFeeStructure: detailedData.deliveryFeeStructure,
        phoneNumber: detailedData.phoneNumber,
      };

      try {
        await Restaurant.create(restaurantData); // ✅ Save to MongoDB
        console.log(`✅ Saved: ${restaurant.name}`);
      } catch (error) {
        console.error(`❌ Error saving ${restaurant.name}:`, error);
      }

      console.log("📊 Final Data Sent to MongoDB:", restaurantData);
    }

    await browser.close();
    console.log("✅ All restaurants have been saved to MongoDB.");
  } catch (error) {
    console.error("❌ Error occurred while scraping data:", error);
  }
};

export default scrapeWoltBusinessData;
