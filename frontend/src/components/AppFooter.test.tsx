import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersion: vi.fn(),
}));

const getBackendVersionMock = vi.mocked(getBackendVersion);

function footerText(): string | null {
  return screen.getByTestId("app-footer").textContent;
}

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionMock.mockReset();
  });

  it("renders the backend version once it resolves", async () => {
    getBackendVersionMock.mockResolvedValue("0.1.0");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toBeInTheDocument();
    expect(footerText()).toBe("Task Notes v0.1.0");
  });

  it("renders the fetched version, not the frontend package version", async () => {
    getBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await screen.findByTestId("app-version");
    expect(footerText()).toBe("Task Notes v9.9.9");
  });

  it("reads exactly the app name while the version is still loading", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(footerText()).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("reads exactly the app name when the version request fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("offline"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    expect(footerText()).toBe("Task Notes");
    expect(footerText()).not.toMatch(/undefined|null|unknown/);
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("reads exactly the app name when the client resolves to null", async () => {
    getBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    expect(footerText()).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
