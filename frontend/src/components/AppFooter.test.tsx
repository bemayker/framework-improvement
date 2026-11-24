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
    getBackendVersionMock.mockResolvedValue({ version: "9.8.7", commit: null });
  });

  it("renders the first 7 characters of the build commit next to the version", async () => {
    getBackendVersionMock.mockResolvedValue({
      version: "9.8.7",
      commit: "a1b2c3d4e5f6",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-commit")).toHaveTextContent("(a1b2c3d)");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.8.7 (a1b2c3d)",
    );
  });

  it("renders the version alone when the backend reports no usable commit", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.8.7");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v9.8.7");
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
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders only the app name when the version request fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders only the app name when the backend reports the unknown sentinel", async () => {
    // The client maps the sentinel to null; the footer must show no suffix.
    getBackendVersionMock.mockResolvedValue({ version: null, commit: "a1b2c3d4e5f6" });

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
