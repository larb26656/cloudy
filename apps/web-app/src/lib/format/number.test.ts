import { describe, test, expect } from "vitest";
import { formatNumber, formatPercentage, formatCompact } from "./number";

describe("formatNumber", () => {
  test.each([
    { num: 0, expected: "0" },
    { num: 999, expected: "999" },
    { num: 1000, expected: "1,000" },
    { num: 1234, expected: "1,234" },
    { num: 1_000_000, expected: "1,000,000" },
    { num: -1234, expected: "-1,234" },
    { num: 1234.56, expected: "1,234.56" },
  ])("formats $num as $expected", ({ num, expected }) => {
    expect(formatNumber(num)).toBe(expected);
  });

  test.each([
    { num: 1234, locale: "en-US", expected: "1,234" },
    { num: 1234567, locale: "de-DE", expected: "1.234.567" },
    { num: 1234.5, locale: "fr-FR", expected: "1 234,5" },
  ])("formats $num with locale $locale", ({ num, locale, expected }) => {
    expect(formatNumber(num, locale)).toBe(expected);
  });
});

describe("formatPercentage", () => {
  test.each([
    { value: 50, total: 100, expected: "50%" },
    { value: 0, total: 100, expected: "0%" },
    { value: 100, total: 100, expected: "100%" },
    { value: 33, total: 100, expected: "33%" },
    { value: 33.3, total: 100, expected: "33%" },
    { value: 33.7, total: 100, expected: "34%" },
    { value: 1, total: 3, expected: "33%" },
    { value: 2, total: 3, expected: "67%" },
  ])("returns $expected for $value/$total", ({ value, total, expected }) => {
    expect(formatPercentage(value, total)).toBe(expected);
  });

  test.each([
    { value: 50, total: 0 },
    { value: 50, total: -1 },
    { value: 0, total: 0 },
  ])("returns 0% when total is non-positive ($total)", ({ value, total }) => {
    expect(formatPercentage(value, total)).toBe("0%");
  });
});

describe("formatCompact", () => {
  test.each([
    { num: 0, expected: "0" },
    { num: 1, expected: "1" },
    { num: 500, expected: "500" },
    { num: 999, expected: "999" },
  ])("returns plain string for $num < 1000", ({ num, expected }) => {
    expect(formatCompact(num)).toBe(expected);
  });

  test.each([
    { num: 1000, expected: "1.0K" },
    { num: 1500, expected: "1.5K" },
    { num: 12_500, expected: "12.5K" },
    { num: 999_999, expected: "1000.0K" },
  ])("formats $num with K suffix", ({ num, expected }) => {
    expect(formatCompact(num)).toBe(expected);
  });

  test.each([
    { num: 1_000_000, expected: "1.0M" },
    { num: 2_500_000, expected: "2.5M" },
    { num: 1_500_000_000, expected: "1500.0M" },
  ])("formats $num with M suffix", ({ num, expected }) => {
    expect(formatCompact(num)).toBe(expected);
  });
});
