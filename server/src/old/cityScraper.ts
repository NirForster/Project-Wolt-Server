// // scrapers/cityScraper.ts
// import puppeteer from "puppeteer";
// import City from "../models/new-city-model";

// const woltURL = "https://wolt.com/en/isr";
// const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// export const scrapeWoltCities = async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();
//   await page.goto(woltURL, { waitUntil: "networkidle2" });

//   const cityLinks = await page.$$eval(
//     '[data-test-id^="front-city-link-ISR"]',
//     (links) =>
//       links.map((link) => ({
//         city: link.querySelector("span")?.textContent?.trim() ?? "Unknown",
//         url: link.getAttribute("href") ?? "",
//       }))
//   );

//   for (const city of cityLinks) {
//     await page.goto(`https://wolt.com${city.url}`, {
//       waitUntil: "networkidle2",
//     });

//     const restaurants = await page.$$eval(
//       '[data-test-id="VenueVerticalListItem"]',
//       (cards) =>
//         cards.map((card) => ({
//           name: card.querySelector(".dllhz82")?.textContent?.trim() ?? "",
//           link: card.querySelector("a")?.getAttribute("href") ?? "",
//         }))
//     );

//     await City.updateOne(
//       { city: city.city },
//       { $set: { city: city.city, restaurantLinks: restaurants } },
//       { upsert: true }
//     );
//     console.log(`✅ City scraped: ${city.city}`);
//   }

//   await browser.close();
//   console.log("✅ All cities scraped and saved.");
// };
