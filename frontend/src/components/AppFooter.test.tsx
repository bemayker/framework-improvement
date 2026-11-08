import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendBuildInfo } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendBuildInfo: vi.fn(),
}));

const getBackendBuildInfoMock = vi.mocked(getBackendBuildInfo);

/** Asserts the footer is the app name alone, with no version or commit artefacts. */
function expectNameOnly() {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe("Task Notes");
  expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  expect(footer.textContent).not.toMatch(/undefined|null|unknown|error/i);
}

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendBuildInfoMock.mockReset();
  });

  it("renders the application name, the version and the commit when resolved", async () => {
    getBackendBuildInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: "a1b2c3d",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(
      "(a1b2c3d)",
    );
    expect(screen.getByTestId("app-footer-version")).toHaveTextContent("v0.1.0");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v0.1.0 (a1b2c3d)",
    );
  });

  it("renders the name and version without a commit when the commit is null", async () => {
    getBackendBuildInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: null,
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v0.1.0",
    );
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v0.1.0",
    );
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the name alone while the request is pending", () => {
    getBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectNameOnly();
  });

  it("renders the name alone when the request fails", async () => {
    getBackendBuildInfoMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendBuildInfoMock).toHaveBeenCalledTimes(1));
    expectNameOnly();
  });

  it("renders the name alone when the build info resolves to null", async () => {
    getBackendBuildInfoMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(getBackendBuildInfoMock).toHaveBeenCalledTimes(1));
    expectNameOnly();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
