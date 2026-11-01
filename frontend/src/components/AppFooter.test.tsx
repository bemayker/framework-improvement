import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendBuild } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendBuild: vi.fn(),
}));

const getBackendBuildMock = vi.mocked(getBackendBuild);

function footerText(): string | null {
  return screen.getByTestId("app-footer").textContent;
}

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendBuildMock.mockReset();
  });

  it("renders the backend version and short commit once they resolve", async () => {
    getBackendBuildMock.mockResolvedValue({ version: "0.1.0", commit: "0123456" });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-commit")).toBeInTheDocument();
    expect(screen.getByTestId("app-version")).toBeInTheDocument();
    expect(footerText()).toBe("Task Notes v0.1.0 (0123456)");
  });

  it("renders the fetched version, not the frontend package version", async () => {
    getBackendBuildMock.mockResolvedValue({ version: "9.9.9", commit: null });

    render(<AppFooter />);

    await screen.findByTestId("app-version");
    expect(footerText()).toBe("Task Notes v9.9.9");
  });

  it("shows the version alone when the commit is null", async () => {
    getBackendBuildMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    await screen.findByTestId("app-version");
    expect(footerText()).toBe("Task Notes v0.1.0");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("reads exactly the app name while the build is still loading", () => {
    getBackendBuildMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(footerText()).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("reads exactly the app name when the build request fails", async () => {
    getBackendBuildMock.mockRejectedValue(new Error("offline"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendBuildMock).toHaveBeenCalledTimes(1));
    expect(footerText()).toBe("Task Notes");
    expect(footerText()).not.toMatch(/undefined|null|unknown|Error/);
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("reads exactly the app name when the client resolves to null", async () => {
    getBackendBuildMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(getBackendBuildMock).toHaveBeenCalledTimes(1));
    expect(footerText()).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendBuildMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
