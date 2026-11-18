import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getVersion: vi.fn(),
  UNKNOWN_BACKEND_VERSION: "unknown",
  UNKNOWN_BACKEND_COMMIT: "unknown",
}));

const getVersionMock = vi.mocked(getVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    getVersionMock.mockReset();
    getVersionMock.mockResolvedValue({ version: "9.9.9", commit: null });
  });

  it("renders the first 7 characters of the commit next to the version", async () => {
    getVersionMock.mockResolvedValue({ version: "9.9.9", commit: "abcdef123456" });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-commit")).toHaveTextContent("(abcdef1)");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.9.9 (abcdef1)",
    );
  });

  it("renders no commit while the version request is pending", () => {
    getVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders no commit when the version request fails", async () => {
    getVersionMock.mockRejectedValue(new Error("Loading the version failed: 500"));

    render(<AppFooter />);

    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
    const footerText = screen.getByTestId("app-footer").textContent;
    expect(footerText).toBe("Task Notes");
    expect(footerText).not.toContain("undefined");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders the version alone when the backend reports an unknown commit", async () => {
    getVersionMock.mockResolvedValue({ version: "9.9.9", commit: "unknown" });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v9.9.9");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders the version alone when the backend sends no commit", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v9.9.9");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders the version the backend reports", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v9.9.9");
  });

  it("renders the app name without a version while the version request is pending", () => {
    getVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders the app name without a version when the version request fails", async () => {
    getVersionMock.mockRejectedValue(new Error("Loading the version failed: 500"));

    render(<AppFooter />);

    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders the app name without a version when the backend reports an unknown version", async () => {
    getVersionMock.mockResolvedValue({ version: "unknown", commit: "abcdef123456" });

    render(<AppFooter />);

    await waitFor(() => expect(getVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
