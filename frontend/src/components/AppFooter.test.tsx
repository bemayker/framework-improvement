import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendBuildInfo } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendBuildInfo: vi.fn(),
}));

const getBackendBuildInfoMock = vi.mocked(getBackendBuildInfo);

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendBuildInfoMock.mockReset();
    getBackendBuildInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: "3f2a9c1",
    });
  });

  it("renders the app name, the version and the short commit once it resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByText("Task Notes v0.1.0 (3f2a9c1)")).toBeInTheDocument();
    expect(getBackendBuildInfoMock).toHaveBeenCalledTimes(1);
  });

  it("renders the version alone when the backend reports no usable commit", async () => {
    getBackendBuildInfoMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    expect(await screen.findByText("Task Notes v0.1.0")).toBeInTheDocument();
    expect(screen.getByTestId("app-footer").textContent).not.toMatch(/\(|\)/);
  });

  it("renders exactly the app name while the request is pending", () => {
    getBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders exactly the app name when the backend reports no version", async () => {
    getBackendBuildInfoMock.mockResolvedValue(null);

    render(<AppFooter />);

    await vi.waitFor(() => expect(getBackendBuildInfoMock).toHaveBeenCalled());
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders exactly the app name when the request fails", async () => {
    getBackendBuildInfoMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await vi.waitFor(() => expect(getBackendBuildInfoMock).toHaveBeenCalled());
    await Promise.resolve();
    const text = screen.getByTestId("app-footer").textContent;
    expect(text).toBe("Task Notes");
    expect(text).not.toMatch(/undefined|null|unknown|\(\)/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
