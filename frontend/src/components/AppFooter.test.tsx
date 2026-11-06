import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

function expectNoVersionText(footer: HTMLElement) {
  expect(footer.textContent).toBe("Task Notes");
  expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  expect(footer.textContent).not.toContain("()");
  expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
  expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
}

/** Lets the mocked version promise settle and its state update flush. */
async function settlePendingPromises() {
  await act(async () => {});
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the version and the first 7 characters of the commit once it resolves", async () => {
    // Deliberately unlike frontend/package.json's own version (0.0.0).
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "abcdef123456",
    });

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    await waitFor(() =>
      expect(footer.textContent).toBe("Task Notes v9.9.9 (abcdef1)"),
    );
    expect(screen.getByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-commit").textContent).toBe(" (abcdef1)");
    expect(footer.textContent).not.toMatch(/undefined|null|unknown|\(\)/);
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the version alone when the backend has no usable commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: null,
    });

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    await waitFor(() => expect(footer.textContent).toBe("Task Notes v9.9.9"));
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|unknown|\(\)/);
  });

  it("renders the app name alone while the version is still loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectNoVersionText(screen.getByTestId("app-footer"));
  });

  it("renders the app name alone when loading the version fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await settlePendingPromises();
    expectNoVersionText(screen.getByTestId("app-footer"));
  });

  it("renders the app name alone when the backend has no usable version", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await settlePendingPromises();
    expectNoVersionText(screen.getByTestId("app-footer"));
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
