import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersionInfo } from "../api/version";
import type { BackendVersionInfo } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersionInfo: vi.fn(),
}));

const getBackendVersionInfoMock = vi.mocked(getBackendVersionInfo);

/** Footer text must never carry a stand-in for a missing version. */
function expectNameOnly() {
  const footer = screen.getByTestId("app-footer");
  expect(footer).toHaveTextContent(/^Task Notes$/);
  expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
}

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionInfoMock.mockReset();
    getBackendVersionInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: "abcdef123456",
    });
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await waitFor(() =>
      expect(getBackendVersionInfoMock).toHaveBeenCalledTimes(1),
    );
  });

  it("renders the backend version once /api/version resolves", async () => {
    getBackendVersionInfoMock.mockResolvedValue({
      version: "1.2.3",
      commit: null,
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v1.2.3",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      /^Task Notes v1\.2\.3$/,
    );
  });

  it("renders the first 7 characters of the build commit next to the version", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(
      "(abcdef1)",
    );
    expect(screen.getByTestId("app-footer-version")).toHaveTextContent(
      /^\s*v0\.1\.0$/,
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v0.1.0 (abcdef1)",
    );
  });

  it("renders no commit while the version request is pending", () => {
    getBackendVersionInfoMock.mockReturnValue(
      new Promise<BackendVersionInfo>(() => {}),
    );

    render(<AppFooter />);

    expectNameOnly();
  });

  it("renders no commit when the version request fails", async () => {
    getBackendVersionInfoMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() =>
      expect(getBackendVersionInfoMock).toHaveBeenCalledTimes(1),
    );
    // Let the rejected promise settle before asserting the failure state.
    await Promise.resolve();
    expectNameOnly();
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      /undefined|null|unknown/,
    );
  });

  it("renders the version alone when the backend reports the unknown commit", async () => {
    getBackendVersionInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: "unknown",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      /^Task Notes v0\.1\.0$/,
    );
  });

  it("renders the version alone when the response carries no commit", async () => {
    getBackendVersionInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: null,
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      /undefined|null|unknown|\(/,
    );
  });

  it("renders the name alone when the backend reports the unknown sentinel", async () => {
    getBackendVersionInfoMock.mockResolvedValue({
      version: "unknown",
      commit: "abcdef123456",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(getBackendVersionInfoMock).toHaveBeenCalledTimes(1),
    );
    await Promise.resolve();
    expectNameOnly();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-footer-version");
  });
});
