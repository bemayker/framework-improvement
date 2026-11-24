import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

// Differs from frontend/package.json (0.0.0) on purpose: proves the source.
const BACKEND_VERSION = "9.8.7";
const SHORT_COMMIT = "4e63112";

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
    fetchBackendVersionMock.mockResolvedValue({
      version: BACKEND_VERSION,
      commit: SHORT_COMMIT,
    });
  });

  it("renders the first 7 characters of the commit next to the backend version", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-commit")).toHaveTextContent(
      `(${SHORT_COMMIT})`,
    );
    expect(screen.getByTestId("app-footer").textContent).toBe(
      `Task Notes v${BACKEND_VERSION} (${SHORT_COMMIT})`,
    );
  });

  it("renders the version alone when the backend reports no commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: BACKEND_VERSION,
      commit: null,
    });

    render(<AppFooter />);
    await screen.findByTestId("app-version");

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe(`Task Notes v${BACKEND_VERSION}`);
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders the version the backend reports, not the frontend package version", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent(
      `v${BACKEND_VERSION}`,
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      `Task Notes v${BACKEND_VERSION}`,
    );
  });

  it("renders the app name without a version or commit while the request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders the app name without a version or commit when the request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);
    // The call is made on mount; flush the microtasks so the rejection has
    // settled before asserting, otherwise this would see the initial state.
    await act(async () => {});

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("renders the app name without a version when the backend reports unknown", async () => {
    // The client maps the backend's sentinel to null.
    fetchBackendVersionMock.mockResolvedValue({
      version: null,
      commit: SHORT_COMMIT,
    });

    render(<AppFooter />);
    await act(async () => {});

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/unknown|undefined|null/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await screen.findByTestId("app-version");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
