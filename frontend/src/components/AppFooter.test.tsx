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
  });

  it("renders the version from the backend once it resolves", async () => {
    getBackendVersionMock.mockResolvedValue("0.1.0");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v0.1.0",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v0.1.0");
  });

  it("renders the app name alone when the version request rejects", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the app name alone when the version resolves null", async () => {
    getBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer.textContent).not.toMatch(/undefined|null/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders only the app name while the request is pending", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
