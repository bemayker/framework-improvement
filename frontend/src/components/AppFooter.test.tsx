import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchVersion } from "../api/version";
import type { VersionInfo } from "../api/version";
import { version as packageVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  fetchVersion: vi.fn(),
}));

const fetchVersionMock = vi.mocked(fetchVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchVersionMock.mockReset();
  });

  it("renders the version returned by /api/version, not the frontend package version", async () => {
    fetchVersionMock.mockResolvedValue({ version: "9.8.7", commit: null });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v9.8.7",
      ),
    );
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      `v${packageVersion}`,
    );
  });

  it("renders the first 7 characters of the commit next to the version", async () => {
    fetchVersionMock.mockResolvedValue({
      version: "1.2.3",
      commit: "0123456789ab",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v1.2.3 (0123456)",
      ),
    );
    expect(screen.getByTestId("app-footer-commit").textContent).toBe("0123456");
  });

  it("renders the version alone when the backend reports the unknown commit sentinel", async () => {
    fetchVersionMock.mockResolvedValue({ version: "1.2.3", commit: null });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v1.2.3",
      ),
    );
    expect(screen.queryByTestId("app-footer-commit")).toBeNull();
  });

  it("never renders undefined or an error when /api/version fails", async () => {
    fetchVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await act(async () => {});

    expect(fetchVersionMock).toHaveBeenCalledTimes(1);
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/undefined|error|network down/i);
    expect(screen.queryByTestId("app-footer-commit")).toBeNull();
  });

  it("renders the app name only when the backend reports the unknown version sentinel", async () => {
    fetchVersionMock.mockResolvedValue({ version: "unknown", commit: "0123456789ab" });

    render(<AppFooter />);

    await act(async () => {});

    expect(fetchVersionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("never renders undefined or an error while the version is loading", () => {
    fetchVersionMock.mockReturnValue(new Promise<VersionInfo>(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/undefined|error/i);
    expect(screen.queryByTestId("app-footer-commit")).toBeNull();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchVersionMock.mockReturnValue(new Promise<VersionInfo>(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
