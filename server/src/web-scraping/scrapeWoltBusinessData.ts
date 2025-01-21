import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as cheerio from "cheerio";
import newBusiness from "../models/new-Business-model";
import newCity from "../models/new-city-model";

const cities = [
  "Afula & Emek Yizrael area",
  "Ashdod and Lachish Area",
  "Ashkelon",
  "Beer Sheva",
  "Eilat",
  "Haifa & HaKrayot",
  "Hasharon area",
  "Jerusalem",
  "Karmiel area",
  "Kiryat Shmona area",
  "Mevaseret Zion Area",
  "Modi'in",
  "Nazareth - Nof Hagalil area",
  "Netanya area",
  "Netivot - Sderot area",
  "Pardes Hanna - Hadera area",
  "Petah Tikva - Bik’at Ono",
  "Rishon Lezion & Hashfela",
  "Rosh Pinna - Zefat area",
  "TLV - Herzliya area",
  "Yokneam - Tivon area",
];

const woltURL = "https://wolt.com/en/isr";
const cityToScrape = "TLV - Herzliya area";
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const scrapeWoltBusinessData = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(`${woltURL}/tel-aviv`, { waitUntil: "networkidle2" });

    // Scrape both Restaurants and Stores
    const restaurants = await scrapeSection(page, "Restaurants");
    const stores = await scrapeSection(page, "Stores");

    const businesses = [...restaurants, ...stores];

    const cityBusinesses = [];

    for (const business of businesses) {
      console.log(`🔍 Extracting detailed data for: ${business.name}`);
      const detailedData = await extractDetailedData(page, business.link);

      const businessData = {
        summary: {
          ...business,
          location: { city: cityToScrape, address: detailedData.address.name },
        },
        additionalInfo: {
          coverImage: detailedData.coverImage,
          businessDescription: detailedData.businessDescription,
          address: detailedData.address,
          openingTimes: detailedData.openingTimes,
          deliveryTimes: detailedData.deliveryTimes,
          deliveryFeeStructure: detailedData.deliveryFeeStructure,
          phoneNumber: detailedData.phoneNumber,
          website: detailedData.website,
        },
      };

      // Save the business and retrieve the `_id`
      const savedBusiness = await newBusiness.findOneAndUpdate(
        { "summary.name": business.name },
        { $set: businessData },
        { upsert: true, new: true }
      );
      console.log(`✅ Saved detailed data for: ${business.name}`);

      // Add the business to the city's business list
      cityBusinesses.push({
        name: savedBusiness.summary.name,
        id: savedBusiness._id,
      });
    }

    // Update the City model with the businesses
    await newCity.updateOne(
      { name: cityToScrape },
      {
        $set: {
          name: cityToScrape,
          businesses: cityBusinesses,
        },
      },
      { upsert: true }
    );

    console.log(`✅ All restaurants and stores for ${cityToScrape} saved.`);
    await browser.close();
  } catch (error) {
    console.error("❌ Error occurred while scraping data:", error);
  }
};

const scrapeSection = async (page: Page, sectionName: string) => {
  const businessType = sectionName === "Restaurants" ? "restaurant" : "store";

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

  const scrapedData = await page.$$eval(
    ".sq0n3gz.cb-elevated.cb_elevation_elevationXsmall_equ2.a164dpdw.r1bc29i8",
    (cards, type) =>
      cards.slice(0, 50).map((card) => {
        const deliveryTimeText =
          card.querySelector(".b15bvov8.b1qdz9qo")?.textContent?.trim() ?? "";
        const deliveryTimeRange = deliveryTimeText.match(/(\d+)-(\d+)/);

        const ratingElement = card.querySelectorAll(".fhkxgqi");
        const lastElementIndex = ratingElement.length - 1;
        const secondLastElementIndex = ratingElement.length - 2;

        let rating =
          ratingElement[lastElementIndex]?.textContent?.trim() ?? "N/A";
        let dollarCount =
          ratingElement[secondLastElementIndex]
            ?.querySelector("span")
            ?.textContent?.trim() ?? "N/A";

        if (rating.includes("$")) {
          const temp = rating;
          rating = dollarCount;
          dollarCount = temp;
        }

        const validDollarCounts = ["$", "$$", "$$$", "$$$$"];
        if (!validDollarCounts.includes(dollarCount)) {
          dollarCount = "N/A";
        }

        if (isNaN(Number(rating))) {
          rating = "N/A";
        }

        const labels = card.querySelectorAll(".cb_Tag_Label_lmag");
        const deliveryFee = labels[0]?.textContent?.trim() ?? null;
        const storeType = labels[1]?.textContent?.trim() ?? "N/A";

        return {
          type,
          name: card.querySelector(".dllhz82")?.textContent?.trim() ?? "",
          link: card.querySelector("a")?.getAttribute("href") ?? "",
          image: card.querySelector("img")?.getAttribute("src") ?? "",
          shortDescription:
            card.querySelector(".d14x35kv")?.textContent?.trim() ?? "",
          estimatedDeliveryTime: deliveryTimeRange
            ? {
                min: parseInt(deliveryTimeRange[1], 10),
                max: parseInt(deliveryTimeRange[2], 10),
              }
            : { min: null, max: null },
          rating: Number(rating) || null,
          dollarCount,
          label: { deliveryFee, storeType },
        };
      }),
    businessType
  );

  return scrapedData;
};

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
