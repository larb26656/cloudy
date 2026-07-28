import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  formatDate,
  formatDateTime,
  formatRelative,
  formatRelativeFromTimestamp,
  formatTime,
  toISOString,
} from "./date";

const originalTZ = process.env.TZ;
process.env.TZ = "UTC";

afterAll(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe("toISOString", () => {
  test.each([
    { input: new Date("2024-01-15T10:30:00.000Z"), expected: "2024-01-15T10:30:00.000Z" },
    { input: new Date("1999-12-31T23:59:59.999Z"), expected: "1999-12-31T23:59:59.999Z" },
    { input: new Date("2000-01-01T00:00:00.000Z"), expected: "2000-01-01T00:00:00.000Z" },
  ])("converts Date object to $expected", ({ input, expected }) => {
    expect(toISOString(input)).toBe(expected);
  });

  test.each([
    { input: "2024-01-15T10:30:00.000Z", expected: "2024-01-15T10:30:00.000Z" },
    { input: "2024-06-01T00:00:00.000Z", expected: "2024-06-01T00:00:00.000Z" },
    { input: "1999-12-31T23:59:59.999Z", expected: "1999-12-31T23:59:59.999Z" },
  ])("converts date string $input to $expected", ({ input, expected }) => {
    expect(toISOString(input)).toBe(expected);
  });

  describe("without argument", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-20T12:00:00.000Z"));
    });
    afterEach(() => vi.useRealTimers());

    test("returns the current time as ISO string", () => {
      expect(toISOString()).toBe("2024-06-20T12:00:00.000Z");
    });
  });
});

describe("formatTime", () => {
  test.each([
    { ts: Date.UTC(2024, 0, 15, 10, 30), expected: "10:30 AM" },
    { ts: Date.UTC(2024, 0, 15, 14, 5), expected: "02:05 PM" },
    { ts: Date.UTC(2024, 0, 15, 0, 0), expected: "12:00 AM" },
    { ts: Date.UTC(2024, 0, 15, 12, 0), expected: "12:00 PM" },
    { ts: Date.UTC(2024, 0, 15, 9, 5), expected: "09:05 AM" },
    { ts: Date.UTC(2024, 0, 15, 23, 59), expected: "11:59 PM" },
  ])("formats timestamp as $expected (en-US)", ({ ts, expected }) => {
    expect(formatTime(ts)).toBe(expected);
  });

  test.each([
    { ts: Date.UTC(2024, 0, 15, 10, 30), locale: "en-GB", expected: "10:30" },
    { ts: Date.UTC(2024, 0, 15, 14, 5), locale: "en-GB", expected: "14:05" },
    { ts: Date.UTC(2024, 0, 15, 0, 0), locale: "en-GB", expected: "00:00" },
    { ts: Date.UTC(2024, 0, 15, 9, 5), locale: "de-DE", expected: "09:05" },
  ])("formats timestamp as $expected with locale $locale", ({ ts, locale, expected }) => {
    expect(formatTime(ts, locale)).toBe(expected);
  });
});

describe("formatDate", () => {
  test.each([
    { dateStr: "2024-01-15", expected: "Jan 15, 2024" },
    { dateStr: "2024-12-25", expected: "Dec 25, 2024" },
    { dateStr: "2023-03-01", expected: "Mar 1, 2023" },
    { dateStr: "2024-02-29", expected: "Feb 29, 2024" },
    { dateStr: "1999-07-04", expected: "Jul 4, 1999" },
  ])("formats $dateStr as $expected", ({ dateStr, expected }) => {
    expect(formatDate(dateStr)).toBe(expected);
  });

  test.each([
    { dateStr: "2024-01-15", locale: "de-DE", expected: "15. Jan. 2024" },
    { dateStr: "2024-01-15", locale: "fr-FR", expected: "15 janv. 2024" },
    { dateStr: "2024-01-15", locale: "ja-JP", expected: "2024年1月15日" },
  ])("formats $dateStr as $expected with locale $locale", ({ dateStr, locale, expected }) => {
    expect(formatDate(dateStr, locale)).toBe(expected);
  });
});

describe("formatDateTime", () => {
  test.each([
    { dateStr: "2024-01-15T10:30:00.000Z", expected: "Jan 15, 2024, 10:30 AM" },
    { dateStr: "2024-06-15T14:05:00.000Z", expected: "Jun 15, 2024, 2:05 PM" },
    { dateStr: "2024-01-15T00:00:00.000Z", expected: "Jan 15, 2024, 12:00 AM" },
    { dateStr: "2024-01-15T12:00:00.000Z", expected: "Jan 15, 2024, 12:00 PM" },
    { dateStr: "2024-01-15T23:59:00.000Z", expected: "Jan 15, 2024, 11:59 PM" },
  ])("formats $dateStr as $expected", ({ dateStr, expected }) => {
    expect(formatDateTime(dateStr)).toBe(expected);
  });

  test.each([
    { dateStr: "2024-01-15T14:05:00.000Z", locale: "en-GB", expected: "15 Jan 2024, 14:05" },
    { dateStr: "2024-01-15T10:30:00.000Z", locale: "de-DE", expected: "15. Jan. 2024, 10:30" },
  ])("formats $dateStr as $expected with locale $locale", ({ dateStr, locale, expected }) => {
    expect(formatDateTime(dateStr, locale)).toBe(expected);
  });
});

describe("formatRelative", () => {
  const fixedNow = new Date("2024-06-20T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });
  afterEach(() => vi.useRealTimers());

  test.each([
    { hoursAgo: 0, expected: "Today" },
    { hoursAgo: 6, expected: "Today" },
    { hoursAgo: 23, expected: "Today" },
    { hoursAgo: 24, expected: "Yesterday" },
    { hoursAgo: 48, expected: "2 days ago" },
    { hoursAgo: 72, expected: "3 days ago" },
    { hoursAgo: 120, expected: "5 days ago" },
    { hoursAgo: 144, expected: "6 days ago" },
    { hoursAgo: 168, expected: "Jun 13, 2024" },
    { hoursAgo: 240, expected: "Jun 10, 2024" },
  ])("returns $expected for $hoursAgo hours ago", ({ hoursAgo, expected }) => {
    const dateStr = new Date(fixedNow.getTime() - hoursAgo * 3_600_000).toISOString();
    expect(formatRelative(dateStr)).toBe(expected);
  });
});

describe("formatRelativeFromTimestamp", () => {
  const fixedNow = new Date("2024-06-20T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });
  afterEach(() => vi.useRealTimers());

  test.each([
    { msAgo: 0, expected: "Just now" },
    { msAgo: 30_000, expected: "Just now" },
    { msAgo: 59_999, expected: "Just now" },
    { msAgo: 60_000, expected: "1m ago" },
    { msAgo: 300_000, expected: "5m ago" },
    { msAgo: 3_540_000, expected: "59m ago" },
    { msAgo: 3_599_999, expected: "59m ago" },
    { msAgo: 3_600_000, expected: "1h ago" },
    { msAgo: 7_200_000, expected: "2h ago" },
    { msAgo: 86_399_999, expected: "23h ago" },
    { msAgo: 86_400_000, expected: "Jun 19, 2024" },
    { msAgo: 172_800_000, expected: "Jun 18, 2024" },
  ])("returns $expected for $msAgo ms ago", ({ msAgo, expected }) => {
    expect(formatRelativeFromTimestamp(fixedNow.getTime() - msAgo)).toBe(expected);
  });
});
