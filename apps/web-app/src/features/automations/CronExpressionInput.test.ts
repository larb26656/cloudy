import { describeCron, isValidCron } from "./CronExpressionInput";

describe("isValidCron", () => {
  it.each([
    "* * * * *",
    "*/5 * * * *",
    "0 9 * * 1-5",
    "0 9 1,15 * *",
    "0 0 1-31/2 1-12 *",
  ])("accepts valid expression %s", (expression) => {
    expect(isValidCron(expression)).toBe(true);
  });

  it.each([
    "",
    "* * * *",
    "60 * * * *",
    "* 24 * * *",
    "* * 0 * *",
    "* * * 13 *",
    "* * * * 8",
    "*/0 * * * *",
    "1-5-8 * * * *",
    "1,,2 * * * *",
  ])("rejects invalid expression %s", (expression) => {
    expect(isValidCron(expression)).toBe(false);
  });
});

describe("describeCron", () => {
  it.each([
    ["* * * * *", "Every minute"],
    ["*/5 * * * *", "Every 5 minutes"],
    ["15 * * * *", "Every hour, at minute 15"],
    ["0 9 * * *", "Every day at 9:00"],
    ["0 9 * * 1-5", "Every weekday at 9:00"],
    ["30 8 * * 1", "Every Monday at 8:30"],
    ["0 0 1 * *", "Runs on a custom schedule"],
  ])("describes %s", (expression, description) => {
    expect(describeCron(expression)).toBe(description);
  });
});
