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

  it("renders the app name and the backend version once it resolves", async () => {
    getBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v9.9.9",
      ),
    );
    expect(getBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the app name alone while the version is loading", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the app name alone when the version request is rejected", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("Failed to fetch"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("renders the app name alone when no usable version is returned", async () => {
    getBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
