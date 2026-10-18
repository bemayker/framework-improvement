import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchAppVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchAppVersion: vi.fn(),
}));

const fetchAppVersionMock = vi.mocked(fetchAppVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchAppVersionMock.mockReset();
  });

  it("renders the app name and the version the backend reported", async () => {
    fetchAppVersionMock.mockResolvedValue("0.1.0");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v0.1.0",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v0.1.0");
  });

  it("renders the app name alone when the version cannot be resolved", async () => {
    fetchAppVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  });

  it("renders the app name alone when the version request fails", async () => {
    fetchAppVersionMock.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<AppFooter />);
    await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the app name alone before the version request resolves", () => {
    fetchAppVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchAppVersionMock.mockResolvedValue("0.1.0");

    render(<AppFooter />);
    await screen.findByTestId("app-footer-version");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
