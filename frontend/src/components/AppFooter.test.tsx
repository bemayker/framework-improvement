import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";
import { version as frontendVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchVersionMock.mockReset();
    fetchVersionMock.mockResolvedValue({
      version: "9.8.7",
      commit: "62be9fd76e4b",
    });
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
  });

  it("shows the version and the first 7 characters of the commit once /api/version resolves", async () => {
    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        /^Task Notes v9\.8\.7 \(62be9fd\)$/,
      ),
    );
  });

  it("shows the version alone when the backend reports no usable commit", async () => {
    fetchVersionMock.mockResolvedValue({ version: "9.8.7", commit: null });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        /^Task Notes v9\.8\.7$/,
      ),
    );
  });

  it("shows only the app name while the version request is pending", () => {
    fetchVersionMock.mockReturnValue(new Promise(() => undefined));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("shows only the app name when the version request fails", async () => {
    fetchVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("shows only the app name when the backend reports the unknown sentinel", async () => {
    // The client maps the sentinel to null; the footer must render it bare.
    fetchVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("does not show the frontend package.json version", async () => {
    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent("v9.8.7"),
    );
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      `v${frontendVersion}`,
    );
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
  });
});
