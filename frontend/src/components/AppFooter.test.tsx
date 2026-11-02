import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchAppVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchAppVersion: vi.fn(),
}));

const fetchAppVersionMock = vi.mocked(fetchAppVersion);

// Differs from package.json's version, so a footer still reading the build-time
// value would fail the present-path test.
const BACKEND_VERSION = "9.9.9";

function expectFooterWithoutVersion() {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe("Task Notes");
  expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchAppVersionMock.mockReset();
  });

  it("renders the app name and the backend version when it resolves", async () => {
    fetchAppVersionMock.mockResolvedValue(BACKEND_VERSION);

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        `Task Notes v${BACKEND_VERSION}`,
      ),
    );
    expect(fetchAppVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders only the app name while the version is loading", () => {
    fetchAppVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectFooterWithoutVersion();
  });

  it("renders only the app name when loading the version fails", async () => {
    fetchAppVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expectFooterWithoutVersion();
  });

  it("renders only the app name when the version is unresolved", async () => {
    fetchAppVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expectFooterWithoutVersion();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchAppVersionMock.mockResolvedValue(BACKEND_VERSION);

    render(<AppFooter />);
    await screen.findByText(`Task Notes v${BACKEND_VERSION}`);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
