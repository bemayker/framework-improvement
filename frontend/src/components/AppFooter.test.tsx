import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchVersion: vi.fn(),
}));

const fetchVersionMock = vi.mocked(fetchVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchVersionMock.mockReset();
  });

  it("renders the application name and the version the backend reports", async () => {
    fetchVersionMock.mockResolvedValue({ version: "1.2.3" });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v1.2.3",
      ),
    );
  });

  it("renders the application name alone when the version request fails", async () => {
    fetchVersionMock.mockRejectedValue(new Error("Loading the version failed"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
    const text = screen.getByTestId("app-footer").textContent;
    expect(text).toBe("Task Notes");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
    expect(text).not.toContain(" v");
  });

  it("renders the application name alone while the version is loading", () => {
    fetchVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the application name alone when the backend reports unknown", async () => {
    fetchVersionMock.mockResolvedValue({ version: "unknown" });

    render(<AppFooter />);

    // Flush the effect and the resolved promise's state update inside act, so
    // the assertion runs after the sentinel guard has had its chance to fail.
    await act(async () => {});
    expect(fetchVersionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
