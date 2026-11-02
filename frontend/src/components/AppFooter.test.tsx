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

  it("renders the application name with the backend version once resolved", async () => {
    // 9.9.9 differs from the frontend package version on purpose.
    getBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v9.9.9",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v9.9.9",
    );
  });

  it("renders the application name alone while the version is pending", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the application name alone when the request fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the application name alone when the backend reports unknown", async () => {
    getBackendVersionMock.mockResolvedValue("unknown");

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
