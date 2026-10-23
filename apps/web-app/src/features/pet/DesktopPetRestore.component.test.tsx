import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopPetRestore } from "./DesktopPetRestore";

type VisibilityListener = (visible: boolean) => void;

const bridge = {
  getVisibility: vi.fn<() => Promise<boolean>>(),
  show: vi.fn(),
  onVisibility: vi.fn((callback: VisibilityListener) => {
    notify = callback;
    return () => {
      notify = undefined;
    };
  }),
};

let notify: VisibilityListener | undefined;

function mountBridge() {
  window.__CLOUDY_DESKTOP__ = {
    apiUrl: "http://localhost:4122",
    isDev: true,
    platform: "darwin",
    windowKind: "main",
    petBridge: bridge,
  };
}

describe("DesktopPetRestore", () => {
  beforeEach(() => {
    mountBridge();
  });

  afterEach(() => {
    delete window.__CLOUDY_DESKTOP__;
    notify = undefined;
    vi.clearAllMocks();
  });

  it("renders nothing while the pet overlay is visible", async () => {
    bridge.getVisibility.mockResolvedValue(true);

    const { container } = render(<DesktopPetRestore />);

    await act(async () => {});
    expect(container.querySelector("button")).toBeNull();
  });

  it("shows the restore button once the overlay is hidden and relays show", async () => {
    bridge.getVisibility.mockResolvedValue(false);

    render(<DesktopPetRestore />);
    fireEvent.click(await screen.findByRole("button", { name: "Show pet" }));

    expect(bridge.show).toHaveBeenCalledTimes(1);
  });

  it("appears and disappears with visibility events", async () => {
    bridge.getVisibility.mockResolvedValue(true);

    render(<DesktopPetRestore />);
    await act(async () => {});
    expect(screen.queryByRole("button", { name: "Show pet" })).toBeNull();

    act(() => notify?.(false));
    expect(
      screen.getByRole("button", { name: "Show pet" }),
    ).toBeInTheDocument();

    act(() => notify?.(true));
    expect(screen.queryByRole("button", { name: "Show pet" })).toBeNull();
  });

  it("renders nothing in a plain browser (no desktop bridge)", async () => {
    delete window.__CLOUDY_DESKTOP__;

    const { container } = render(<DesktopPetRestore />);

    await act(async () => {});
    expect(container.querySelector("button")).toBeNull();
  });
});
