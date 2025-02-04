import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import * as cheerio from "cheerio";
import Item from "../models/items-modal";
import Business from "../models/new-business-model";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * ✅ Scrape Wolt Menu Data for Businesses
 */
export const scrapeWoltMenuData = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // ✅ Fetch all businesses from the Business model
  const businesses = await Business.find({
    _id: { $nin: await Item.distinct("business") },
  });
  if (!businesses.length) {
    console.error("❌ ❌ No businesses without menus found. Exiting...");
    await browser.close();
    return;
  }

  for (const business of businesses) {
    try {
      console.log(`🔍 Scraping menu for business: ${business.summary.name}`);
      await page.goto(`https://wolt.com${business.summary.link}`, {
        waitUntil: "networkidle2",
      });

      const sections = await extractMenuData(page, business.summary.link);

      await Item.updateOne(
        { business: business._id },
        {
          $set: {
            business: business._id,
            businessName: business.summary.name,
            sections,
          },
        },
        { upsert: true }
      );

      console.log(`✅ Menu items saved for ${business.summary.name}`);
    } catch (error) {
      console.error(
        `❌ Error scraping menu for business ${business.summary.name}:`,
        error
      );
    }
  }
  await browser.close();
  console.log("✅ Menu scraping completed successfully!");
};

/**
 * ✅ Extract Menu Data with Sections and Items
 */
const extractMenuData = async (page: Page, link: string) => {
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
      const isUnavailable = await menuItem
        .$eval(".cb_typographyClassName_bodyBase_b1fq", (el) =>
          el.textContent?.includes("Not available")
        )
        .catch(() => false);

      if (isUnavailable) {
        console.warn("⚠️ Item is unavailable, skipping...");
        continue;
      }

      let retries = 0;
      const MAX_RETRIES = 3; // Maximum retry limit
      let isCorrectModal = false;

      while (retries < MAX_RETRIES && !isCorrectModal) {
        console.log(`🔄 Attempting to click item (Retry ${retries + 1})`);

        try {
          // Scroll the item into view and click
          await menuItem.evaluate((el) =>
            el.scrollIntoView({ behavior: "smooth", block: "center" })
          );
          await delay(500);
          await menuItem.click();
          await delay(500);

          // Check if the correct modal is opened
          isCorrectModal = await page
            .waitForSelector('[data-test-id="product-modal"]', {
              timeout: 2000,
            })
            .then(() => true)
            .catch(() => false);

          if (!isCorrectModal) {
            console.warn("❌ Incorrect modal opened. Attempting to close...");

            // Close the wrong modal by clicking the overlay
            const modalOverlay = await page.$(".cb_ModalBase_Backdrop_bdcc");
            if (modalOverlay) {
              await modalOverlay.click();
              await delay(500);
            } else {
              console.warn("⚠️ Modal overlay not found. Skipping retry...");
              break; // Exit retry if overlay cannot be found
            }
          }
        } catch (error) {
          console.error(
            `❌ Error clicking the item or handling modal (Retry ${
              retries + 1
            }):`,
            error
          );
        }

        retries++;
      }

      if (!isCorrectModal) {
        console.error(
          "❌ Failed to open correct modal after retries. Skipping item..."
        );
        continue; // Move to the next item
      }

      const modalContent = await page.content();
      const $$ = cheerio.load(modalContent);

      const itemName = $$("h2.h1m8nnah").text().trim();
      const itemImage =
        $$("div.s1s3b2lb img.s1siin91").attr("src") || "No Image";
      const itemPrice = $$('span[data-test-id="product-modal.price"]')
        .text()
        .trim();
      const itemDescription = $$("#product-description").text().trim();

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

        const type =
          $$(field).find("input").attr("type") === "radio"
            ? "radio"
            : "checkbox";

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
          type,
          options,
        });
      });

      items.push({
        name: itemName,
        image: itemImage,
        price: itemPrice,
        description: itemDescription,
        isPopular: !!(await menuItem
          .$eval(".popular-class", () => true)
          .catch(() => false)),
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
