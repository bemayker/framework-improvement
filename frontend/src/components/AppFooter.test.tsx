import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersion } from "../api/version";
import { version as packageVersion } from "../../package.json";

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

  it("renders the backend version, not the bundle's package.json version", async () => {
    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    await waitFor(() => expect(footer).toHaveTextContent("Task Notes v9.9.9"));
    expect(packageVersion).not.toBe("9.9.9");
    expect(footer).not.toHaveTextContent(`v${packageVersion}`);
  });

  it("renders the name alone when the version cannot be resolved", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("Failed to fetch"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the name alone when the client rejects the unknown sentinel", async () => {
    getBackendVersionMock.mockRejectedValue(
      new Error("Loading the version failed: backend version is unknown"),
    );

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the name alone while the version is still loading", () => {
    getBackendVersionMock.mockReturnValue(new Promise<string>(() => {}));

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
