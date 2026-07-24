export type ForecastPipelineItem = {
  value_estimate: number;
  probability: number;
};

export function calculateForecastForItem(item: ForecastPipelineItem) {
  const value = Number(item.value_estimate ?? 0);
  const probability = Math.max(0, Math.min(100, Number(item.probability ?? 0)));
  return value * (probability / 100);
}

export function calculateVendorForecastRevenue(items: ForecastPipelineItem[]) {
  return items.reduce((sum, item) => sum + calculateForecastForItem(item), 0);
}

export function summarizeForecast(items: ForecastPipelineItem[]) {
  const pipelineValue = items.reduce(
    (sum, item) => sum + Number(item.value_estimate ?? 0),
    0,
  );
  const weightedPipelineValue = calculateVendorForecastRevenue(items);
  const vendorForecastRevenue = weightedPipelineValue;
  const projectedMonthlyRevenue = vendorForecastRevenue;
  const projectedWeeklyRevenue = vendorForecastRevenue / 4.345;

  return {
    pipelineValue,
    weightedPipelineValue,
    vendorForecastRevenue,
    projectedMonthlyRevenue,
    projectedWeeklyRevenue,
  };
}
