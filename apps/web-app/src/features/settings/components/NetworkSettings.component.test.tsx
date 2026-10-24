import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { NetworkSettings } from "./NetworkSettings";

vi.mock("@/config/env", () => ({ isModeElectron: true }));

describe("NetworkSettings", () => {
  it("asks for confirmation before revoking a paired device", async () => {
    const revokeDevice = vi.fn().mockResolvedValue(true);
    Object.defineProperty(window, "__CLOUDY_DESKTOP__", {
      configurable: true,
      value: {
        networkBridge: {
          getState: () =>
            Promise.resolve({
              enabled: true,
              devices: [
                {
                  id: "device-1",
                  name: "Phone browser",
                  createdAt: new Date().toISOString(),
                },
              ],
              pairingUrls: [],
            }),
          revokeDevice,
        },
      },
    });

    render(<NetworkSettings />);
    fireEvent.click(await screen.findByRole("button", { name: "Revoke" }));

    expect(
      await screen.findByRole("heading", { name: "Revoke device access?" }),
    ).toBeInTheDocument();
    expect(revokeDevice).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Revoke access" }));
    await waitFor(() => expect(revokeDevice).toHaveBeenCalledWith("device-1"));
  });
});
