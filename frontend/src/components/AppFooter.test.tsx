import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersion: vi.fn(),
}));

const getBackendVersionMock = vi.mocked(getBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionMock.mockReset();
    getBackendVersionMock.mockResolvedValue("0.1.0");
  });

  it("renders the app name and the backend version once it resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByText("Task Notes v0.1.0")).toBeInTheDocument();
    expect(getBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders exactly the app name while the version is loading", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders exactly the app name when the backend reports no version", async () => {
    getBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await vi.waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders exactly the app name when the version request fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await vi.waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());
    await Promise.resolve();
    const text = screen.getByTestId("app-footer").textContent;
    expect(text).toBe("Task Notes");
    expect(text).not.toMatch(/undefined|null|unknown/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
