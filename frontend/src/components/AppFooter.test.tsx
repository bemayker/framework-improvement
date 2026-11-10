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
        /^Task Notes v9\.9\.9$/,
      ),
    );
    expect(screen.getByTestId("app-footer-version")).toBeInTheDocument();
  });

  it("renders only the app name when the version request fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("offline"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());
    await Promise.resolve();

    const footer = screen.getByTestId("app-footer");
    expect(footer).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    for (const forbidden of ["undefined", "null", "unknown", " v"]) {
      expect(footer.textContent).not.toContain(forbidden);
    }
  });

  it("renders only the app name for the unresolved sentinel rejection", async () => {
    getBackendVersionMock.mockRejectedValue(
      new Error("Loading the version failed: backend version is unknown"),
    );

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalled());

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("renders only the app name while the version request is pending", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("requests the version once on mount", async () => {
    getBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    expect(getBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
