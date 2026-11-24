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
    getBackendVersionMock.mockResolvedValue("9.8.7");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
  });

  it("renders the backend version once /api/version resolves", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.8.7");
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes v9.8.7");
  });

  it("renders only the app name while the version request is pending", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders only the app name when the version request fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders only the app name when the backend reports the unknown sentinel", async () => {
    // The client maps the sentinel to null; the footer must show no suffix.
    getBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/unknown|undefined|null/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
  });
});
