import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the first 7 characters of the commit next to the version", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "0.1.0",
      commit: "4f2a9c1d8e7b",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v0.1.0 (4f2a9c1)",
      ),
    );
    expect(screen.getByTestId("app-footer-commit").textContent).toBe(" (4f2a9c1)");
  });

  it("renders no commit while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.queryByTestId("app-footer-commit")).toBeNull();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders no commit when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);
    await act(async () => {});

    expect(fetchBackendVersionMock).toHaveBeenCalled();
    expect(screen.queryByTestId("app-footer-commit")).toBeNull();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the version alone when the backend reports an unknown commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v0.1.0",
      ),
    );
    expect(screen.queryByTestId("app-footer-commit")).toBeNull();
  });

  it("renders the version returned by the backend", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v0.1.0",
      ),
    );
  });

  it("renders the app name alone while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).toBeNull();
  });

  it("renders the app name alone when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);
    // Flush the rejected promise so the assertion runs after the failure path.
    await act(async () => {});

    expect(fetchBackendVersionMock).toHaveBeenCalled();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the app name alone when the backend reports an unknown version", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);
    // Flush the resolved promise so the assertion runs after the result applied.
    await act(async () => {});

    expect(fetchBackendVersionMock).toHaveBeenCalled();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
