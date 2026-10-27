import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

/**
 * Text that must never leak into the footer when no version is resolved.
 *
 * Callers wait with `waitFor`, whose act-wrapped polling lets the component's
 * then/catch settle before this runs. That is load-bearing: the failure and
 * null cases look identical to the initial state, so an assertion made before
 * the request settles would prove nothing. Verified by mutating AppFooter so a
 * failure or a null version rendered "broken": both tests fail.
 */
function expectNameOnlyFooter() {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe("Task Notes");
  expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
    fetchBackendVersionMock.mockResolvedValue({ version: null, commit: null });
  });

  it("renders the version and the short commit once they resolve", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "abc1234",
    });

    render(<AppFooter />);

    const commit = await screen.findByTestId("app-footer-commit");
    expect(commit).toHaveTextContent("(abc1234)");
    expect(screen.getByTestId("app-footer-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.9.9 (abc1234)",
    );
  });

  it("renders the version alone when the backend reports no usable commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "9.9.9", commit: null });

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes v9.9.9");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    expect(footer).not.toHaveTextContent(/undefined|null|unknown/);
  });

  it("renders the name alone when a commit arrives without a version", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: null,
      commit: "abc1234",
    });

    render(<AppFooter />);
    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));

    expectNameOnlyFooter();
  });

  it("renders the name alone when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);
    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));

    expectNameOnlyFooter();
  });

  it("renders the name alone when the backend reports neither version nor commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: null, commit: null });

    render(<AppFooter />);
    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));

    expectNameOnlyFooter();
  });

  it("renders the name alone while the version request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectNameOnlyFooter();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
