import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { version as packageVersion } from "../../package.json";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the version and the first 7 characters of the commit once /api/version resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.8.7",
      commit: "3f9a2c1",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v9.8.7 (3f9a2c1)",
      ),
    );
  });

  it("renders the version alone when the backend reports no commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.8.7",
      commit: null,
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v9.8.7",
      ),
    );
  });

  it("renders the version from the backend, not the frontend bundle's own", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.8.7",
      commit: null,
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent("9.8.7"),
    );
    expect(packageVersion).not.toBe("9.8.7");
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      `v${packageVersion}`,
    );
  });

  it("renders the app name without a version while /api/version is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => undefined));

    render(<AppFooter />);

    const text = screen.getByTestId("app-footer").textContent;
    expect(text).toBe("Task Notes");
    expect(text).not.toContain("undefined");
  });

  it("renders the app name without a version when /api/version is unreachable", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    // Drain the microtask queue so the rejection's .catch has run before asserting.
    await act(async () => {});
    expect(fetchBackendVersionMock).toHaveBeenCalled();
    const text = screen.getByTestId("app-footer").textContent;
    expect(text).toBe("Task Notes");
    expect(text).not.toContain("undefined");
  });

  it("renders the app name without a version when the backend reports no version", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => undefined));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
