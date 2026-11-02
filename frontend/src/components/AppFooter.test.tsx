import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { getBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  getBackendVersion: vi.fn(),
}));

const getBackendVersionMock = vi.mocked(getBackendVersion);

// Flushes the promise chain (then/catch) the footer attached, so assertions on
// the failure and unknown paths run after the state update would have landed.
async function settlePendingPromises() {
  await act(async () => {});
}

describe("AppFooter", () => {
  beforeEach(() => {
    getBackendVersionMock.mockReset();
  });

  it("renders the application name with the backend version and short commit once resolved", async () => {
    // 9.9.9 differs from the frontend package version on purpose.
    getBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "abc1234def56",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v9.9.9",
    );
    expect(screen.getByTestId("app-footer-commit")).toHaveTextContent(
      "(abc1234)",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v9.9.9 (abc1234)",
    );
  });

  it("renders the application name alone while the version is pending", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the application name alone when the request fails", async () => {
    getBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await settlePendingPromises();
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the application name alone when the backend reports an unknown version", async () => {
    getBackendVersionMock.mockResolvedValue({
      version: "unknown",
      commit: "abc1234def56",
    });

    render(<AppFooter />);

    await waitFor(() => expect(getBackendVersionMock).toHaveBeenCalledTimes(1));
    await settlePendingPromises();
    expect(screen.getByTestId("app-footer")).toHaveTextContent(/^Task Notes$/);
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the version alone when the backend reports an unknown commit", async () => {
    getBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "unknown",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v9.9.9",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      /^Task Notes v9\.9\.9$/,
    );
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the version alone when the response carries no commit", async () => {
    getBackendVersionMock.mockResolvedValue({ version: "9.9.9" });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v9.9.9",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      /^Task Notes v9\.9\.9$/,
    );
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the version alone when the commit is an empty string", async () => {
    getBackendVersionMock.mockResolvedValue({ version: "9.9.9", commit: "" });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v9.9.9",
    );
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    getBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
