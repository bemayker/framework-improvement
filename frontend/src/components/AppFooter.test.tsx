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

  it("renders the application name and the backend version once it resolves", async () => {
    getBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes v9\.9\.9$/);
  });

  it("renders the application name alone while the version is loading", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("renders the application name alone when the version cannot be loaded", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("Loading the version failed: 500"));

    render(<AppFooter />);
    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    // Let the rejection settle so a late state update would show up here.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const text = screen.getByTestId("app-footer").textContent;
    expect(text).toBe("Task Notes");
    for (const forbidden of ["undefined", "null", "unknown", "v "]) {
      expect(text).not.toContain(forbidden);
    }
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });

  it("requests the version once on mount", async () => {
    getBackendVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);
    await screen.findByTestId("app-version");

    expect(getBackendVersionMock).toHaveBeenCalledTimes(1);
  });
});
