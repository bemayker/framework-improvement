import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { version as bundleVersion } from "../../package.json";
import { fetchBackendBuild } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendBuild: vi.fn(),
}));

const fetchBackendBuildMock = vi.mocked(fetchBackendBuild);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendBuildMock.mockReset();
  });

  it("renders the app name, the backend version and the short commit when they resolve", async () => {
    fetchBackendBuildMock.mockResolvedValue({
      version: "0.1.0",
      commit: "0123456",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v0.1.0",
    );
    expect(screen.getByTestId("app-footer-commit").textContent).toBe(
      " (0123456)",
    );
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v0.1.0 (0123456)",
    );
  });

  it("renders the app name alone when the build cannot be resolved", async () => {
    fetchBackendBuildMock.mockResolvedValue(null);

    render(<AppFooter />);
    await vi.waitFor(() => expect(fetchBackendBuildMock).toHaveBeenCalled());

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("reads exactly the app name while the build is still loading", () => {
    fetchBackendBuildMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("shows the version alone when the commit is unusable", async () => {
    fetchBackendBuildMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toBeInTheDocument();
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes v0.1.0");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|\(\)/);
  });

  it("shows the backend version, not the frontend bundle's own", async () => {
    fetchBackendBuildMock.mockResolvedValue({
      version: "9.9.9",
      commit: "0123456",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "9.9.9",
    );
    expect(screen.getByTestId("app-footer")).not.toHaveTextContent(
      `v${bundleVersion}`,
    );
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendBuildMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
