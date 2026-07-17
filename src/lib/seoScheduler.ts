import cron from "node-cron";
import { SEO_CADENCE } from "@/lib/seoRules";

let started = false;

function runCycle(name: string, tasks: string[]) {
  console.info(`[seo:${name}]`, {
    tasks,
    runAt: new Date().toISOString(),
  });
}

export function startSeoScheduler() {
  if (started) {
    return;
  }

  started = true;

  cron.schedule("0 2 * * *", () => runCycle("daily", SEO_CADENCE.daily));
  cron.schedule("0 3 * * 1", () => runCycle("weekly", SEO_CADENCE.weekly));
  cron.schedule("0 4 1 * *", () => runCycle("monthly", SEO_CADENCE.monthly));
}
