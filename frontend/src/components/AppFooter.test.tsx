import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version");

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

// Lets the component's .then/.catch handlers run before asserting, so a failure or
// unresolved-version state is checked after it was handled, not before.
async function settlePromiseHandlers() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function expectFooterWithoutVersion() {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe("Task Notes");
  expect(footer.textContent).not.toMatch(/undefined|null|unknown|error/i);
  expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the application name", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "0.1.0", commit: null });
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-footer-version");
  });

  it("renders the version and the short commit once they resolve", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "0.1.0", commit: "abc1234" });
    render(<AppFooter />);

    const commit = await screen.findByTestId("app-footer-commit");
    expect(commit.textContent).toBe(" (abc1234)");
    expect(screen.getByTestId("app-footer-version").textContent).toBe(" v0.1.0");
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v0.1.0 (abc1234)");
  });

  it("renders the version alone when no commit resolved", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "0.1.0", commit: null });
    render(<AppFooter />);

    const version = await screen.findByTestId("app-footer-version");
    expect(version.textContent).toBe(" v0.1.0");
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes v0.1.0");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("shows the version the client returned and fetches it once on mount", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "9.9.9", commit: null });
    render(<AppFooter />);

    await screen.findByText("v9.9.9", { exact: false });
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the app name alone while the request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));
    render(<AppFooter />);

    expectFooterWithoutVersion();
  });

  it("renders the app name alone when the request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));
    render(<AppFooter />);

    await settlePromiseHandlers();
    expectFooterWithoutVersion();
  });

  it("renders the app name alone when the backend version is unresolved", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);
    render(<AppFooter />);

    await settlePromiseHandlers();
    expectFooterWithoutVersion();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "0.1.0", commit: null });
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
    await screen.findByTestId("app-footer-version");
  });
});
