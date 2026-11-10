import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendBuildInfo } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendBuildInfo: vi.fn(),
}));

const getBackendBuildInfoMock = vi.mocked(getBackendBuildInfo);

const FORBIDDEN_TEXT = ["undefined", "null", "unknown", "("];

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendBuildInfoMock.mockReset();
  });

  it("renders the app name, the version and the 7-character commit once it resolves", async () => {
    getBackendBuildInfoMock.mockResolvedValue({
      version: "9.9.9",
      commit: "0123456789ab",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        /^Task Notes v9\.9\.9 \(0123456\)$/,
      ),
    );
    expect(screen.getByTestId("app-footer-version")).toBeInTheDocument();
    expect(screen.getByTestId("app-footer-commit").textContent).toBe(
      " (0123456)",
    );
  });

  it("renders the version alone when the commit is null", async () => {
    getBackendBuildInfoMock.mockResolvedValue({
      version: "9.9.9",
      commit: null,
    });

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    const footer = screen.getByTestId("app-footer");
    expect(footer).toHaveTextContent(/^Task Notes v9\.9\.9$/);
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    for (const forbidden of FORBIDDEN_TEXT) {
      expect(footer.textContent).not.toContain(forbidden);
    }
  });

  it("renders only the app name when the version request fails", async () => {
    getBackendBuildInfoMock.mockRejectedValue(new Error("offline"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendBuildInfoMock).toHaveBeenCalled());
    await Promise.resolve();

    const footer = screen.getByTestId("app-footer");
    expect(footer).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    for (const forbidden of [...FORBIDDEN_TEXT, " v"]) {
      expect(footer.textContent).not.toContain(forbidden);
    }
  });

  it("renders only the app name for the unresolved sentinel rejection", async () => {
    getBackendBuildInfoMock.mockRejectedValue(
      new Error("Loading the version failed: backend version is unknown"),
    );

    render(<AppFooter />);

    await waitFor(() => expect(getBackendBuildInfoMock).toHaveBeenCalled());

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
  });

  it("renders only the app name while the version request is pending", () => {
    getBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    for (const forbidden of FORBIDDEN_TEXT) {
      expect(footer.textContent).not.toContain(forbidden);
    }
  });

  it("requests the build info once on mount", async () => {
    getBackendBuildInfoMock.mockResolvedValue({
      version: "9.9.9",
      commit: "0123456789ab",
    });

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    expect(getBackendBuildInfoMock).toHaveBeenCalledTimes(1);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
