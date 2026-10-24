import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersion: vi.fn(),
}));

const getBackendVersionMock = vi.mocked(getBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionMock.mockReset();
    getBackendVersionMock.mockResolvedValue("9.9.9");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-footer-version");
  });

  it("renders the version the backend client returns", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v9.9.9",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v9.9.9");
  });

  it("renders the name alone when the version load fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("Failed to fetch"));

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  });

  it("renders the name alone when the version is unresolved (null)", async () => {
    getBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the name alone while the version is still loading", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-footer-version");
  });
});
