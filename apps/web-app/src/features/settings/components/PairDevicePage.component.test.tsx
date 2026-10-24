import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { PairDevicePage } from "../../../routes/pair";

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
    fireEvent.change(screen.getByRole("textbox", { name: "Pairing code" }), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Pair device" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lan/pair",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid pairing code",
    );
    vi.unstubAllGlobals();
  });
});
