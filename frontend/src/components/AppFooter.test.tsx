import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";
import { version as bundleVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
    fetchBackendVersionMock.mockResolvedValue("9.8.7");
  });

  it("renders the version the backend reports", async () => {
    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v9.8.7"),
    );
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the app name without a version when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("unreachable"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    // The rejection travels through .then and .catch; flush it so the assertions
    // below run after the catch handler, not before it.
    await act(async () => {});
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  });

  it("renders the app name without a version while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise<string>(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("shows the backend version even when it differs from the frontend package version", async () => {
    expect(bundleVersion).not.toBe("9.8.7");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent("v9.8.7"),
    );
    expect(screen.getByTestId("app-footer").textContent).not.toContain(
      `v${bundleVersion}`,
    );
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    // Let the mount-time version load settle so no state update lands after the test.
    await waitFor(() => expect(footer).toHaveTextContent("v9.8.7"));
  });
});
