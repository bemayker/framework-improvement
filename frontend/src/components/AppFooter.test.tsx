import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersionInfo } from "../api/version";
import { version as packageVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  getBackendVersionInfo: vi.fn(),
}));

const getBackendVersionInfoMock = vi.mocked(getBackendVersionInfo);

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionInfoMock.mockReset();
    getBackendVersionInfoMock.mockResolvedValue({
      version: "9.9.9",
      commit: null,
    });
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-version");
  });

  it("renders the version the backend reports", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v9.9.9");
  });

  it("renders the backend version, not the frontend package.json version", async () => {
    render(<AppFooter />);

    await screen.findByTestId("app-version");

    expect(packageVersion).not.toBe("9.9.9");
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      `v${packageVersion}`,
    );
  });

  it("renders the app name without a version while the request is pending", () => {
    getBackendVersionInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders the app name without a version when the request fails", async () => {
    getBackendVersionInfoMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() =>
      expect(getBackendVersionInfoMock).toHaveBeenCalledTimes(1),
    );
    await Promise.resolve();

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
  });

  it("renders the app name without a version when the backend cannot resolve one", async () => {
    getBackendVersionInfoMock.mockResolvedValue({ version: null, commit: null });

    render(<AppFooter />);

    await waitFor(() =>
      expect(getBackendVersionInfoMock).toHaveBeenCalledTimes(1),
    );
    await Promise.resolve();

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-version");
  });

  it("renders the first 7 characters of the build commit next to the version", async () => {
    getBackendVersionInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: "a1b2c3d",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-commit")).toHaveTextContent("a1b2c3d");
    expect(screen.getByTestId("app-version")).toHaveTextContent("v0.1.0");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v0.1.0 (a1b2c3d)",
    );
  });

  it("renders no commit while the request is pending", () => {
    getBackendVersionInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders no commit and no error when the request fails", async () => {
    getBackendVersionInfoMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() =>
      expect(getBackendVersionInfoMock).toHaveBeenCalledTimes(1),
    );
    await Promise.resolve();

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
    expect(footer).not.toHaveTextContent(/undefined|null|unknown|error/i);
  });

  it("renders the version alone when the backend reports no commit", async () => {
    getBackendVersionInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: null,
    });

    render(<AppFooter />);

    await screen.findByTestId("app-version");

    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v0.1.0",
    );
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders no commit when the backend reports no version", async () => {
    getBackendVersionInfoMock.mockResolvedValue({
      version: null,
      commit: "a1b2c3d",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(getBackendVersionInfoMock).toHaveBeenCalledTimes(1),
    );
    await Promise.resolve();

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });
});
