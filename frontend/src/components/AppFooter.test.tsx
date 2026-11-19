import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";
import { version as frontendPackageVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: null,
    });
  });

  it("shows the first 7 characters of the backend commit next to the version", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "abcdef123456",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v9.9.9 (abcdef1)",
      ),
    );
  });

  it("shows the version alone when the backend reports the commit as unknown", async () => {
    // The client turns the backend's "unknown" commit into null.
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: null,
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v9.9.9",
      ),
    );
    expect(screen.getByTestId("app-footer").textContent).not.toMatch(
      /undefined|null|unknown|\(/,
    );
  });

  it("renders the version returned by the backend, not the frontend package version", async () => {
    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v9.9.9",
      ),
    );
    expect(frontendPackageVersion).not.toBe("9.9.9");
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      `v${frontendPackageVersion}`,
    );
  });

  it("shows only the app name while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders without a version when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    await Promise.resolve();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders without a version when the backend reports it as unknown", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    await Promise.resolve();
    const text = screen.getByTestId("app-footer").textContent;
    expect(text).toBe("Task Notes");
    expect(text).not.toMatch(/undefined|null|unknown|\bv\b/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await screen.findByText("Task Notes v9.9.9");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
