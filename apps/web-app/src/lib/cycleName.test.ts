import { describe, expect, test } from "vitest";
import { getNextName } from "./cycleName";

describe("getNextName", () => {
  const LIST = ["build", "plan", "explore"];

  describe("empty list", () => {
    test("returns null regardless of direction or current", () => {
      expect(getNextName([], null, "next")).toBeNull();
      expect(getNextName([], "build", "prev")).toBeNull();
    });
  });

  describe("next direction", () => {
    test("from null selects the first item", () => {
      expect(getNextName(LIST, null, "next")).toBe("build");
    });

    test("advances by one", () => {
      expect(getNextName(LIST, "build", "next")).toBe("plan");
    });

    test("wraps from last back to first", () => {
      expect(getNextName(LIST, "explore", "next")).toBe("build");
    });

    test("treats unknown current as null (returns first)", () => {
      expect(getNextName(LIST, "ghost", "next")).toBe("build");
    });
  });

  describe("prev direction", () => {
    test("from null selects the last item", () => {
      expect(getNextName(LIST, null, "prev")).toBe("explore");
    });

    test("goes back by one", () => {
      expect(getNextName(LIST, "plan", "prev")).toBe("build");
    });

    test("wraps from first to last", () => {
      expect(getNextName(LIST, "build", "prev")).toBe("explore");
    });

    test("treats unknown current as null (returns last)", () => {
      expect(getNextName(LIST, "ghost", "prev")).toBe("explore");
    });
  });

  describe("single-item list", () => {
    test("always returns that item", () => {
      expect(getNextName(["solo"], null, "next")).toBe("solo");
      expect(getNextName(["solo"], "solo", "next")).toBe("solo");
      expect(getNextName(["solo"], "solo", "prev")).toBe("solo");
    });
  });
});
