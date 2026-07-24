import { SEO_CADENCE, SEO_RULES } from "@/lib/seoRules";

const generatedCounter = {
  dayKey: "",
  monthKey: "",
  dailyCount: 0,
  monthlyCount: 0,
};

function currentDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function currentMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function syncCounterWindow(date: Date) {
  const dayKey = currentDayKey(date);
  const monthKey = currentMonthKey(date);

  if (generatedCounter.dayKey !== dayKey) {
    generatedCounter.dayKey = dayKey;
    generatedCounter.dailyCount = Number(process.env.SEO_GENERATED_TODAY ?? 0);
  }

  if (generatedCounter.monthKey !== monthKey) {
    generatedCounter.monthKey = monthKey;
    generatedCounter.monthlyCount = Number(
      process.env.SEO_GENERATED_THIS_MONTH ?? 0,
    );
  }
}

function canRunSeoCycle(date: Date) {
  syncCounterWindow(date);

  if (generatedCounter.dailyCount >= SEO_RULES.pacing.maxPagesPerDay) {
    return false;
  }

  if (generatedCounter.monthlyCount >= SEO_RULES.pacing.maxPagesPerMonth) {
    return false;
  }

  return true;
}

function runCycle(name: string, tasks: string[]) {
  console.info(`[seo:${name}]`, {
    tasks,
    runAt: new Date().toISOString(),
  });
}

export function startSeoScheduler() {
  console.info(
    "[seo] startSeoScheduler is disabled in production; use Vercel Cron to call protected endpoints.",
  );
}
