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

  it("renders the application name", async () => {
    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
  });

  it("renders the version the backend reports", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v1.2.3",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v1.2.3",
    );
  });

  it("renders the backend version, not the frontend package.json version", async () => {
    getBackendVersionMock.mockResolvedValue("7.7.7");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v7.7.7",
    );
    expect(getBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the app name without a version while the request is pending", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the app name without a version when the backend is unreachable", async () => {
    getBackendVersionMock.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the app name without a version when the backend reports an empty version", async () => {
    getBackendVersionMock.mockRejectedValue(
      new Error("Loading the version failed: response carried no version"),
    );

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
