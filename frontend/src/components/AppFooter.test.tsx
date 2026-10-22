import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

// Lets the mocked promise's then/catch handlers run inside act, so the
// assertions that follow see the settled state rather than the loading one.
async function settlePendingPromises() {
  await act(async () => {});
}

function expectNoPlaceholderText(text: string | null) {
  expect(text).not.toMatch(/undefined|null|unknown/);
  expect(text).not.toContain("()");
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the version and the first 7 characters of the commit once it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "0123456789ab",
    });

    render(<AppFooter />);

    expect(await screen.findByText("Task Notes v9.9.9 (0123456)")).toBeInTheDocument();
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
    expectNoPlaceholderText(screen.getByTestId("app-footer").textContent);
  });

  it("renders the version alone when the response carries no commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: "9.9.9", commit: null });

    render(<AppFooter />);

    expect(await screen.findByText("Task Notes v9.9.9")).toBeInTheDocument();
    expectNoPlaceholderText(screen.getByTestId("app-footer").textContent);
  });

  it("renders the name alone while the version is still loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expectNoPlaceholderText(footer.textContent);
  });

  it("renders the name alone when the version fetch is rejected", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("Failed to fetch"));

    render(<AppFooter />);

    await settlePendingPromises();
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expectNoPlaceholderText(footer.textContent);
  });

  it("renders the name alone when the backend version is unresolved (null)", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: null, commit: "0123456789ab" });

    render(<AppFooter />);

    await settlePendingPromises();
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expectNoPlaceholderText(footer.textContent);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
