import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getVersion: vi.fn(),
}));

const getVersionMock = vi.mocked(getVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    getVersionMock.mockReset();
  });

  it("renders the application name", async () => {
    getVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toBeInTheDocument();
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
  });

  it("renders the version the backend reported", async () => {
    getVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v1.2.3",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v1.2.3",
    );
  });

  it("renders the footer without a version when the backend call fails", async () => {
    getVersionMock.mockRejectedValue(
      new Error("Loading the version failed: 500 Internal Server Error"),
    );

    render(<AppFooter />);

    expect(
      await screen.findByTestId("app-footer-version-unavailable"),
    ).toHaveTextContent("version unavailable");

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes · version unavailable");
    expect(footer.textContent).not.toContain("undefined");
    expect(footer.textContent).not.toContain("null");
    expect(screen.queryByTestId("app-footer-version")).toBeNull();
  });

  it("renders only the application name while the version is still loading", () => {
    getVersionMock.mockReturnValue(new Promise<string>(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).toBeNull();
    expect(screen.queryByTestId("app-footer-version-unavailable")).toBeNull();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    getVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    // Settles the mount-time fetch so its state update stays inside act().
    await screen.findByTestId("app-footer-version");
  });
});
