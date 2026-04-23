export type MetricRecord = {
  type?: string | null;
  value?: string | number | null;
  unit?: string | null;
  glucose?: string | number | null;
  bloodPressureSystolic?: string | number | null;
  bloodPressureDiastolic?: string | number | null;
  heartRate?: string | number | null;
  sleepHours?: string | number | null;
  weight?: string | number | null;
};

export type MetricSeries = {
  glucose: number[];
  systolic: number[];
  diastolic: number[];
  heartRate: number[];
  sleepHours: number[];
  weight: number[];
};

const EMPTY_SERIES: MetricSeries = {
  glucose: [],
  systolic: [],
  diastolic: [],
  heartRate: [],
  sleepHours: [],
  weight: [],
};

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pushIfNumber(bucket: number[], value: unknown) {
  const parsed = toNumber(value);
  if (parsed != null) bucket.push(parsed);
}

function parseBloodPressure(value: unknown): { systolic: number | null; diastolic: number | null } {
  if (typeof value === "number") {
    return { systolic: Number.isFinite(value) ? value : null, diastolic: null };
  }

  if (typeof value !== "string") {
    return { systolic: null, diastolic: null };
  }

  const match = value.match(/(\d{2,3})(?:\s*\/\s*(\d{2,3}))?/);
  if (!match) {
    return { systolic: null, diastolic: null };
  }

  return {
    systolic: match[1] ? Number(match[1]) : null,
    diastolic: match[2] ? Number(match[2]) : null,
  };
}

export function normalizeMetricSeries(metrics: MetricRecord[]): MetricSeries {
  const series: MetricSeries = {
    glucose: [],
    systolic: [],
    diastolic: [],
    heartRate: [],
    sleepHours: [],
    weight: [],
  };

  for (const metric of metrics || []) {
    if (!metric) continue;

    pushIfNumber(series.glucose, metric.glucose);
    pushIfNumber(series.systolic, metric.bloodPressureSystolic);
    pushIfNumber(series.diastolic, metric.bloodPressureDiastolic);
    pushIfNumber(series.heartRate, metric.heartRate);
    pushIfNumber(series.sleepHours, metric.sleepHours);
    pushIfNumber(series.weight, metric.weight);

    const metricType = String(metric.type || "").toLowerCase();
    const metricValue = metric.value;

    if (!metricType || metricValue == null || metricValue === "") {
      continue;
    }

    if (metricType.includes("glucose")) {
      pushIfNumber(series.glucose, metricValue);
      continue;
    }

    if (metricType.includes("pressure") || metricType.includes("blood pressure") || metricType === "bp") {
      const parsed = parseBloodPressure(metricValue);
      if (parsed.systolic != null) series.systolic.push(parsed.systolic);
      if (parsed.diastolic != null) series.diastolic.push(parsed.diastolic);
      continue;
    }

    if (metricType.includes("heart") || metricType.includes("pulse")) {
      pushIfNumber(series.heartRate, metricValue);
      continue;
    }

    if (metricType.includes("sleep")) {
      pushIfNumber(series.sleepHours, metricValue);
      continue;
    }

    if (metricType.includes("weight")) {
      pushIfNumber(series.weight, metricValue);
    }
  }

  return series;
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function trendDirection(values: number[], threshold = 0.04): "up" | "down" | "stable" {
  if (values.length < 4) return "stable";

  const half = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, half);
  const secondHalf = values.slice(half);

  if (!firstHalf.length || !secondHalf.length) return "stable";

  const firstAvg = average(firstHalf);
  const secondAvg = average(secondHalf);
  if (firstAvg == null || secondAvg == null || firstAvg === 0) return "stable";

  const relativeDelta = (secondAvg - firstAvg) / Math.abs(firstAvg);

  if (relativeDelta > threshold) return "up";
  if (relativeDelta < -threshold) return "down";
  return "stable";
}

export function waterAmountToMl(amount: unknown, unit?: string | null): number {
  const value = toNumber(amount);
  if (value == null) return 0;

  const normalizedUnit = String(unit || "ml").toLowerCase();
  if (normalizedUnit === "l" || normalizedUnit.includes("liter")) {
    return value * 1000;
  }

  if (normalizedUnit === "oz" || normalizedUnit.includes("ounce")) {
    return Math.round(value * 29.5735);
  }

  return value;
}

export function safeMetricSeries(metrics: MetricRecord[] | undefined | null): MetricSeries {
  if (!metrics || metrics.length === 0) return { ...EMPTY_SERIES };
  return normalizeMetricSeries(metrics);
}
