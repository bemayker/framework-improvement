import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersionInfo } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersionInfo: vi.fn(),
}));

const getBackendVersionInfoMock = vi.mocked(getBackendVersionInfo);

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionInfoMock.mockReset();
  });

  it("renders the version returned by the backend rather than the frontend package version", async () => {
    getBackendVersionInfoMock.mockResolvedValue({ version: "9.8.7", commit: null });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.8.7");
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes v9\.8\.7$/);
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent("0.0.0");
  });

  it("renders the first 7 characters of the commit next to the version", async () => {
    getBackendVersionInfoMock.mockResolvedValue({ version: "0.1.0", commit: "3f9c2a7" });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-commit")).toHaveTextContent("(3f9c2a7)");
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      /^Task Notes v0\.1\.0 \(3f9c2a7\)$/,
    );
  });

  it("renders the version alone when the backend reports no commit", async () => {
    getBackendVersionInfoMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    await screen.findByTestId("app-version");
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes v0\.1\.0$/);
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders only the app name while the version request is pending", () => {
    getBackendVersionInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders only the app name when the version request fails", async () => {
    getBackendVersionInfoMock.mockRejectedValue(new Error("Loading the version failed"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionInfoMock).toHaveBeenCalledTimes(1));
    const footer = screen.getByTestId("app-footer");
    expect(footer).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
  });

  it("renders only the app name when the backend reports no version", async () => {
    getBackendVersionInfoMock.mockResolvedValue({ version: null, commit: "3f9c2a7" });

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionInfoMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    getBackendVersionInfoMock.mockResolvedValue({ version: "1.0.0", commit: null });

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-version");
  });
});
