import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { version as packageVersion } from "../../package.json";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

// Differs from package.json's version, so a pass proves the backend is the source.
const BACKEND_VERSION = "9.8.7";

function expectNoMeaninglessToken() {
  const text = screen.getByTestId("app-footer").textContent ?? "";
  expect(text).toBe("Task Notes");
  expect(text).not.toMatch(/undefined|null|unknown/);
  expect(text).not.toMatch(/\sv\s*$/);
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the app name and the backend version once it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue(BACKEND_VERSION);

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        `Task Notes v${BACKEND_VERSION}`,
      ),
    );
    expect(BACKEND_VERSION).not.toBe(packageVersion);
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      `v${packageVersion}`,
    );
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders only the app name while the version is still loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectNoMeaninglessToken();
  });

  it("renders only the app name when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("Failed to fetch"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    expectNoMeaninglessToken();
  });

  it("renders only the app name when the version is unusable (null)", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    expectNoMeaninglessToken();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
