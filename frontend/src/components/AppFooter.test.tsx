import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getVersion } from "../api/version";
import { version as frontendPackageVersion } from "../../package.json";

vi.mock("../api/version", () => ({
  getVersion: vi.fn(),
}));

const getVersionMock = vi.mocked(getVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    getVersionMock.mockReset();
    getVersionMock.mockResolvedValue(null);
  });

  it("renders the version the backend reports", async () => {
    getVersionMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v0.1.0",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v0.1.0",
    );
  });

  it("renders the first 7 characters of the commit next to the version", async () => {
    getVersionMock.mockResolvedValue({ version: "0.1.0", commit: "abc1234" });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(
      "(abc1234)",
    );
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v0.1.0 (abc1234)",
    );
  });

  it("shows the version alone when the backend reports no commit", async () => {
    getVersionMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v0.1.0",
    );
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("shows no commit while the version request is pending", () => {
    getVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("shows no commit when the version request fails", async () => {
    getVersionMock.mockRejectedValue(new Error("Loading the version failed: 500"));

    render(<AppFooter />);

    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders only the app name when the version request fails", async () => {
    getVersionMock.mockRejectedValue(new Error("Loading the version failed: 500"));

    render(<AppFooter />);

    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders only the app name when the backend reports the unknown sentinel", async () => {
    getVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders only the app name while the version request is pending", () => {
    getVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("shows the backend's version, not the frontend package version", async () => {
    getVersionMock.mockResolvedValue({ version: "9.9.9", commit: null });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer").textContent).not.toContain(
      `v${frontendPackageVersion}`,
    );
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
  });
});
