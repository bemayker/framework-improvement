import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendBuildInfo } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendBuildInfo: vi.fn(),
}));

const getBackendBuildInfoMock = vi.mocked(getBackendBuildInfo);

// The mocked request is already settled when the footer mounts; flushing the
// pending promise callbacks lets the resulting state update land before asserting.
async function settleVersionRequest() {
  await act(async () => {});
}

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendBuildInfoMock.mockReset();
    getBackendBuildInfoMock.mockResolvedValue({
      version: "1.2.3",
      commit: "abcdef123456",
    });
  });

  it("renders the version and the first 7 characters of the commit", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v1.2.3",
    );
    expect(screen.getByTestId("app-footer-commit")).toHaveTextContent("(abcdef1)");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v1.2.3 (abcdef1)",
    );
    expect(getBackendBuildInfoMock).toHaveBeenCalledTimes(1);
  });

  it("shows a commit shorter than 7 characters as is", async () => {
    getBackendBuildInfoMock.mockResolvedValue({ version: "1.2.3", commit: "abc" });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent("(abc)");
  });

  it("renders the version alone when the commit is unavailable", async () => {
    getBackendBuildInfoMock.mockResolvedValue({ version: "1.2.3", commit: null });

    render(<AppFooter />);

    await settleVersionRequest();
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes v1.2.3");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the app name only while the request is pending", () => {
    getBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the app name only when the request fails", async () => {
    getBackendBuildInfoMock.mockRejectedValue(new Error("Failed to fetch"));

    render(<AppFooter />);

    await settleVersionRequest();
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the app name only when the backend could not resolve its version, even with a commit", async () => {
    getBackendBuildInfoMock.mockResolvedValue({
      version: null,
      commit: "abcdef123456",
    });

    render(<AppFooter />);

    await settleVersionRequest();
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await screen.findByTestId("app-footer-version");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
