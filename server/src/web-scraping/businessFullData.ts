import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as cheerio from "cheerio";
import Business from "../models/Business-model";
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

    // Log the scraped data for debugging
    console.log(
      "Restaurants Scraped Data:",
      JSON.stringify(restaurants, null, 2)
    );
    console.log("Stores Scraped Data:", JSON.stringify(stores, null, 2));

    // ✅ Save Basic City Information with Restaurants & Stores
    await City.updateOne(
      { city: cityToScrape },
      {
        $set: {
          city: cityToScrape,
          restaurants: restaurants.map((r) => ({
            name: r.name,
            link: r.link,
            image: r.image,
            description: r.description,
            estimatedDeliveryTime: r.estimatedDeliveryTime,
            rating: r.rating,
            dollarCount: r.dollarCount,
            label: r.label,
          })),
          stores: stores.map((s) => ({
            name: s.name,
            link: s.link,
            image: s.image,
            description: s.description,
            estimatedDeliveryTime: s.estimatedDeliveryTime,
            rating: s.rating,
            dollarCount: s.dollarCount,
            label: s.label,
          })),
        },
      },
      { upsert: true }
    )
      .then(() => console.log("Data saved successfully."))
      .catch((err) => console.error("Error saving data:", err));

    // ✅ Scrape Detailed Data for Each Business and Save
    for (const business of [...restaurants, ...stores]) {
      console.log(`🔍 Extracting detailed data for: ${business.name}`);
      const detailedData = await extractDetailedData(page, business.link);
      // Ensure `type` is set explicitly and not overwritten
      const businessData = {
        ...business,
        type: business.type, // Set type explicitly from the scraped data
        ...detailedData,
      };

      await Business.updateOne(
        { name: business.name },
        { $set: businessData },
        { upsert: true }
      );
      console.log(`✅ Saved detailed data for: ${business.name}`);
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
  const businessType = sectionName === "Restaurants" ? "restaurant" : "store";

  // Click the tab with the matching section name
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

  // Wait for the section content to load
  await delay(3000);
  await page.waitForSelector('[data-test-id="VenueVerticalListGrid"]');

  // Scrape the data from the loaded section
  const scrapedData = await page.$$eval(
    ".sq0n3gz.cb-elevated.cb_elevation_elevationXsmall_equ2.a164dpdw.r1bc29i8",
    (cards, type) =>
      cards.slice(0, 20).map((card) => {
        // Extract delivery time range
        const deliveryTimeText =
          card.querySelector(".b15bvov8.b1qdz9qo")?.textContent?.trim() ?? "";
        const deliveryTimeRange = deliveryTimeText.match(/(\d+)-(\d+)/);

        // Extract rating and dollar count
        const ratingElement = card.querySelectorAll(".fhkxgqi");
        const lastElementIndex = ratingElement.length - 1;
        const secondLastElementIndex = ratingElement.length - 2;

        // Use fallback logic
        let rating =
          ratingElement[lastElementIndex]?.textContent?.trim() ?? "N/A";
        let dollarCount =
          ratingElement[secondLastElementIndex]
            ?.querySelector("span")
            ?.textContent?.trim() ?? "N/A";

        // If rating contains a dollar sign, swap values
        if (rating.includes("$")) {
          const temp = rating;
          rating = dollarCount;
          dollarCount = temp;
        }

        // Ensure dollar count is a valid format
        const validDollarCounts = ["$", "$$", "$$$", "$$$$"];
        if (!validDollarCounts.includes(dollarCount)) {
          dollarCount = "N/A";
        }

        // Ensure rating is a valid number
        if (isNaN(Number(rating))) {
          rating = "N/A";
        }

        // Extract the labels (e.g., "0₪ delivery fee", "Supermarket")
        const labels = card.querySelectorAll(".cb_Tag_Label_lmag");
        const deliveryFee = labels[0]?.textContent?.trim() ?? null;
        const storeType = labels[1]?.textContent?.trim() ?? "N/A"; // Store type is the second label

        return {
          type, // Use the passed `businessType`
          name: card.querySelector(".dllhz82")?.textContent?.trim() ?? "",
          link: card.querySelector("a")?.getAttribute("href") ?? "",
          image: card.querySelector("img")?.getAttribute("src") ?? "",
          description:
            card.querySelector(".d14x35kv")?.textContent?.trim() ?? "",
          estimatedDeliveryTime: deliveryTimeRange
            ? {
                min: parseInt(deliveryTimeRange[1], 10),
                max: parseInt(deliveryTimeRange[2], 10),
              }
            : { min: null, max: null }, // Default to null if not found
          rating: Number(rating) || null,
          dollarCount,
          label: { deliveryFee, storeType },
        };
      }),
    businessType // Pass `businessType` as the second argument
  );

  // Return the scraped data
  return scrapedData;
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
  const coverImage =
    $(".itul5qe .i1wyuf56.r1j6es2w img").attr("src") || "No Image";
  const businessDescription =
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

  const website = $("a.s1y70h65").text().trim();

  console.log("Detailed Restaurant Information: ", {
    coverImage,
    businessDescription,
    address,
    openingTimes,
    deliveryTimes,
    deliveryFeeStructure,
    phoneNumber,
    website,
  });

  return {
    coverImage,
    businessDescription,
    address,
    openingTimes,
    deliveryTimes,
    deliveryFeeStructure,
    phoneNumber,
    website,
  };
};

export default scrapeWoltBusinessData;
