import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendBuildInfo } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendBuildInfo: vi.fn(),
}));

const getBackendBuildInfoMock = vi.mocked(getBackendBuildInfo);

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendBuildInfoMock.mockReset();
    getBackendBuildInfoMock.mockResolvedValue({ version: "9.8.7", commit: "abc123def456" });
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-footer-version");
  });

  it("shows only the name while the version is loading", async () => {
    getBackendBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("shows the version the backend reported", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "9.8.7",
    );
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.8.7 · abc123d",
    );
  });

  it("shows the first 7 characters of the commit and never the full commit", async () => {
    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(
      /^abc123d$/,
    );
    expect(screen.getByTestId("app-footer").textContent).not.toContain(
      "abc123def456",
    );
  });

  it("shows a commit shorter than 7 characters whole", async () => {
    getBackendBuildInfoMock.mockResolvedValue({ version: "9.8.7", commit: "abc" });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(
      /^abc$/,
    );
  });

  it("shows the version alone when the commit is unusable", async () => {
    getBackendBuildInfoMock.mockResolvedValue({ version: "9.8.7", commit: null });

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.8.7",
    );
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it.each([
    ["the version cannot be resolved", () => getBackendBuildInfoMock.mockResolvedValue(null)],
    [
      "the request fails",
      () => getBackendBuildInfoMock.mockRejectedValue(new Error("network down")),
    ],
  ])("renders without a version when %s", async (_label, arrange) => {
    arrange();

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    await waitFor(() =>
      expect(footer.textContent).toBe("Task Notes · version unavailable"),
    );
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    expect(footer.textContent).not.toContain("undefined");
    expect(footer.textContent).not.toContain("null");
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-footer-version");
  });
});
