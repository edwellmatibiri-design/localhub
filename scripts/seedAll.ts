import "dotenv/config";
import { pathToFileURL } from "node:url";
import { seedCategories } from "./seedCategories";
import { seedVendors } from "./seedVendors";
import { seedSellers } from "./seedSellers";
import { seedListings } from "./seedListings";
import { seedMarketplaceFlows } from "./seedMarketplaceFlows";
import { seedCrawlerDemo } from "./seedCrawlerDemo";

export async function seedAll() {
  console.log("[seed:all] Stage 1/6 - Seeding categories...");
  await seedCategories();
  console.log("[seed:all] Stage 1/6 complete.");

  console.log("[seed:all] Stage 2/6 - Seeding vendors...");
  await seedVendors();
  console.log("[seed:all] Stage 2/6 complete.");

  console.log("[seed:all] Stage 3/6 - Seeding sellers...");
  await seedSellers();
  console.log("[seed:all] Stage 3/6 complete.");

  console.log("[seed:all] Stage 4/6 - Seeding listings...");
  await seedListings();
  console.log("[seed:all] Stage 4/6 complete.");

  console.log("[seed:all] Stage 5/6 - Seeding marketplace flows...");
  await seedMarketplaceFlows();
  console.log("[seed:all] Stage 5/6 complete.");

  console.log("[seed:all] Stage 6/6 - Seeding crawler demo events...");
  await seedCrawlerDemo();
  console.log("[seed:all] Stage 6/6 complete.");

  console.log("[seed:all] All seed stages completed successfully.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedAll()
    .then(() => {
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[seed:all] Failed: ${message}`);
      process.exit(1);
    });
}