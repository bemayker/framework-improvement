import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchAppVersion } from "../api/version";
import { version as packageVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  fetchAppVersion: vi.fn(),
}));

const fetchAppVersionMock = vi.mocked(fetchAppVersion);

// Deliberately different from package.json: proves the footer shows what the
// client resolved, not the frontend bundle's own version.
const BACKEND_VERSION = "9.9.9-test";

describe("AppFooter", () => {
  beforeEach(() => {
    fetchAppVersionMock.mockReset();
  });

  it("renders the version and the first 7 characters of the commit in parentheses", async () => {
    fetchAppVersionMock.mockResolvedValue({
      version: BACKEND_VERSION,
      commit: "9a6bfd7c3e1f",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        `Task Notes v${BACKEND_VERSION} (9a6bfd7)`,
      ),
    );
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(packageVersion);
    expect(fetchAppVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the version alone when the commit is unavailable", async () => {
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
  });

  it("renders the app name alone when the version cannot be resolved", async () => {
    fetchAppVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    await waitFor(() => expect(fetchAppVersionMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  });

  it("renders the app name alone while the version is still loading", () => {
    fetchAppVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchAppVersionMock.mockResolvedValue({
      version: BACKEND_VERSION,
      commit: null,
    });

    render(<AppFooter />);
    await screen.findByText(`Task Notes v${BACKEND_VERSION}`);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
