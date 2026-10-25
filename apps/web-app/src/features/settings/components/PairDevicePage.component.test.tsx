import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { PairDevicePage } from "./PairDevicePage";

describe("PairDevicePage", () => {
  it("submits the pairing code when the pair button is clicked", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid pairing code" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PairDevicePage />);
    fireEvent.change(screen.getByRole("textbox", { name: "Device name" }), {
      target: { value: "Work iPhone" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Pairing code" }), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Pair device" }));

    await waitFor(() => {
      const [url, options] = fetchMock.mock.calls[0] ?? [];
      expect(url).toContain("/api/lan/pair");
      expect(options).toEqual(
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ code: "123456", name: "Work iPhone" }),
        }),
      );
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid pairing code",
    );
    vi.unstubAllGlobals();
  });
});
