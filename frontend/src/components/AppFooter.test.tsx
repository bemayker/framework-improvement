import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

function expectNoVersionText(footer: HTMLElement) {
  expect(footer.textContent).toBe("Task Notes");
  expect(footer.textContent).not.toMatch(/undefined|null|unknown/);
  expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the backend version after the app name once it resolves", async () => {
    // Deliberately unlike frontend/package.json's own version (0.0.0).
    fetchBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v9.9.9",
      ),
    );
    expect(screen.getByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders the app name alone while the version is still loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectNoVersionText(screen.getByTestId("app-footer"));
  });

  it("renders the app name alone when loading the version fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    expectNoVersionText(screen.getByTestId("app-footer"));
  });

  it("renders the app name alone when the backend has no usable version", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    expectNoVersionText(screen.getByTestId("app-footer"));
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
