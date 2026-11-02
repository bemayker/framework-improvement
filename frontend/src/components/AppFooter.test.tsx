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
const BACKEND_COMMIT = "a1b2c3d";

function expectFooterText(expected: string) {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe(expected);
  expect(footer).not.toHaveTextContent(/undefined|null|unknown|error|\(\)/i);
}

/** Waits for the mount-time request to have been made and its result applied. */
async function settleRequest() {
  await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalledTimes(1));
  await Promise.resolve();
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchAppVersionMock.mockReset();
  });

  it("renders the app name, the backend version and the commit when both resolve", async () => {
    fetchAppVersionMock.mockResolvedValue({
      version: BACKEND_VERSION,
      commit: BACKEND_COMMIT,
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        `Task Notes v${BACKEND_VERSION} (${BACKEND_COMMIT})`,
      ),
    );
    expectFooterText(`Task Notes v${BACKEND_VERSION} (${BACKEND_COMMIT})`);
    expect(fetchAppVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the version alone when the commit is unusable", async () => {
    fetchAppVersionMock.mockResolvedValue({
      version: BACKEND_VERSION,
      commit: null,
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        `Task Notes v${BACKEND_VERSION}`,
      ),
    );
    expectFooterText(`Task Notes v${BACKEND_VERSION}`);
  });

  it("renders only the app name while the version is pending", () => {
    fetchAppVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectFooterText("Task Notes");
  });

  it("renders only the app name when loading the version fails", async () => {
    fetchAppVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await settleRequest();
    expectFooterText("Task Notes");
  });

  it("renders only the app name when the version is unresolved", async () => {
    fetchAppVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await settleRequest();
    expectFooterText("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchAppVersionMock.mockResolvedValue({
      version: BACKEND_VERSION,
      commit: BACKEND_COMMIT,
    });

    render(<AppFooter />);
    await screen.findByText(
      `Task Notes v${BACKEND_VERSION} (${BACKEND_COMMIT})`,
    );

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
