/**
 * i18n / Translation Tests
 * Ensures both en and ar translations have the same keys and valid values
 */

import { describe, it, expect } from "vitest";
import { translations } from "../client/src/lib/i18n";

describe("i18n Translation Completeness", () => {
  const enKeys = Object.keys(translations.en) as (keyof typeof translations.en)[];
  const arKeys = Object.keys(translations.ar) as (keyof typeof translations.ar)[];

  it("Arabic has the same number of keys as English", () => {
    expect(arKeys.length).toBe(enKeys.length);
  });

  it("Every English key exists in Arabic", () => {
    const missingInAr = enKeys.filter((k) => !(k in translations.ar));
    expect(missingInAr).toEqual([]);
  });

  it("Every Arabic key exists in English", () => {
    const missingInEn = arKeys.filter((k) => !(k in translations.en));
    expect(missingInEn).toEqual([]);
  });

  it("No English value is an empty string", () => {
    const emptyEn = enKeys.filter((k) => translations.en[k] === "");
    expect(emptyEn).toEqual([]);
  });

  it("No Arabic value is an empty string", () => {
    const emptyAr = arKeys.filter((k) => (translations.ar as Record<string, string>)[k] === "");
    expect(emptyAr).toEqual([]);
  });

  it("All values are strings", () => {
    const nonStringEn = enKeys.filter((k) => typeof translations.en[k] !== "string");
    const nonStringAr = arKeys.filter((k) => typeof (translations.ar as Record<string, unknown>)[k] !== "string");
    expect(nonStringEn).toEqual([]);
    expect(nonStringAr).toEqual([]);
  });
});

describe("i18n Key Spot Checks", () => {
  it("loading key exists in both languages", () => {
    expect(translations.en.loading).toBeTruthy();
    expect(translations.ar.loading).toBeTruthy();
  });

  it("BMI calculator keys exist in both languages", () => {
    const bmiKeys = ["bmiCalculator", "calculateBMI", "yourBMI", "bmiCategory", "activityLevel", "sedentary", "lightlyActive"] as const;
    for (const key of bmiKeys) {
      expect(translations.en[key], `en.${key} missing`).toBeTruthy();
      expect(translations.ar[key], `ar.${key} missing`).toBeTruthy();
    }
  });

  it("auth toast keys exist in both languages", () => {
    const authKeys = ["loginSuccess", "logoutSuccess", "logoutFailed", "registerSuccess"] as const;
    for (const key of authKeys) {
      expect(translations.en[key], `en.${key} missing`).toBeTruthy();
      expect(translations.ar[key], `ar.${key} missing`).toBeTruthy();
    }
  });

  it("days of week keys exist in both languages", () => {
    const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    for (const key of dayKeys) {
      expect(translations.en[key], `en.${key} missing`).toBeTruthy();
      expect(translations.ar[key], `ar.${key} missing`).toBeTruthy();
    }
  });

  it("error boundary keys exist in both languages", () => {
    const errKeys = ["somethingWentWrong", "errorBoundaryDesc", "tryAgain", "refreshPage"] as const;
    for (const key of errKeys) {
      expect(translations.en[key], `en.${key} missing`).toBeTruthy();
      expect(translations.ar[key], `ar.${key} missing`).toBeTruthy();
    }
  });
});
