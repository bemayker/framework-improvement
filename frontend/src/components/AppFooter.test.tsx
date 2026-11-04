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
    getBackendVersionMock.mockResolvedValue("1.2.3");
  });

  it("renders the application name and the version the backend served", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v1.2.3",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v1.2.3");
    expect(getBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the app name only while the version is loading", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the app name only when the version request fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("Failed to fetch"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the app name only when the backend could not resolve its version", async () => {
    getBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await screen.findByTestId("app-footer-version");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
