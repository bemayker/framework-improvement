import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the short commit next to the version", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "4.5.6",
      commit: "0123456789ab",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        /^Task Notes v4\.5\.6 \(0123456\)$/,
      ),
    );
  });

  it("shows the version alone when the backend reports the unknown commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "4.5.6",
      commit: null,
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        /^Task Notes v4\.5\.6$/,
      ),
    );
  });

  it("renders the version reported by the backend", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "4.5.6",
      commit: null,
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        /^Task Notes v4\.5\.6$/,
      ),
    );
  });

  it("shows only the app name while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("shows only the app name when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    const footer = screen.getByTestId("app-footer");
    expect(footer).toHaveTextContent(/^Task Notes$/);
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
  });

  it("shows only the app name when the backend reports the unknown sentinel", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: null,
      commit: "0123456789ab",
    });

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
