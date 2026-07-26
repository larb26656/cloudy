import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, act } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { RetryMessage } from "./RetryMessage";

describe("RetryMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("renders message, attempt, and formatted time", () => {
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    const next = Date.now() + 125000;

    renderWithProviders(
      <RetryMessage message="Connection failed" attempt={1} next={next} />,
    );

    expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
    expect(screen.getByText(/attempt 1/)).toBeInTheDocument();
    expect(screen.getByText(/retry in/)).toBeInTheDocument();
  });

  test("displays 00:00 when time has expired", () => {
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    renderWithProviders(
      <RetryMessage message="Error" attempt={2} next={Date.now() - 1000} />,
    );

    expect(screen.getByText(/retry in 00:00/)).toBeInTheDocument();
  });

  test("formats time correctly as MM:SS", () => {
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    renderWithProviders(
      <RetryMessage message="Error" attempt={1} next={Date.now() + 125000} />,
    );

    expect(screen.getByText(/retry in 02:05/)).toBeInTheDocument();
  });

  test("updates countdown every second", () => {
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    const next = Date.now() + 3000;

    renderWithProviders(
      <RetryMessage message="Error" attempt={1} next={next} />,
    );

    expect(screen.getByText(/retry in 00:03/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/retry in 00:02/)).toBeInTheDocument();
  });

  test("stops countdown at zero", () => {
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    const next = Date.now() + 2000;

    renderWithProviders(
      <RetryMessage message="Error" attempt={1} next={next} />,
    );

    expect(screen.getByText(/retry in 00:02/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/retry in 00:00/)).toBeInTheDocument();
  });
});
